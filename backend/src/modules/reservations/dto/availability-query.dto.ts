import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityQueryDto {
  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsString()
  date!: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  teacherId!: string;

  @ApiPropertyOptional({ enum: [45, 90], default: 45 })
  @IsOptional()
  @IsIn([45, 90])
  duration?: number;
}
