import { IsString, IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateSlotDto {
  @ApiProperty({ description: 'Teacher ID' })
  @IsString()
  teacherId!: string;

  @ApiProperty({ description: 'Student ID' })
  @IsString()
  studentId!: string;

  @ApiProperty({ description: 'Vehicle type', example: 'coche-manual' })
  @IsString()
  vehicleType!: string;

  @ApiProperty({ description: 'Desired start time (ISO 8601)' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ description: 'Duration in minutes', example: 45 })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiProperty({ description: 'Whether this is a double session', required: false })
  @IsOptional()
  @IsString()
  doubleSession?: string; // "true" | "false" as string from query params
}
