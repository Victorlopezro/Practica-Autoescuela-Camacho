import { IEvent } from '@nestjs/cqrs';

export class PaymentFailedEvent implements IEvent {
  constructor(
    public readonly paymentId: string,
    public readonly reservationId: string,
    public readonly stripeSessionId: string,
    public readonly error: string,
  ) {}
}
