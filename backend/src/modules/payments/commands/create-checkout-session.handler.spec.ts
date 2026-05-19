import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateCheckoutSessionHandler } from './create-checkout-session.handler';
import { CreateCheckoutSessionCommand } from './create-checkout-session.command';
import { MockStripeProvider } from '../providers/mock-stripe-provider';
import { PaymentCompletedEvent } from '../events/payment-completed.event';

describe('CreateCheckoutSessionHandler', () => {
  let handler: CreateCheckoutSessionHandler;
  let prisma: any;
  let mockStripeProvider: any;
  let eventBus: any;

  const mockReservation = {
    id: 'res-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleType: 'coche-manual',
    startTime: new Date('2026-06-01T10:00:00.000Z'),
    duration: 45,
    status: 'pending',
    cancelledAt: null,
    refundAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment = {
    id: 'pay-1',
    reservationId: 'res-1',
    stripeSessionId: 'cs_mock_res-1_1234567890',
    status: 'pending',
    amount: 2500,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSession = {
    url: 'https://mock-checkout.example.com/pay/res-1',
    sessionId: 'cs_mock_res-1_1234567890',
  };

  beforeEach(async () => {
    prisma = {
      reservation: {
        findUnique: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockStripeProvider = {
      createCheckoutSession: jest.fn().mockResolvedValue(mockSession),
    };

    eventBus = {
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCheckoutSessionHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: MockStripeProvider, useValue: mockStripeProvider },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<CreateCheckoutSessionHandler>(CreateCheckoutSessionHandler);
    jest.clearAllMocks();
  });

  it('should create a checkout session for an existing reservation', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue(mockPayment);

    const result = await handler.execute(new CreateCheckoutSessionCommand('res-1'));

    // Provider is called first
    expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith({
      reservationId: 'res-1',
      amount: 2500,
    });

    // Then payment is created with session ID
    expect(prisma.payment.create).toHaveBeenCalledWith({
      data: {
        reservationId: 'res-1',
        stripeSessionId: mockSession.sessionId,
        amount: 2500,
        status: 'pending',
      },
    });

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(PaymentCompletedEvent),
    );
    expect(result).toEqual({ url: mockSession.url });
  });

  it('should calculate amount correctly for 90-minute reservations', async () => {
    const longReservation = { ...mockReservation, duration: 90 };
    prisma.reservation.findUnique.mockResolvedValue(longReservation);
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue({ ...mockPayment, amount: 5000 });

    await handler.execute(new CreateCheckoutSessionCommand('res-1'));

    expect(mockStripeProvider.createCheckoutSession).toHaveBeenCalledWith({
      reservationId: 'res-1',
      amount: 5000,
    });
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 5000 }),
      }),
    );
  });

  it('should update an existing payment record if one exists', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.payment.findUnique.mockResolvedValue(mockPayment);
    prisma.payment.update.mockResolvedValue({
      ...mockPayment,
      stripeSessionId: 'cs_mock_res-1_updated',
    });

    await handler.execute(new CreateCheckoutSessionCommand('res-1'));

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(prisma.payment.update).toHaveBeenCalledWith({
      where: { id: 'pay-1' },
      data: { stripeSessionId: mockSession.sessionId },
    });
  });

  it('should throw NotFoundException for missing reservation', async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new CreateCheckoutSessionCommand('nonexistent')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should publish PaymentCompletedEvent with correct data', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.payment.findUnique.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue(mockPayment);

    await handler.execute(new CreateCheckoutSessionCommand('res-1'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      new PaymentCompletedEvent('pay-1', 'res-1', mockSession.sessionId, 2500),
    );
  });
});
