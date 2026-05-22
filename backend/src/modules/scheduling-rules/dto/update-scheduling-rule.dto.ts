import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RULE_TYPES, RULE_ACTIONS, type RuleType, type RuleAction } from './create-scheduling-rule.dto';

export class UpdateSchedulingRuleDto {
  @ApiPropertyOptional({ description: 'Rule name', minLength: 3, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Rule type category', enum: RULE_TYPES })
  @IsOptional()
  @IsEnum(RULE_TYPES)
  ruleType?: RuleType;

  @ApiPropertyOptional({ description: 'Pre-structured rule JSON', example: { conditions: [] } })
  @IsOptional()
  @IsObject()
  structuredRules?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Action to take when rule matches', enum: RULE_ACTIONS })
  @IsOptional()
  @IsEnum(RULE_ACTIONS)
  action?: RuleAction;

  @ApiPropertyOptional({ description: 'Priority (lower = evaluated first)', minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ description: 'Scope configuration (teacherIds, licenseTypes, vehicleTypes)' })
  @IsOptional()
  @IsObject()
  appliesTo?: Record<string, unknown>;
}
