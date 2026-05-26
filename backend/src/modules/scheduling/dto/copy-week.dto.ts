import { IsDateString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CopyWeekDto {
  @ApiProperty({
    description: 'Source date — start of the source week (7 days)',
    example: '2026-06-01',
  })
  @IsDateString()
  sourceDate!: string;

  @ApiProperty({
    description: 'Target date — start of the target week (7 days)',
    example: '2026-06-08',
  })
  @IsDateString()
  targetDate!: string;

  @ApiProperty({
    description:
      'Whether to overwrite existing overrides on the target week (defaults to false)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  overrideExisting?: boolean;
}
