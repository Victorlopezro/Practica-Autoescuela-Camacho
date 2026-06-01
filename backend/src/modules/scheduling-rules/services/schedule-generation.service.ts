import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import { SchedulingAiService } from '../../scheduling/scheduling-ai.service';
import { ScheduleGenerationItemDto } from '../dto/schedule-generation-item.dto';

export interface ApplyScheduleRuleInput {
  ruleId: string;
  naturalLanguage?: string;
  scheduleData?: ScheduleGenerationItemDto[];
}

export interface GenerationResult {
  generatedRows: number;
  skippedItems: number;
  warnings: string[];
  aiFailed?: boolean;
  detectedAction?: 'doubleBooking';
}

@Injectable()
export class ScheduleGenerationService {
  private readonly logger = new Logger(ScheduleGenerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: SchedulingAiService,
  ) {}

  async applyScheduleRule(input: ApplyScheduleRuleInput): Promise<GenerationResult> {
    this.logger.log(
      `applyScheduleRule called: ruleId=${input.ruleId}, naturalLanguage="${input.naturalLanguage?.substring(0, 80)}", scheduleData=${input.scheduleData ? 'yes' : 'no'}`,
    );

    const result: GenerationResult = {
      generatedRows: 0,
      skippedItems: 0,
      warnings: [],
    };

    // Fetch all teachers upfront (used for AI prompt + teacher resolution)
    const allTeachers = await this.prisma.teacher.findMany({
      select: { id: true, name: true },
    });
    const teacherNames = allTeachers.map((t) => t.name);

    let schedule: ScheduleGenerationItemDto[] = [];

    // Step 1: If naturalLanguage provided, try AI translation
    if (input.naturalLanguage) {
      try {
        const aiResult = await this.aiService.translateGenerationRule(
          input.naturalLanguage,
          teacherNames,
        );
        if (aiResult.error) {
          // AI returned structured error
          if (input.scheduleData) {
            schedule = input.scheduleData;
            result.warnings.push(
              `AI translation issue: ${aiResult.error}. Using manual scheduleData.`,
            );
            result.aiFailed = true;
          } else {
            result.warnings.push(
              `AI translation failed: ${aiResult.error}. Rule created but no availability generated. Edit the rule or provide scheduleData.`,
            );
            result.aiFailed = true;
            return result;
          }
        } else {
          // Map AI result to ScheduleGenerationItemDto format
          this.logger.log(`AI returned schedule: ${JSON.stringify(aiResult.schedule)}`);
          schedule = aiResult.schedule.map((item) => ({
            teacher: item.teacher,
            schedule: item.daysOfWeek.map((day) => ({
              dayOfWeek: day,
              startTime: item.startTime,
              endTime: item.endTime,
            })),
            track: item.track ?? undefined,
          }));

          // Pass detected action from AI
          if (aiResult.action) {
            result.detectedAction = aiResult.action;
          }
        }
      } catch (error) {
        // Network/parse error
        this.logger.error(`AI translation threw: ${error}`);
        if (input.scheduleData) {
          schedule = input.scheduleData;
          result.warnings.push(
            'AI translation unavailable. Using manual scheduleData.',
          );
          result.aiFailed = true;
        } else {
          result.warnings.push(
            'AI translation failed. Rule created but no availability generated.',
          );
          result.aiFailed = true;
          return result;
        }
      }
    } else if (input.scheduleData) {
      schedule = input.scheduleData;
    } else {
      result.warnings.push('No naturalLanguage or scheduleData provided.');
      return result;
    }

    // Step 2: Resolve teachers and build rows (use cached allTeachers)
    const teacherMap = new Map(allTeachers.map((t) => [t.name.toLowerCase(), t]));

    const rowsToCreate: Array<{
      teacherId: string;
      ruleId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      track: string | null;
    }> = [];

    for (const item of schedule) {
      // Defensive: skip if teacher is a placeholder value (AI didn't resolve correctly)
      const placeholderPatterns = [
        'nombre completo',
        'nombre del profesor',
        'teacher name',
        'full name',
        'nombre',
        'profesor',
      ];
      const normalized = item.teacher.toLowerCase().trim();
      const isPlaceholder = placeholderPatterns.some((p) => normalized.includes(p));

      if (isPlaceholder) {
        this.logger.warn(
          `AI returned placeholder teacher value "${item.teacher}" — skipping item. Consider regenerating the rule.`,
        );
        result.skippedItems++;
        result.warnings.push(
          `La IA devolvió un valor placeholder ("${item.teacher}") en vez de un profesor real o "ALL". Regenerá la regla o editá el schedule manualmente.`,
        );
        result.aiFailed = true;
        continue;
      }

      // Check for "ALL" marker (todos los profesores)
      let teachersToApply = allTeachers;

      if (normalized !== 'all') {
        // Try to resolve to a specific teacher
        const resolved =
          teacherMap.get(normalized) ??
          allTeachers.find((t) => t.name.toLowerCase().includes(normalized));

        if (!resolved) {
          result.skippedItems++;
          result.warnings.push(
            `Teacher "${item.teacher}" not found. Skipping.`,
          );
          continue;
        }
        teachersToApply = [resolved];
      }

      for (const teacher of teachersToApply) {
        for (const dayTime of item.schedule) {
          rowsToCreate.push({
            teacherId: teacher.id,
            ruleId: input.ruleId,
            dayOfWeek: dayTime.dayOfWeek,
            startTime: dayTime.startTime,
            endTime: dayTime.endTime,
            track: item.track ?? null,
          });
        }
      }
    }

    this.logger.log(
      `Teacher resolution: ${rowsToCreate.length} potential rows built from ${schedule.length} schedule items (${allTeachers.length} teachers available). [Rule: ${input.ruleId}]`,
    );

    // ── Fetch current rule priority for conflict resolution ──
    const currentRulePriority = (
      await this.prisma.schedulingRule.findUnique({
        where: { id: input.ruleId },
        select: { priority: true },
      })
    )?.priority ?? 100;

    // Step 2.5: Detect if this is the first application of this rule.
    const isFirstApplication =
      (await this.prisma.teacherAvailability.count({
        where: { ruleId: input.ruleId },
      })) === 0;

    // Phase 1: Clean legacy manual rows created BEFORE the rule existed.
    //
    // We use createdAt to distinguish:
    //   - Row created BEFORE the rule → legacy data → cleaned
    //   - Row created AFTER the rule  → intentional override → preserved
    //
    // This preserves the hierarchy: manual overrides > rules.
    // On EVERY application we clean only rows older than the rule's creation,
    // so legacy data is removed even if the rule was applied before this fix existed.
    const ruleCreatedAt = (
      await this.prisma.schedulingRule.findUnique({
        where: { id: input.ruleId },
        select: { createdAt: true },
      })
    )?.createdAt;

    let cleanedLegacyCount = 0;

    if (ruleCreatedAt) {
      // Clean manual rows for affected teachers' (teacher, day) pairs
      // that were created BEFORE the rule existed
      const pairSet = new Set(rowsToCreate.map((r) => `${r.teacherId}|${r.dayOfWeek}`));
      for (const key of pairSet) {
        const [teacherId, dayOfWeekStr] = key.split('|');
        const result = await this.prisma.teacherAvailability.deleteMany({
          where: {
            teacherId,
            dayOfWeek: parseInt(dayOfWeekStr, 10),
            ruleId: null,
            createdAt: { lt: ruleCreatedAt },
          },
        });
        cleanedLegacyCount += result.count;
      }

      if (cleanedLegacyCount > 0) {
        this.logger.log(
          `Cleaned ${cleanedLegacyCount} legacy manual row(s) older than rule creation (${ruleCreatedAt.toISOString()})`,
        );
      }
    }

    // Step 3: Check for cross-rule conflicts + dedup by (teacherId, dayOfWeek).
    // Manual rows (ruleId=null) are intentional overrides and always win over rules.
    // Cross-rule conflicts are resolved by priority (lower number = higher priority).
    const nonConflictingRows: typeof rowsToCreate = [];
    const seenKeys = new Set<string>();
    const rowsToOverride = new Set<string>(); // IDs of rows to delete from lower-priority rules
    let skippedByConflict = 0;
    let skippedDuplicates = 0;

    for (const row of rowsToCreate) {
      const key = `${row.teacherId}|${row.dayOfWeek}`;

      // Safety net: skip if we already queued a row for this (teacher, day).
      // Prevents P2002 when AI generates overlapping schedule items for the same day.
      if (seenKeys.has(key)) {
        skippedDuplicates++;
        this.logger.warn(
          `Skipping duplicate row for teacher ${row.teacherId} day ${row.dayOfWeek} track ${row.track}: already have a row for this (teacher, day)`,
        );
        continue;
      }

      // Conflict check: another rule already claims this (teacher, day).
      const conflictingRow = await this.prisma.teacherAvailability.findFirst({
        where: {
          teacherId: row.teacherId,
          dayOfWeek: row.dayOfWeek,
          ruleId: { not: input.ruleId },
        },
      });

      if (conflictingRow) {
        // Manual row (ruleId=null) — already cleaned in Phase 1 for conflicting pairs,
        // but may still exist for non-conflicting days. Either way, manual wins over rules.
        if (!conflictingRow.ruleId) {
          skippedByConflict++;
          continue;
        }

        if (!isFirstApplication) {
          // RE-APPLICATION: The user explicitly edited and re-applied this rule.
          // The new rows take effect regardless of other rules' priorities.
          // Conflicting rows from other rules are overridden.
          rowsToOverride.add(conflictingRow.id);
          this.logger.log(
            `Re-apply override for teacher ${row.teacherId} day ${row.dayOfWeek}: ` +
            `rule ${input.ruleId} overrides rule ${conflictingRow.ruleId}`,
          );
        } else {
          // FIRST APPLICATION: Compare priorities to determine who wins.
          const otherRule = await this.prisma.schedulingRule.findUnique({
            where: { id: conflictingRow.ruleId },
            select: { priority: true, deletedAt: true },
          });

          const otherActive = otherRule && !otherRule.deletedAt;
          // Strictly less: with equal priority, the NEW rule wins (last applied takes effect).
          // This prevents a rule that was previously applied but created 0 rows
          // (all skipped by conflict) from being permanently blocked on re-apply.
          const otherOutranks = otherActive && otherRule.priority < currentRulePriority;

          if (otherOutranks) {
            // Other rule is active AND has strictly higher priority — skip
            skippedByConflict++;
            this.logger.warn(
              `Skipping row for teacher ${row.teacherId} day ${row.dayOfWeek}: ` +
              `existing entry from rule ${conflictingRow.ruleId} ` +
              `(priority ${otherRule!.priority}) outranks current rule (priority ${currentRulePriority})`,
            );
            continue;
          }

          // Current rule has strictly higher priority (lower number)
          // OR the other rule was deleted — override the conflicting row
          rowsToOverride.add(conflictingRow.id);
          this.logger.log(
            `Overriding row for teacher ${row.teacherId} day ${row.dayOfWeek}: ` +
            `rule ${input.ruleId} (priority ${currentRulePriority}) > ` +
            `rule ${conflictingRow.ruleId} (priority ${otherRule?.priority ?? 'deleted'})`,
          );
        }
      }

      seenKeys.add(key);
      nonConflictingRows.push(row);
    }

    if (skippedDuplicates > 0) {
      result.warnings.push(
        `${skippedDuplicates} bloque(s) duplicado(s) omitido(s) para el mismo profesor y día.`,
      );
    }

    // Step 4: Delete old rule rows + overridden rows, then create new ones
    if (nonConflictingRows.length > 0) {
      // Delete existing rows for this rule (from previous applications)
      await this.prisma.teacherAvailability.deleteMany({
        where: { ruleId: input.ruleId },
      });

      // Delete rows from lower-priority rules that we're overriding
      const overrideIds = [...rowsToOverride];
      if (overrideIds.length > 0) {
        const delResult = await this.prisma.teacherAvailability.deleteMany({
          where: { id: { in: overrideIds } },
        });
        if (delResult.count > 0) {
          this.logger.log(
            `Deleted ${delResult.count} row(s) from lower-priority rules for rule ${input.ruleId}`,
          );
        }
      }

      try {
        await this.prisma.teacherAvailability.createMany({
          data: nonConflictingRows,
        });
      } catch (error) {
        const errorDetails = error instanceof Prisma.PrismaClientKnownRequestError
          ? `prisma-code:${error.code} meta:${JSON.stringify(error.meta)}`
          : `type:${typeof error} message:${error}`;
        this.logger.error(
          `createMany FAILED for rule ${input.ruleId}. Details: ${errorDetails}`,
        );
        this.logger.warn(
          `nonConflictingRows count=${nonConflictingRows.length}, sample=${JSON.stringify(nonConflictingRows.slice(0, 3))}`,
        );
        result.generatedRows = 0;
        result.warnings.push(
          `Error al crear disponibilidad (${errorDetails}). Revisa reglas duplicadas o contacta a soporte.`,
        );
        return result;
      }

      // Phase 5: Clean manual rows for days NOT covered by the rule's scope.
      //
      // If a rule covers Mon-Fri, any manual rows for Sat/Sun that existed
      // before the rule was created should be cleaned → the teacher shows as
      // unavailable on those days.
      //
      // Only cleans rows older than the rule (createdAt < ruleCreatedAt),
      // preserving intentional manual overrides made after the rule's creation.
      if (ruleCreatedAt) {
        const coveredDays = new Set(rowsToCreate.map((r) => r.dayOfWeek));
        const teacherIds = [...new Set(rowsToCreate.map((r) => r.teacherId))];
        let cleanedNonCoveredCount = 0;

        for (const teacherId of teacherIds) {
          const result = await this.prisma.teacherAvailability.deleteMany({
            where: {
              teacherId,
              dayOfWeek: { notIn: [...coveredDays] },
              ruleId: null,
              createdAt: { lt: ruleCreatedAt },
            },
          });
          cleanedNonCoveredCount += result.count;
        }

        if (cleanedNonCoveredCount > 0) {
          this.logger.log(
            `Phase 5: Cleaned ${cleanedNonCoveredCount} manual row(s) for days outside rule scope (teacher(s) ${teacherIds.join(',')})`,
          );
        }
      }
    }

    if (skippedByConflict > 0) {
      result.skippedItems += skippedByConflict;
      result.warnings.push(
        `${skippedByConflict} bloque(s) omitido(s) porque otra regla de prioridad igual o superior ya cubre ese profesor y día, o porque el horario se modificó manualmente.`,
      );
    }

    if (rowsToOverride.size > 0) {
      result.warnings.push(
        `${rowsToOverride.size} bloque(s) de reglas con menor prioridad reemplazado(s) por esta regla.`,
      );
    }

    result.generatedRows = nonConflictingRows.length;
    this.logger.log(
      `Rule ${input.ruleId}: ${nonConflictingRows.length} rows created, ` +
      `${skippedByConflict} skipped (manual or higher-priority rule), ` +
      `${rowsToOverride.size} lower-priority rows overridden, ` +
      `${cleanedLegacyCount} legacy manual rows cleaned`,
    );
    return result;
  }

