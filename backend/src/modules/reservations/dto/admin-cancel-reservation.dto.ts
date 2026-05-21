import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminCancelReservationDto {
  @ApiProperty({
    example: 'Coche averiado — revisión en taller',
    description: 'Reason for the admin-initiated cancellation',
  })
  @IsString()
  @MinLength(3)
  reason: string;
}
