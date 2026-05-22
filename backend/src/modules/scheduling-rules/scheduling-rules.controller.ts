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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { SchedulingRulesService } from './services/scheduling-rules.service';
import { SchedulingAiService } from '../scheduling/scheduling-ai.service';
import {
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
} from './dto';

@ApiTags('Scheduling Rules')
@ApiBearerAuth()
@Controller({ path: 'scheduling/rules', version: '1' })
export class SchedulingRulesController {
  constructor(
    private readonly rulesService: SchedulingRulesService,
    private readonly aiService: SchedulingAiService,
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

    const updated = await this.rulesService.update(id, {
      structuredRules: result.data as unknown as Record<string, unknown>,
    });

    return updated;
  }
}
