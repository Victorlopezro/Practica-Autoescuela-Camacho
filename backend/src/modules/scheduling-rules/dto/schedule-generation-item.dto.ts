import { IsArray, IsOptional, IsString, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleGenerationDayTimeDto {
  @ApiProperty({
    description: 'Day of week (0=Sunday, 1=Monday ... 6=Saturday)',
    minimum: 0,
    maximum: 6,
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '08:00',
  })
  @IsString()
  startTime!: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '14:00',
  })
  @IsString()
  endTime!: string;
}

export class ScheduleGenerationItemDto {
  @ApiProperty({
    description: 'Teacher display name for server-side resolution',
    example: 'Juan Pérez',
  })
  @IsString()
  teacher!: string;

  @ApiProperty({
    description: 'Weekly schedule slots',
    type: [ScheduleGenerationDayTimeDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleGenerationDayTimeDto)
  schedule!: ScheduleGenerationDayTimeDto[];

  @ApiPropertyOptional({
    description: 'Track filter (e.g., "pista", "circulacion")',
    example: 'pista',
  })
  @IsOptional()
  @IsString()
  track?: string;
}
