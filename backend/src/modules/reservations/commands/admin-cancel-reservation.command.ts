import { ICommand } from '@nestjs/cqrs';

export class AdminCancelReservationCommand implements ICommand {
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
    public readonly reason: string,
  ) {}
}
