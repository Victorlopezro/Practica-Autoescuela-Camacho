import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingRulesService } from './services/scheduling-rules.service';
import { SchedulingAiService } from '../scheduling/scheduling-ai.service';
import {
  ScheduleGenerationService,
  GenerationResult,
} from './services/schedule-generation.service';
import {
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
  RULE_TYPES,
  RuleType,
} from './dto';

@ApiTags('Scheduling Rules')
@ApiBearerAuth()
@Controller({ path: 'scheduling/rules', version: '1' })
export class SchedulingRulesController {
  private readonly logger = new Logger(SchedulingRulesController.name);

  constructor(
    private readonly rulesService: SchedulingRulesService,
    private readonly aiService: SchedulingAiService,
    private readonly prisma: PrismaService,
    private readonly scheduleGenerationService: ScheduleGenerationService,
  ) {}

  @Post()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Create a new scheduling rule' })
  async create(
    @Body() dto: CreateSchedulingRuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    // Generation rules: create availability from NL via AI
    if (dto.category === 'generation') {
      if (!dto.ruleType) dto.ruleType = 'general';

      // Resolve teacher names to IDs in appliesTo BEFORE saving
      const rawAppliesTo = dto.appliesTo as { teachers?: string[] } | undefined;
      if (rawAppliesTo?.teachers?.length) {
        const resolvedIds = await this.resolveTeacherNames(rawAppliesTo.teachers);
        if (resolvedIds.length > 0) {
          rawAppliesTo.teachers = resolvedIds;
          dto.appliesTo = rawAppliesTo as unknown as Record<string, unknown>;
        }
      }

      const rule = await this.rulesService.create(dto, user.sub);

      // Save resolved appliesTo back if it was updated
      if (dto.appliesTo) {
        await this.rulesService.update(rule.id, {
          appliesTo: dto.appliesTo,
        });
        // Reload rule to get updated appliesTo from DB
        const updatedRule = await this.rulesService.findOne(rule.id);
        rule.appliesTo = updatedRule.appliesTo;
      }

      const generationResult =
        await this.scheduleGenerationService.applyScheduleRule({
          ruleId: rule.id,
          naturalLanguage: dto.naturalLanguage,
          scheduleData: dto.scheduleData,
        });

      // If AI detected double booking intent, update the rule action
      if (generationResult.detectedAction) {
        await this.rulesService.update(rule.id, {
          action: generationResult.detectedAction,
        });
        rule.action = generationResult.detectedAction;
      }

      return { data: rule, generationResult };
    }

    // Auto-translate from natural language if structured rules not provided
    if (dto.naturalLanguage && !dto.structuredRules) {
      const allTeachers = await this.prisma.teacher.findMany({
        select: { name: true },
      });
      const teacherNames = allTeachers.map((t) => t.name);
      const result = await this.aiService.translateRule(
        dto.naturalLanguage,
        teacherNames,
      );

      if (result.success) {
        const aiData = result.data;

        this.logger.log(
          `AI translateRule response for "${dto.naturalLanguage.substring(0, 60)}": appliesTo=${JSON.stringify(aiData.appliesTo)} conditions=${aiData.conditions?.length ?? 0} conditions`,
        );

        // Store the full AI response as structured rules
        dto.structuredRules = aiData as unknown as Record<string, unknown>;

        // Infer ruleType from conditions if not manually specified
        if (!dto.ruleType) {
          dto.ruleType = this.inferRuleType(aiData.conditions);
        }

        // Set action from AI onMatch if not manually specified
        if (!dto.action) {
          dto.action = aiData.onMatch;
        }

        // Process appliesTo (resolve teacher names to IDs)
        if (aiData.appliesTo) {
          const appliesToBuild: Record<string, string[]> = {};

          if (
            aiData.appliesTo.teachers &&
            Array.isArray(aiData.appliesTo.teachers) &&
            aiData.appliesTo.teachers.length > 0
          ) {
            const teacherIds = await this.resolveTeacherNames(
              aiData.appliesTo.teachers,
            );
            if (teacherIds.length > 0) {
              appliesToBuild.teachers = teacherIds;
            }
          }

          if (
            aiData.appliesTo.licenseTypes &&
            Array.isArray(aiData.appliesTo.licenseTypes) &&
            aiData.appliesTo.licenseTypes.length > 0
          ) {
            appliesToBuild.licenseTypes = aiData.appliesTo.licenseTypes;
          }

          if (
            aiData.appliesTo.vehicleTypes &&
            Array.isArray(aiData.appliesTo.vehicleTypes) &&
            aiData.appliesTo.vehicleTypes.length > 0
          ) {
            appliesToBuild.vehicleTypes = aiData.appliesTo.vehicleTypes;
          }

          if (Object.keys(appliesToBuild).length > 0) {
            dto.appliesTo = appliesToBuild;
          }
        }

        this.logger.log(
          `Auto-translated rule "${dto.naturalLanguage.substring(0, 60)}" → type=${dto.ruleType}, action=${dto.action}`,
        );
      }
    }

    // Fallback defaults if translation failed or fields still missing
    if (!dto.ruleType) dto.ruleType = 'general';
    if (!dto.action) dto.action = 'block';

    const rule = await this.rulesService.create(dto, user.sub);
    return { data: rule };
  }

  @Get()
  @Roles('admin:manage')
  @ApiOperation({
    summary: 'List scheduling rules with pagination and filters',
  })
  async findAll(@Query() query: SchedulingRuleQueryDto) {
    return this.rulesService.findAll(query);
  }

