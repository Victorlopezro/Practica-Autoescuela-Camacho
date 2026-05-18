import { IsInt, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustBalanceDto {
  @ApiProperty({ example: 5, description: 'Amount to adjust (positive or negative integer)' })
  @IsInt()
  amount: number;

  @ApiProperty({ example: 'Payment received', description: 'Reason for the adjustment' })
  @IsString()
  @MinLength(3)
  reason: string;
}
