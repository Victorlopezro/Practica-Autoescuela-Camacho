import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CompleteReservationHandler } from './complete-reservation.handler';
import { CompleteReservationCommand } from './complete-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

describe('CompleteReservationHandler', () => {
  let handler: CompleteReservationHandler;
  let prisma: any;
  let eventBus: any;

  const mockReservation = {
    id: 'res-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleType: 'coche-manual',
    startTime: new Date('2026-06-01T10:00:00.000Z'),
    duration: 45,
    status: 'confirmed',
    cancelledAt: null,
    refundAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      reservation: { findUnique: jest.fn(), update: jest.fn() },
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteReservationHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<CompleteReservationHandler>(
      CompleteReservationHandler,
    );
    jest.clearAllMocks();
  });

  it('should complete a confirmed reservation', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    const completedReservation = { ...mockReservation, status: 'completed' };
    prisma.reservation.update.mockResolvedValue(completedReservation);

    const result = await handler.execute(
      new CompleteReservationCommand('res-1', 'admin-1'),
    );

    expect(result.status).toBe('completed');
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });

  it('should throw NotFoundException when reservation does not exist', async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new CompleteReservationCommand('unknown', 'admin-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when reservation is not confirmed (pending)', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'pending',
    });

    await expect(
      handler.execute(new CompleteReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when already completed', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'completed',
    });

    await expect(
      handler.execute(new CompleteReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should publish event on success', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.reservation.update.mockResolvedValue({
      ...mockReservation,
      status: 'completed',
    });

    await handler.execute(new CompleteReservationCommand('res-1', 'admin-1'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });
});