  async removeScheduleRule(
    ruleId: string,
  ): Promise<{ deletedRows: number; reappliedRules: number; clonedRows: number }> {
    // Step 1: Capture affected teachers (who had rows from this rule)
    const affectedRows = await this.prisma.teacherAvailability.findMany({
      where: { ruleId },
      select: { teacherId: true },
      distinct: ['teacherId'],
    });
    const affectedTeacherIds = [
      ...new Set(affectedRows.map((r) => r.teacherId)),
    ];

    // Step 1b: Fallback — if no rows, check the deleted rule's appliesTo.teachers
    if (affectedTeacherIds.length === 0) {
      const deletedRule = await this.prisma.schedulingRule.findUnique({
        where: { id: ruleId },
        select: { appliesTo: true },
      });
      if (deletedRule?.appliesTo) {
        const appliesTo = deletedRule.appliesTo as Record<string, unknown>;
        const scopedIds = appliesTo['teachers'] as string[] | undefined;
        if (Array.isArray(scopedIds) && scopedIds.length > 0) {
          affectedTeacherIds.push(...scopedIds);
          this.logger.log(
            `removeScheduleRule: no rows found for rule ${ruleId}, using appliesTo.teachers (${scopedIds.length} teacher(s)) as fallback`,
          );
        }
      }
    }

    // Step 2: Delete all availability rows for this rule
    const result = await this.prisma.teacherAvailability.deleteMany({
      where: { ruleId },
    });

    // Step 3: Re-apply other active generation rules for affected teachers.
    // Clones existing rows from other teachers so no AI re-invocation is needed.
    let reappliedRules = 0;
    let clonedRows = 0;

    if (affectedTeacherIds.length > 0) {
      const otherRules = await this.prisma.schedulingRule.findMany({
        where: {
          id: { not: ruleId },
          category: 'generation',
          enabled: true,
          deletedAt: null,
        },
      });

      for (const rule of otherRules) {
        // Fetch distinct (day, time, track) combos from ANY teacher that has this rule
        const existingRows = await this.prisma.teacherAvailability.findMany({
          where: { ruleId: rule.id },
          select: {
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            track: true,
          },
          distinct: ['dayOfWeek', 'startTime', 'endTime', 'track'],
        });

        if (existingRows.length === 0) {
          continue; // No rows to clone (rule hasn't been applied yet)
        }

        for (const teacherId of affectedTeacherIds) {
          // Check if this rule is scoped to specific teachers (appliesTo)
          if (rule.appliesTo) {
            const appliesTo = rule.appliesTo as Record<string, unknown>;
            const scopedTeacherIds = appliesTo['teachers'] as string[] | undefined;
            if (Array.isArray(scopedTeacherIds) && scopedTeacherIds.length > 0) {
              if (!scopedTeacherIds.includes(teacherId)) {
                continue; // Rule doesn't apply to this teacher
              }
            }
          }

          // BUGFIX: delete existing rows for this teacher+rule FIRST, then clone fresh.
          // Previously we used alreadyHas > 0 to skip, but a teacher might have partial
          // coverage (e.g., only Monday from the base rule after a higher-priority rule
          // overrode Tue-Fri). Skipping would leave them with just 1 day instead of all 5.
          // Delete first ensures the teacher gets the COMPLETE template.
          const existingCount = await this.prisma.teacherAvailability.count({
            where: { teacherId, ruleId: rule.id },
          });
          if (existingCount > 0) {
            const delCount = await this.prisma.teacherAvailability.deleteMany({
              where: { teacherId, ruleId: rule.id },
            });
            this.logger.log(
              `removeScheduleRule: removed ${delCount.count} stale row(s) for teacher ${teacherId} rule "${rule.name}" before re-cloning`,
            );
          }

          // Clone rows from the template to this affected teacher
          const newRows = existingRows.map((row) => ({
            teacherId,
            dayOfWeek: row.dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            track: row.track,
            ruleId: rule.id,
          }));

          await this.prisma.teacherAvailability.createMany({ data: newRows });
          reappliedRules++;
          clonedRows += newRows.length;

          this.logger.log(
            `removeScheduleRule: cloned ${newRows.length} rows from rule "${rule.name}" (${rule.id}) to teacher ${teacherId}`,
          );
        }
      }

      if (reappliedRules > 0) {
        this.logger.log(
          `removeScheduleRule: ${reappliedRules} rules re-applied, ${clonedRows} rows cloned for ${affectedTeacherIds.length} affected teacher(s) after deleting rule ${ruleId}`,
        );
      }
    }

    return { deletedRows: result.count, reappliedRules, clonedRows };
  }

