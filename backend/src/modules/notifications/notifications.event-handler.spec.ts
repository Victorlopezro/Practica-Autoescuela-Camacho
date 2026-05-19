import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { ReservationNotificationHandler, PaymentNotificationHandler } from './notifications.event-handler';
import { ReservationStatusChangedEvent } from '../reservations/events';
import { PaymentCompletedEvent } from '../payments/events';

describe('ReservationNotificationHandler', () => {
  let handler: ReservationNotificationHandler;
  let notificationsService: any;

  beforeEach(async () => {
    notificationsService = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationNotificationHandler,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    handler = module.get<ReservationNotificationHandler>(ReservationNotificationHandler);
    jest.clearAllMocks();
  });

  it('should send confirmation notification when reservation is confirmed', async () => {
    const event = new ReservationStatusChangedEvent(
      'res-1',
      'pending',
      'confirmed',
      new Date(),
      'admin-1',
      45,
    );

    await handler.handle(event);

    expect(notificationsService.sendNotification).toHaveBeenCalledWith({
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'reservation-confirmed',
      data: {
        reservationId: 'res-1',
        duration: 45,
        status: 'confirmed',
      },
    });
  });

  it('should send cancellation notification when reservation is cancelled', async () => {
    const event = new ReservationStatusChangedEvent(
      'res-1',
      'confirmed',
      'cancelled',
      new Date(),
      'admin-1',
      45,
    );

    await handler.handle(event);

    expect(notificationsService.sendNotification).toHaveBeenCalledWith({
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'reservation-cancelled',
      data: {
        reservationId: 'res-1',
        status: 'cancelled',
      },
    });
  });

  it('should not send notification for other status transitions', async () => {
    const event = new ReservationStatusChangedEvent(
      'res-1',
      null,
      'pending',
      new Date(),
      'admin-1',
      45,
    );

    await handler.handle(event);

    expect(notificationsService.sendNotification).not.toHaveBeenCalled();
  });
});

describe('PaymentNotificationHandler', () => {
  let handler: PaymentNotificationHandler;
  let notificationsService: any;

  beforeEach(async () => {
    notificationsService = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentNotificationHandler,
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    handler = module.get<PaymentNotificationHandler>(PaymentNotificationHandler);
    jest.clearAllMocks();
  });

  it('should send payment completed notification', async () => {
    const event = new PaymentCompletedEvent(
      'pay-1',
      'res-1',
      'cs_mock_session',
      2500,
    );

    await handler.handle(event);

    expect(notificationsService.sendNotification).toHaveBeenCalledWith({
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'payment-completed',
      data: {
        paymentId: 'pay-1',
        reservationId: 'res-1',
        amount: 2500,
        status: 'completed',
      },
    });
  });
});
