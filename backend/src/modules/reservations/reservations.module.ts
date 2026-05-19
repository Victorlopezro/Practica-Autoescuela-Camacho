import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ReservationsController } from './reservations.controller';
import { CreateReservationHandler } from './commands/create-reservation.handler';
import { ConfirmReservationHandler } from './commands/confirm-reservation.handler';
import { CancelReservationHandler } from './commands/cancel-reservation.handler';
import { CompleteReservationHandler } from './commands/complete-reservation.handler';

const handlers = [
  CreateReservationHandler,
  ConfirmReservationHandler,
  CancelReservationHandler,
  CompleteReservationHandler,
];

@Module({
  imports: [CqrsModule],
  controllers: [ReservationsController],
  providers: [...handlers],
})
export class ReservationsModule {}
