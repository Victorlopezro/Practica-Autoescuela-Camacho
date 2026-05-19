import { IsString, IsIn, IsInt, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VEHICLE_TYPES } from '../../../common/constants/vehicle-types';

export class CreateReservationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  teacherId!: string;

  @ApiProperty({ enum: [...VEHICLE_TYPES] })
  @IsString()
  @IsIn([...VEHICLE_TYPES])
  vehicleType!: string;

  @ApiProperty({ example: '2026-06-01T10:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ enum: [45, 90] })
  @IsInt()
  @IsIn([45, 90])
  duration!: number;
}
