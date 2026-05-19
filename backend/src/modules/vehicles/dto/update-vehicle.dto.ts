import { IsString, IsIn, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VEHICLE_TYPES } from '../../../common/constants/vehicle-types';

const vehicleStatuses = ['available', 'in-use', 'maintenance', 'retired'] as const;

export class UpdateVehicleDto {
  @ApiProperty({ required: false, example: '5678DEF' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  plate?: string;

  @ApiProperty({ required: false, enum: [...VEHICLE_TYPES], example: 'moto-pista' })
  @IsOptional()
  @IsIn([...VEHICLE_TYPES])
  type?: string;

  @ApiProperty({ required: false, enum: vehicleStatuses, example: 'maintenance' })
  @IsOptional()
  @IsIn(vehicleStatuses)
  status?: string;

  @ApiProperty({ required: false, example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  itvExpiry?: string;
}
