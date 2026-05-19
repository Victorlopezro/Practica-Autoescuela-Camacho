import { ICommand } from '@nestjs/cqrs';

export class ConfirmReservationCommand implements ICommand {
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
  ) {}
}
