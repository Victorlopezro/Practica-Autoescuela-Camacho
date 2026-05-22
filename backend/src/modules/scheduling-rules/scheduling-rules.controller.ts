import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingRulesService } from './services/scheduling-rules.service';
import { SchedulingAiService } from '../scheduling/scheduling-ai.service';
import type { StructuredRule } from '../scheduling/scheduling-ai.service';
import {
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
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
  ) {}

  @Post()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Create a new scheduling rule' })
  async create(
    @Body() dto: CreateSchedulingRuleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rulesService.create(dto, user.sub);
  }

  @Get()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'List scheduling rules with pagination and filters' })
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
    return this.rulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin:manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a scheduling rule' })
  async remove(@Param('id') id: string) {
    await this.rulesService.remove(id);
  }

  @Post(':id/translate')
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Translate natural language rule to structured JSON via AI' })
  async translate(
    @Param('id') id: string,
  ) {
    const rule = await this.rulesService.findOne(id);

    const result = await this.aiService.translateRule(rule.naturalLanguage);

    if (!result.success) {
      return result;
    }

    const updateData: Record<string, unknown> = {
      structuredRules: result.data as unknown as Record<string, unknown>,
    };

    // If AI extracted teacher names, resolve them to IDs
    const appliesToTeachers = (result.data as StructuredRule).appliesTo?.teachers;
    if (appliesToTeachers && Array.isArray(appliesToTeachers) && appliesToTeachers.length > 0) {
      const teacherIds = await this.resolveTeacherNames(appliesToTeachers);
      if (teacherIds.length > 0) {
        updateData.appliesTo = { teachers: teacherIds };
        this.logger.log(`Resolved appliesTo teachers: ${appliesToTeachers.join(', ')} → ${teacherIds.join(', ')}`);
      }
    }

    const updated = await this.rulesService.update(id, updateData);

    return updated;
  }

  /**
   * Resolve teacher names (full or partial) to their DB IDs.
   * Tries exact match first, then partial/contains match.
   */
  private async resolveTeacherNames(names: string[]): Promise<string[]> {
    const allTeachers = await this.prisma.teacher.findMany({
      select: { id: true, name: true },
    });

    const ids = names.map((name) => {
      const lowerName = name.toLowerCase();

      // Try exact match
      const exact = allTeachers.find((t) => t.name.toLowerCase() === lowerName);
      if (exact) return exact.id;

      // Try partial match (e.g. "juan" matches "Juan Pérez")
      const partial = allTeachers.find((t) =>
        t.name.toLowerCase().includes(lowerName) ||
        lowerName.includes(t.name.toLowerCase()),
      );
      if (partial) return partial.id;

      // Try first-name-only match (e.g. "luis" matches "Luis López")
      const firstName = allTeachers.find((t) =>
        t.name.toLowerCase().split(' ')[0] === lowerName,
      );
      if (firstName) return firstName.id;

      return null;
    }).filter((id): id is string => id !== null);

    return ids;
  }
}
