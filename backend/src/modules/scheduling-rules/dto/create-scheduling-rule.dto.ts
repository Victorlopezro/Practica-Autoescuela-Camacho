import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsIn,
  Min,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const RULE_TYPES = [
  'availability',
  'overlap',
  'duration',
  'vehicle',
  'general',
] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const RULE_ACTIONS = ['allow', 'block', 'warn', 'doubleBooking'] as const;
export type RuleAction = (typeof RULE_ACTIONS)[number];

export const RULE_CATEGORIES = ['evaluation', 'generation'] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export class CreateSchedulingRuleDto {
  @ApiProperty({
    description: 'Rule name',
    minLength: 3,
    maxLength: 100,
    example: 'Horario laboral',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Rule expressed in natural language (Spanish)',
    example: 'Horario laboral de 08:00 a 20:00',
  })
  @IsString()
  @MinLength(1)
  naturalLanguage!: string;

  @ApiPropertyOptional({
    description: 'Pre-structured rule JSON (bypasses AI translation)',
    example: {
      conditions: [{ field: 'time', operator: 'gte', value: '08:00' }],
      logic: 'AND',
    },
  })
  @IsOptional()
  @IsObject()
  structuredRules?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Rule type category (auto-detected from natural language if omitted)',
    enum: RULE_TYPES,
    example: 'availability',
  })
  @IsOptional()
  @IsEnum(RULE_TYPES)
  ruleType?: RuleType;

  @ApiPropertyOptional({
    description: 'Action to take when rule matches',
    enum: RULE_ACTIONS,
    default: 'block',
  })
  @IsOptional()
  @IsEnum(RULE_ACTIONS)
  action?: RuleAction;

  @ApiPropertyOptional({
    description: 'Priority (lower = evaluated first)',
    default: 100,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Whether the rule is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Scope configuration (teacherIds, licenseTypes, vehicleTypes)',
    example: { licenseTypes: ['A2', 'B'] },
  })
  @IsOptional()
  @IsObject()
  appliesTo?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Rule category — evaluation (default) or generation',
    enum: RULE_CATEGORIES,
    default: 'evaluation',
  })
  @IsOptional()
  @IsIn(['evaluation', 'generation'])
  category?: string;
}
