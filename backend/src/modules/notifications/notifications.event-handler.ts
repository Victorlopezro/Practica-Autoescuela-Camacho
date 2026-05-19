import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ReservationStatusChangedEvent } from '../../modules/reservations/events';
import { PaymentCompletedEvent } from '../../modules/payments/events';
import { NotificationsService } from './notifications.service';

@EventsHandler(ReservationStatusChangedEvent)
export class ReservationNotificationHandler implements IEventHandler<ReservationStatusChangedEvent> {
  private readonly logger = new Logger(ReservationNotificationHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: ReservationStatusChangedEvent) {
    const { reservationId, newStatus, duration } = event;

    if (newStatus === 'confirmed') {
      this.logger.log(`Sending confirmation notification for reservation ${reservationId}`);
      await this.notificationsService.sendNotification({
        recipient: reservationId,
        channel: 'whatsapp',
        template: 'reservation-confirmed',
        data: {
          reservationId,
          duration,
          status: 'confirmed',
        },
      });
    }

    if (newStatus === 'cancelled') {
      this.logger.log(`Sending cancellation notification for reservation ${reservationId}`);
      await this.notificationsService.sendNotification({
        recipient: reservationId,
        channel: 'whatsapp',
        template: 'reservation-cancelled',
        data: {
          reservationId,
          status: 'cancelled',
        },
      });
    }
  }
}

@EventsHandler(PaymentCompletedEvent)
export class PaymentNotificationHandler implements IEventHandler<PaymentCompletedEvent> {
  private readonly logger = new Logger(PaymentNotificationHandler.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  async handle(event: PaymentCompletedEvent) {
    const { paymentId, reservationId, amount } = event;

    this.logger.log(`Sending payment confirmation for reservation ${reservationId}`);
    await this.notificationsService.sendNotification({
      recipient: reservationId,
      channel: 'whatsapp',
      template: 'payment-completed',
      data: {
        paymentId,
        reservationId,
        amount,
        status: 'completed',
      },
    });
  }
}
