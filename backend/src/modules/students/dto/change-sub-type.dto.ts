import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeSubTypeDto {
  @ApiProperty({
    example: 'circulacion',
    description: 'Target license sub-type (only circulacion supported)',
  })
  @IsString()
  @IsIn(['circulacion'])
  targetSubType!: string;
}
