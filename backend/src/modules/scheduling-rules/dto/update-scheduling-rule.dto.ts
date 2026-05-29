import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsIn,
  IsArray,
  Min,
  MinLength,
  MaxLength,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  RULE_TYPES,
  RULE_ACTIONS,
  type RuleType,
  type RuleAction,
} from './create-scheduling-rule.dto';
import { ScheduleGenerationItemDto } from './schedule-generation-item.dto';

export class UpdateSchedulingRuleDto {
  @ApiPropertyOptional({
    description: 'Rule name',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Rule expressed in natural language (Spanish)',
    example: 'Horario laboral de 08:00 a 20:00',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  naturalLanguage?: string;

  @ApiPropertyOptional({ description: 'Rule type category', enum: RULE_TYPES })
  @IsOptional()
  @IsEnum(RULE_TYPES)
  ruleType?: RuleType;

  @ApiPropertyOptional({
    description: 'Pre-structured rule JSON',
    example: { conditions: [] },
  })
  @IsOptional()
  @IsObject()
  structuredRules?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Action to take when rule matches',
    enum: RULE_ACTIONS,
  })
  @IsOptional()
  @IsEnum(RULE_ACTIONS)
  action?: RuleAction;

  @ApiPropertyOptional({
    description: 'Priority (lower = evaluated first)',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Scope configuration (teacherIds, licenseTypes, vehicleTypes)',
  })
  @IsOptional()
  @IsObject()
  appliesTo?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Rule category — evaluation or generation',
    enum: ['evaluation', 'generation'],
  })
  @IsOptional()
  @IsIn(['evaluation', 'generation'])
  category?: string;

  @ApiPropertyOptional({
    description: 'Schedule generation data (used for generation-category rules)',
    type: [ScheduleGenerationItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleGenerationItemDto)
  scheduleData?: ScheduleGenerationItemDto[];
}
