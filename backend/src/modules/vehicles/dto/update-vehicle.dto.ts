import { IsString, IsIn, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const vehicleTypes = ['moto-pista', 'moto-circulacion', 'coche-manual', 'coche-automatico'] as const;
const vehicleStatuses = ['available', 'in-use', 'maintenance', 'retired'] as const;

export class UpdateVehicleDto {
  @ApiProperty({ required: false, example: '5678DEF' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  plate?: string;

  @ApiProperty({ required: false, enum: vehicleTypes, example: 'moto-pista' })
  @IsOptional()
  @IsIn(vehicleTypes)
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
