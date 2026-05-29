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

    let schedule: ScheduleGenerationItemDto[] = [];

    // Step 1: If naturalLanguage provided, try AI translation
    if (input.naturalLanguage) {
      try {
        const aiResult = await this.aiService.translateGenerationRule(input.naturalLanguage);
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

    // Step 2: Resolve teachers and build rows
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
      // Find teacher by name (try exact match first, then partial/insensitive)
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { name: item.teacher },
            { name: { contains: item.teacher, mode: 'insensitive' } },
          ],
        },
      });

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

    // Step 3: Execute in transaction — delete old rows, create new ones
    if (rowsToCreate.length > 0) {
      try {
        await this.prisma.$transaction(async (tx) => {
          await tx.teacherAvailability.deleteMany({
            where: { ruleId: input.ruleId },
          });
          await tx.teacherAvailability.createMany({
            data: rowsToCreate,
          });
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          this.logger.warn(
            `Unique constraint violation for rule ${input.ruleId}: ${error.message}`,
          );
          result.warnings.push(
            'Conflicto de horarios: algunos bloques coinciden con disponibilidad existente del mismo profesor, día y pista. ' +
              'La transacción se ha revertido — los datos anteriores se conservan. Revisa la regla o ajusta los horarios manualmente.',
          );
          result.generatedRows = 0;
          return result;
        }
        throw error;
      }
    }

    result.generatedRows = rowsToCreate.length;
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
