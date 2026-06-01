import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SchedulingRulesModule } from '../scheduling-rules/scheduling-rules.module';
import { TeachersController } from './teachers.controller';
import { CreateTeacherHandler } from './commands/create-teacher.handler';
import { UpdateTeacherHandler } from './commands/update-teacher.handler';
import { DeleteTeacherHandler } from './commands/delete-teacher.handler';

const handlers = [
  CreateTeacherHandler,
  UpdateTeacherHandler,
  DeleteTeacherHandler,
];

@Module({
  imports: [CqrsModule, SchedulingRulesModule],
  controllers: [TeachersController],
  providers: [...handlers],
})
export class TeachersModule {}
