import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/services/prisma.service';
import { NotificationsService } from './notifications.service';
import { MockWhatsAppProvider } from './providers/mock-whatsapp-provider';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let mockWhatsAppProvider: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockWhatsAppProvider = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: MockWhatsAppProvider, useValue: mockWhatsAppProvider },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    jest.clearAllMocks();
  });

  it('should send a notification and save to DB', async () => {
    const mockNotification = {
      id: 'notif-1',
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'reservation-confirmed',
      data: { reservationId: 'res-1' },
      status: 'pending',
      error: null,
      createdAt: new Date(),
    };

    prisma.notification.create.mockResolvedValue(mockNotification);
    mockWhatsAppProvider.send.mockResolvedValue({ success: true });
    prisma.notification.update.mockResolvedValue({ ...mockNotification, status: 'sent' });

    const result = await service.sendNotification({
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'reservation-confirmed',
      data: { reservationId: 'res-1' },
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        recipient: 'res-1',
        channel: 'whatsapp',
        template: 'reservation-confirmed',
        data: { reservationId: 'res-1' },
        status: 'pending',
      },
    });
    expect(mockWhatsAppProvider.send).toHaveBeenCalledWith({
      to: 'res-1',
      template: 'reservation-confirmed',
      data: { reservationId: 'res-1' },
    });
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: 'sent' },
    });
    expect(result).toEqual({ success: true });
  });

  it('should handle provider failure gracefully', async () => {
    const mockNotification = {
      id: 'notif-1',
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'reservation-cancelled',
      data: { reservationId: 'res-1' },
      status: 'pending',
      error: null,
      createdAt: new Date(),
    };

    prisma.notification.create.mockResolvedValue(mockNotification);
    mockWhatsAppProvider.send.mockResolvedValue({ success: false, error: 'Provider error' });
    prisma.notification.update.mockResolvedValue({
      ...mockNotification,
      status: 'failed',
      error: 'Provider error',
    });

    const result = await service.sendNotification({
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'reservation-cancelled',
      data: { reservationId: 'res-1' },
    });

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: 'failed', error: 'Provider error' },
    });
    expect(result).toEqual({ success: false, error: 'Provider error' });
  });

  it('should handle thrown exceptions from provider', async () => {
    const mockNotification = {
      id: 'notif-1',
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'test',
      data: {},
      status: 'pending',
      error: null,
      createdAt: new Date(),
    };

    prisma.notification.create.mockResolvedValue(mockNotification);
    mockWhatsAppProvider.send.mockRejectedValue(new Error('Network error'));
    prisma.notification.update.mockResolvedValue({
      ...mockNotification,
      status: 'failed',
      error: 'Network error',
    });

    const result = await service.sendNotification({
      recipient: 'res-1',
      channel: 'whatsapp',
      template: 'test',
      data: {},
    });

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: 'failed', error: 'Network error' },
    });
    expect(result).toEqual({ success: false, error: 'Network error' });
  });
});
