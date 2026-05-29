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
      isAvailable: boolean;
    }> = [];

    for (const item of schedule) {
      const normalized = item.teacher.toLowerCase();
      const teacher =
        teacherMap.get(normalized) ??
        allTeachers.find((t) => t.name.toLowerCase().includes(normalized));

      if (!teacher) {
        result.skippedItems++;
        result.warnings.push(
          `Teacher "${item.teacher}" not found. Skipping.`,
        );
        continue;
      }

      for (const dayTime of item.schedule) {
        rowsToCreate.push({
          teacherId: teacher.id,
          ruleId: input.ruleId,
          dayOfWeek: dayTime.dayOfWeek,
          startTime: dayTime.startTime,
          endTime: dayTime.endTime,
          track: item.track ?? null,
          isAvailable: true,
        });
      }
    }

    // Step 3: Check for conflicts with manual entries (ruleId: null) — skip those
    const nonConflictingRows: typeof rowsToCreate = [];
    let skippedByConflict = 0;

    for (const row of rowsToCreate) {
      const existingManual = await this.prisma.teacherAvailability.findFirst({
        where: {
          teacherId: row.teacherId,
          dayOfWeek: row.dayOfWeek,
          track: row.track,
          ruleId: null,
        },
      });

      if (existingManual) {
        skippedByConflict++;
      } else {
        nonConflictingRows.push(row);
      }
    }

    // Step 4: Delete old rule rows and create new ones
    if (nonConflictingRows.length > 0) {
      await this.prisma.teacherAvailability.deleteMany({
        where: { ruleId: input.ruleId },
      });
      await this.prisma.teacherAvailability.createMany({
        data: nonConflictingRows,
      });
    }

    if (skippedByConflict > 0) {
      result.skippedItems += skippedByConflict;
      result.warnings.push(
        `${skippedByConflict} bloque(s) omitido(s) porque ya existe disponibilidad manual para ese profesor, día y pista. Los cambios manuales tienen prioridad sobre las reglas.`,
      );
    }

    result.generatedRows = nonConflictingRows.length;
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
