import { IsInt, IsString, Min, Max, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetAvailabilityDto {
  @ApiProperty({
    description: 'Day of week (0=Sunday, 6=Saturday)',
    example: 1,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ description: 'Start time in HH:mm or H:mm', example: '08:00' })
  @IsString()
  @Matches(/^\d{1,2}:\d{2}$/, {
    message: 'startTime must be in HH:mm or H:mm format',
  })
  startTime!: string;

  @ApiProperty({ description: 'End time in HH:mm or H:mm', example: '14:00' })
  @IsString()
  @Matches(/^\d{1,2}:\d{2}$/, {
    message: 'endTime must be in HH:mm or H:mm format',
  })
  endTime!: string;
}

export class RemoveAvailabilityDto {
  @ApiProperty({ description: 'Day of week to remove (0=Sunday, 6=Saturday)' })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;
}
