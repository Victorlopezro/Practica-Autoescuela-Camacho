import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TeachersController } from './teachers.controller';

@Module({
  imports: [CqrsModule],
  controllers: [TeachersController],
})
export class TeachersModule {}