  @Get(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Get a scheduling rule by ID' })
  async findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Update a scheduling rule' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSchedulingRuleDto,
  ) {
    const existingRule = await this.rulesService.findOne(id);
    const rule = await this.rulesService.update(id, dto);

    // Always regenerate availability when editing a generation rule.
    // The frontend edit form never sends naturalLanguage or scheduleData,
    // so use the existing rule's naturalLanguage for AI re-generation.
    let generationResult: GenerationResult | undefined;
    if (existingRule.category === 'generation') {
      generationResult =
        await this.scheduleGenerationService.applyScheduleRule({
          ruleId: id,
          naturalLanguage: dto.naturalLanguage ?? existingRule.naturalLanguage,
          scheduleData: dto.scheduleData,
        });
    }

    return { data: rule, generationResult };
  }

  @Delete(':id')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Soft delete a scheduling rule' })
  async remove(@Param('id') id: string) {
    const rule = await this.rulesService.findOne(id);

    let generationResult: Awaited<
      ReturnType<typeof this.scheduleGenerationService.removeScheduleRule>
    > | undefined;
    if (rule.category === 'generation') {
      generationResult =
        await this.scheduleGenerationService.removeScheduleRule(id);
    }

    await this.rulesService.remove(id);

    return {
      data: { deleted: true },
      generationRemoval: generationResult
        ? {
            deletedRows: generationResult.deletedRows,
            reappliedRules: generationResult.reappliedRules,
            clonedRows: generationResult.clonedRows,
          }
        : undefined,
    };
  }

  @Post(':id/translate')
  @Roles('admin:manage')
  @ApiOperation({
    summary: 'Translate natural language rule to structured JSON via AI',
  })
  async translate(@Param('id') id: string) {
    const rule = await this.rulesService.findOne(id);

    // Generation rules cannot be translated — they are created manually
    if (rule.category === 'generation') {
      return rule;
    }

    const allTeachers = await this.prisma.teacher.findMany({
      select: { name: true },
    });
    const teacherNames = allTeachers.map((t) => t.name);
    const result = await this.aiService.translateRule(
      rule.naturalLanguage,
      teacherNames,
    );

    if (!result.success) {
      return result;
    }

    this.logger.log(
      `AI translateRule response for "${rule.naturalLanguage.substring(0, 60)}": appliesTo=${JSON.stringify(result.data.appliesTo)} conditions=${result.data.conditions?.length ?? 0} conditions`,
    );

    const updateData: Record<string, unknown> = {
      structuredRules: result.data,
    };

    // If AI extracted appliesTo fields, process them
    const aiResponse = result.data as {
      appliesTo?: {
        teachers?: string[];
        licenseTypes?: string[];
        vehicleTypes?: string[];
      };
    };

    const appliesToBuild: Record<string, string[]> = {};

    // Resolve teacher names to IDs
    const appliesToTeachers = aiResponse.appliesTo?.teachers;
    if (
      appliesToTeachers &&
      Array.isArray(appliesToTeachers) &&
      appliesToTeachers.length > 0
    ) {
      const teacherIds = await this.resolveTeacherNames(appliesToTeachers);
      if (teacherIds.length > 0) {
        appliesToBuild.teachers = teacherIds;
        this.logger.log(
          `Resolved appliesTo teachers: ${appliesToTeachers.join(', ')} → ${teacherIds.join(', ')}`,
        );
      }
    }

    // Pass through licenseTypes and vehicleTypes directly (already string values)
    const licenseTypes = aiResponse.appliesTo?.licenseTypes;
    if (
      licenseTypes &&
      Array.isArray(licenseTypes) &&
      licenseTypes.length > 0
    ) {
      appliesToBuild.licenseTypes = licenseTypes;
    }

    const vehicleTypes = aiResponse.appliesTo?.vehicleTypes;
    if (
      vehicleTypes &&
      Array.isArray(vehicleTypes) &&
      vehicleTypes.length > 0
    ) {
      appliesToBuild.vehicleTypes = vehicleTypes;
    }

    if (Object.keys(appliesToBuild).length > 0) {
      updateData.appliesTo = appliesToBuild;
    }

    const updated = await this.rulesService.update(id, updateData);

    return updated;
  }

  /**
   * Infer ruleType from the conditions returned by the AI.
   * Checks which fields are used in conditions to categorise the rule.
   */
  private inferRuleType(conditions: Array<{ field: string }>): RuleType {
    const fields = conditions.map((c) => c.field);
    if (fields.includes('overlap')) return 'overlap';
    if (fields.includes('duration')) return 'duration';
    if (fields.includes('vehicleType')) return 'vehicle';
    if (fields.some((f) => ['dayOfWeek', 'date', 'time'].includes(f))) {
      return 'availability';
    }
    return 'general';
  }

  /**
   * Resolve teacher names (full or partial) to their DB IDs.
   * Tries exact match first, then partial/contains match.
   */
  private async resolveTeacherNames(names: string[]): Promise<string[]> {
    const allTeachers = await this.prisma.teacher.findMany({
      select: { id: true, name: true },
    });

    const ids = names
      .map((name) => {
        const lowerName = name.toLowerCase();

        // Try exact match
        const exact = allTeachers.find(
          (t) => t.name.toLowerCase() === lowerName,
        );
        if (exact) return exact.id;

        // Try partial match (e.g. "juan" matches "Juan Pérez")
        const partial = allTeachers.find(
          (t) =>
            t.name.toLowerCase().includes(lowerName) ||
            lowerName.includes(t.name.toLowerCase()),
        );
        if (partial) return partial.id;

        // Try first-name-only match (e.g. "luis" matches "Luis López")
        const firstName = allTeachers.find(
          (t) => t.name.toLowerCase().split(' ')[0] === lowerName,
        );
        if (firstName) return firstName.id;

        return null;
      })
      .filter((id): id is string => id !== null);

    return ids;
  }
}
