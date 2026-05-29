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

    // Step 2.5: Detect if this is the first application of this rule.
    // On first application, we clean up legacy manual data for the affected (teacher, day) pairs.
    // On subsequent applications, we only update rule rows and leave manual overrides untouched.
    const isFirstApplication =
      (await this.prisma.teacherAvailability.count({
        where: { ruleId: input.ruleId },
      })) === 0;

    // Phase 1: Legacy cleanup — only on first application.
    // Manual rows (ruleId=null) created before the rule existed are legacy data
    // and should be replaced. After this, any manual row is an intentional override.
    let cleanedLegacyCount = 0;
    if (isFirstApplication) {
      const pairSet = new Set<string>();
      for (const row of rowsToCreate) {
        pairSet.add(`${row.teacherId}|${row.dayOfWeek}`);
      }

      for (const key of pairSet) {
        const [teacherId, dayOfWeekStr] = key.split('|');
        const result = await this.prisma.teacherAvailability.deleteMany({
          where: {
            teacherId,
            dayOfWeek: parseInt(dayOfWeekStr, 10),
            ruleId: null,
          },
        });
        cleanedLegacyCount += result.count;
      }

      if (cleanedLegacyCount > 0) {
        this.logger.log(
          `Cleaned up ${cleanedLegacyCount} legacy manual row(s) for rule ${input.ruleId} (first application)`,
        );
      }
    }

    // Step 3: Check for cross-rule conflicts + dedup by (teacherId, dayOfWeek).
    // We do NOT delete manual rows here — they are intentional overrides
    // with priority over the rule's schedule.
    const nonConflictingRows: typeof rowsToCreate = [];
    const seenKeys = new Set<string>();
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
      // ruleId: { not: input.ruleId } finds OTHER rule rows (non-null, different ruleId).
      // Manual rows (ruleId=null) are NOT found here — they have priority over rules.
      const conflictingRow = await this.prisma.teacherAvailability.findFirst({
        where: {
          teacherId: row.teacherId,
          dayOfWeek: row.dayOfWeek,
          ruleId: { not: input.ruleId },
        },
      });

      if (conflictingRow) {
        skippedByConflict++;
        this.logger.warn(
          `Skipping row for teacher ${row.teacherId} day ${row.dayOfWeek} track ${row.track}: existing entry from rule ${conflictingRow.ruleId}`,
        );
        continue;
      }

      seenKeys.add(key);
      nonConflictingRows.push(row);
    }

    if (skippedDuplicates > 0) {
      result.warnings.push(
        `${skippedDuplicates} bloque(s) duplicado(s) omitido(s) para el mismo profesor y día.`,
      );
    }

    // Step 4: Delete old rule rows and create new ones
    if (nonConflictingRows.length > 0) {
      await this.prisma.teacherAvailability.deleteMany({
        where: { ruleId: input.ruleId },
      });
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
    }

    if (skippedByConflict > 0) {
      result.skippedItems += skippedByConflict;
      result.warnings.push(
        `${skippedByConflict} bloque(s) omitido(s) porque otra regla ya cubre ese profesor, día y pista.`,
      );
    }

    result.generatedRows = nonConflictingRows.length;
    this.logger.log(
      `Rule ${input.ruleId}: ${nonConflictingRows.length} rows created, ${skippedByConflict} skipped by other rules, ${cleanedLegacyCount} legacy manual rows cleaned`,
    );
    return result;
  }

  async removeScheduleRule(
    ruleId: string,
  ): Promise<{ deletedRows: number }> {
    const result = await this.prisma.teacherAvailability.deleteMany({
      where: { ruleId },
    });
    return { deletedRows: result.count };
  }
}
