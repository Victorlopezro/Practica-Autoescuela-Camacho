import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { NotificationsService } from './notifications.service';
import { MockWhatsAppProvider } from './providers/mock-whatsapp-provider';
import {
  ReservationNotificationHandler,
  PaymentNotificationHandler,
} from './notifications.event-handler';

const eventHandlers = [
  ReservationNotificationHandler,
  PaymentNotificationHandler,
];

@Module({
  imports: [CqrsModule],
  providers: [
    NotificationsService,
    { provide: 'NOTIFICATION_PROVIDER', useClass: MockWhatsAppProvider },
    MockWhatsAppProvider,
    ...eventHandlers,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
