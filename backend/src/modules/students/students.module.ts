import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StudentsController } from './students.controller';
import { AdjustBalanceHandler } from './commands/adjust-balance.handler';
import { CreateStudentHandler } from './commands/create-student.handler';
import { DeductClassHandler } from './commands/deduct-class.handler';
import { DeleteStudentHandler } from './commands/delete-student.handler';
import { RefillClassHandler } from './commands/refill-class.handler';
import { UpdateStudentHandler } from './commands/update-student.handler';

const handlers = [
  AdjustBalanceHandler,
  CreateStudentHandler,
  DeductClassHandler,
  DeleteStudentHandler,
  RefillClassHandler,
  UpdateStudentHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [StudentsController],
  providers: [...handlers],
})
export class StudentsModule {}
