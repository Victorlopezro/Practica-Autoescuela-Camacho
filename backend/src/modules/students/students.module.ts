import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { StudentsController } from './students.controller';
import { AdjustBalanceHandler } from './commands/adjust-balance.handler';
import { DeductClassHandler } from './commands/deduct-class.handler';
import { RefillClassHandler } from './commands/refill-class.handler';

const handlers = [AdjustBalanceHandler, DeductClassHandler, RefillClassHandler];

@Module({
  imports: [CqrsModule],
  controllers: [StudentsController],
  providers: [...handlers],
})
export class StudentsModule {}
