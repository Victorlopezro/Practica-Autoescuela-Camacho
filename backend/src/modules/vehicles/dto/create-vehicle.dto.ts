import { IsString, IsIn, IsOptional, IsDateString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const vehicleTypes = ['moto-pista', 'moto-circulacion', 'coche-manual', 'coche-automatico'] as const;

export class CreateVehicleDto {
  @ApiProperty({ example: '1234ABC' })
  @IsString()
  @MinLength(3)
  plate: string;

  @ApiProperty({ enum: vehicleTypes, example: 'coche-manual' })
  @IsIn(vehicleTypes)
  type: string;

  @ApiProperty({ required: false, example: '2026-06-15T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  itvExpiry?: string;
}
