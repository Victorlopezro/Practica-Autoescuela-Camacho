import { ApiProperty } from '@nestjs/swagger';

export class ApiError {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ required: false, example: '2026-05-15T18:30:00.000Z' })
  timestamp?: string;

  @ApiProperty({ required: false, example: '/api/users' })
  path?: string;
}
