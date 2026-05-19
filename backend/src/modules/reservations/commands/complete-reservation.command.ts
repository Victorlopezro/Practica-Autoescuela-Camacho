import { ICommand } from '@nestjs/cqrs';

export class CompleteReservationCommand implements ICommand {
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
  ) {}
}
