import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetOverrideDto {
  @ApiProperty({ description: 'Date (YYYY-MM-DD)', example: '2026-06-01' })
  @IsDateString()
  date!: string;

  @ApiProperty({
    description: 'Whether the teacher is available',
    default: false,
  })
  @IsBoolean()
  isAvailable!: boolean;

  @ApiProperty({
    description: 'Override start time (HH:mm) — null = use regular schedule',
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

  @ApiProperty({ description: 'Reason for override', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
