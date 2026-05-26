import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  Length,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BatchOverrideEntry {
  @ApiProperty({
    description: 'Date (YYYY-MM-DD)',
    example: '2026-06-01',
  })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Whether the teacher is available',
    default: false,
  })
  @IsBoolean()
  isAvailable!: boolean;

  @ApiProperty({
    description: 'Override start time (HH:mm)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  startTime?: string;

  @ApiProperty({
    description: 'Override end time (HH:mm)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(5, 5)
  endTime?: string;

  @ApiProperty({
    description: 'Reason for override',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class BatchOverrideDto {
  @ApiProperty({
    description: 'Array of override entries',
    type: [BatchOverrideEntry],
  })
  @ValidateNested({ each: true })
  @Type(() => BatchOverrideEntry)
  @ArrayMinSize(1)
  overrides!: BatchOverrideEntry[];
}