  /**
   * Apply all active generation rules to a newly created teacher.
   *
   * For each active generation rule, this clones the existing availability
   * rows (from any teacher that already has them for that rule) to the new
   * teacher. This ensures that rules created BEFORE the teacher existed
   * still take effect without needing to re-invoke the AI.
   *
   * Rules with appliesTo.teachers that don't include the new teacher are
   * skipped (the rule was explicitly scoped to specific teachers).
   */
  async applyExistingRulesToNewTeacher(teacherId: string): Promise<{
    rulesApplied: number;
    rowsCreated: number;
    rulesSkipped: number;
  }> {
    const genRules = await this.prisma.schedulingRule.findMany({
      where: {
        category: 'generation',
        enabled: true,
        deletedAt: null,
      },
    });

    let rulesApplied = 0;
    let rowsCreated = 0;
    let rulesSkipped = 0;

    for (const rule of genRules) {
      // Skip rules that have appliesTo.teachers that don't include this teacher
      if (rule.appliesTo) {
        const appliesTo = rule.appliesTo as Record<string, unknown>;
        const teacherIds = appliesTo['teachers'] as string[] | undefined;
        if (Array.isArray(teacherIds) && teacherIds.length > 0) {
          if (!teacherIds.includes(teacherId)) {
            rulesSkipped++;
            continue;
          }
        }
      }

      // Fetch distinct availability rows for this rule (from any teacher)
      // Using groupBy to get distinct (dayOfWeek, startTime, endTime, track) combos
      const existingRows = await this.prisma.teacherAvailability.findMany({
        where: { ruleId: rule.id },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          track: true,
        },
        distinct: ['dayOfWeek', 'startTime', 'endTime', 'track'],
      });

      if (existingRows.length === 0) {
        this.logger.warn(
          `applyExistingRulesToNewTeacher: rule "${rule.name}" (${rule.id}) has no existing rows to clone. Skipping.`,
        );
        rulesSkipped++;
        continue;
      }

      // Check if the teacher already has rows for this rule (shouldn't happen for new teacher, but safety)
      const alreadyHas = await this.prisma.teacherAvailability.count({
        where: { teacherId, ruleId: rule.id },
      });

      if (alreadyHas > 0) {
        this.logger.log(
          `applyExistingRulesToNewTeacher: teacher ${teacherId} already has ${alreadyHas} rows for rule "${rule.name}". Skipping.`,
        );
        rulesSkipped++;
        continue;
      }

      // Clone rows for the new teacher
      const newRows = existingRows.map((row) => ({
        teacherId,
        dayOfWeek: row.dayOfWeek,
        startTime: row.startTime,
        endTime: row.endTime,
        track: row.track,
        ruleId: rule.id,
      }));

      await this.prisma.teacherAvailability.createMany({ data: newRows });
      rulesApplied++;
      rowsCreated += newRows.length;

      this.logger.log(
        `applyExistingRulesToNewTeacher: cloned ${newRows.length} rows from rule "${rule.name}" to teacher ${teacherId}`,
      );
    }

    this.logger.log(
      `applyExistingRulesToNewTeacher: ${rulesApplied} rules applied, ${rowsCreated} rows created, ${rulesSkipped} skipped for teacher ${teacherId}`,
    );

    return { rulesApplied, rowsCreated, rulesSkipped };
  }
}
