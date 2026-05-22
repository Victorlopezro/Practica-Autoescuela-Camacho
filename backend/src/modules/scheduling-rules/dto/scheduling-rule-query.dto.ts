import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RULE_TYPES, type RuleType } from './create-scheduling-rule.dto';

export class SchedulingRuleQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by rule type', enum: RULE_TYPES })
  @IsOptional()
  @IsEnum(RULE_TYPES)
  ruleType?: RuleType;

  @ApiPropertyOptional({ description: 'Filter by enabled status' })
  @IsOptional()
  @IsString()
  enabled?: string; // "true" | "false" as string from query params

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;
}
