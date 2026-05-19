import { IsString, IsIn, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VEHICLE_TYPES } from '../../../common/constants/vehicle-types';

export class CreateVehicleDto {
  @ApiProperty({ example: '1234ABC' })
  @IsString()
  @MinLength(3)
  plate: string;

  @ApiProperty({ enum: [...VEHICLE_TYPES], example: 'coche-manual' })
  @IsIn([...VEHICLE_TYPES])
  type: string;

  @ApiProperty({ required: false, example: '2026-06-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  itvExpiry?: string;
}
