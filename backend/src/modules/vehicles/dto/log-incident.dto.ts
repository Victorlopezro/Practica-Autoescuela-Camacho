import { IsString, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LogIncidentDto {
  @ApiProperty({ example: 'Left blinker not working' })
  @IsString()
  @MinLength(3)
  description: string;

  @ApiProperty({ required: false, example: '2026-05-18T00:00:00.000Z' })
  @IsDateString()
  date: string;
}
