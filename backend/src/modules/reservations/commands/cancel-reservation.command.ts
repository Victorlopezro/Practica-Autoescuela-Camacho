import { ICommand } from '@nestjs/cqrs';

export class CancelReservationCommand implements ICommand {
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
  ) {}
}
