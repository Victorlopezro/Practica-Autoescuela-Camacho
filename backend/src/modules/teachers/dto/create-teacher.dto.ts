import {
  IsString,
  IsOptional,
  IsArray,
  IsEmail,
  MinLength,
  MaxLength,
  ArrayUnique,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeacherDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, description: 'Vehicle IDs to assign' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  vehicleIds?: string[];
}
