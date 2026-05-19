import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefillClassDto {
  @ApiProperty({ example: 5, description: 'Number of classes to add' })
  @IsInt()
  @Min(1)
  amount: number;
}
