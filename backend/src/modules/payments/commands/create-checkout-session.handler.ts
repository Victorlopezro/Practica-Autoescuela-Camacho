import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { MockStripeProvider } from '../providers/mock-stripe-provider';
import { CreateCheckoutSessionCommand } from './create-checkout-session.command';
import { PaymentCompletedEvent } from '../events/payment-completed.event';

const PRICE_PER_CLASS_CENTS = 2500;

@CommandHandler(CreateCheckoutSessionCommand)
export class CreateCheckoutSessionHandler implements ICommandHandler<CreateCheckoutSessionCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockStripeProvider: MockStripeProvider,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateCheckoutSessionCommand) {
    const { reservationId } = command;

    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const classCount = reservation.duration === 90 ? 2 : 1;
    const amount = classCount * PRICE_PER_CLASS_CENTS;

    // Create the Stripe session first (mock)
    const session = await this.mockStripeProvider.createCheckoutSession({
      reservationId,
      amount,
    });

    // Find or create a Payment record — stripeSessionId is required in the schema
    let payment = await this.prisma.payment.findUnique({ where: { reservationId } });
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          reservationId,
          stripeSessionId: session.sessionId,
          amount,
          status: 'pending',
        },
      });
    } else {
      payment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          stripeSessionId: session.sessionId,
        },
      });
    }

    this.eventBus.publish(
      new PaymentCompletedEvent(
        payment.id,
        reservationId,
        session.sessionId,
        amount,
      ),
    );

    return { url: session.url };
  }
}
