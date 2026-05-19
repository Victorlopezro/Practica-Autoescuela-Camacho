import { IEvent } from '@nestjs/cqrs';

export class PaymentCompletedEvent implements IEvent {
  constructor(
    public readonly paymentId: string,
    public readonly reservationId: string,
    public readonly stripeSessionId: string,
    public readonly amount: number,
  ) {}
}
