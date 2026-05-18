import { IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'jdoe' })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({ example: 'securePass123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: ['admin', 'teacher', 'student'], example: 'teacher' })
  @IsIn(['admin', 'teacher', 'student'])
  role: string;

  @ApiProperty({ required: false, example: 'uuid-of-teacher' })
  @IsOptional()
  @IsString()
  teacherId?: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false, enum: ['admin', 'teacher', 'student'] })
  @IsOptional()
  @IsIn(['admin', 'teacher', 'student'])
  role?: string;

  @ApiProperty({ required: false, example: 'uuid-of-teacher' })
  @IsOptional()
  @IsString()
  teacherId?: string;
}
