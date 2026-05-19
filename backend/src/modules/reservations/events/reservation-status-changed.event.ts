import { IEvent } from '@nestjs/cqrs';

export class ReservationStatusChangedEvent implements IEvent {
  constructor(
    public readonly reservationId: string,
    public readonly previousStatus: string | null,
    public readonly newStatus: string,
    public readonly timestamp: Date,
    public readonly triggeredBy: string,
    public readonly duration: number,
  ) {}
}
