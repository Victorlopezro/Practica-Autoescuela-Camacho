import { IsInt, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeductClassDto {
  @ApiProperty({
    enum: [45, 90],
    example: 45,
    description: 'Class duration in minutes',
  })
  @IsInt()
  @IsIn([45, 90])
  duration: number;
}
