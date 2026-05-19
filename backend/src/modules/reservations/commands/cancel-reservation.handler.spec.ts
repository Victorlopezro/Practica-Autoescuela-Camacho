import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CancelReservationHandler } from './cancel-reservation.handler';
import { CancelReservationCommand } from './cancel-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

describe('CancelReservationHandler', () => {
  let handler: CancelReservationHandler;
  let prisma: any;
  let eventBus: any;

  const baseReservation = {
    id: 'res-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleType: 'coche-manual',
    startTime: new Date('2099-06-01T10:00:00.000Z'), // far future so deadline hasn't passed
    duration: 45,
    status: 'pending',
    cancelledAt: null,
    refundAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStudent = {
    id: 'student-1',
    remainingClasses: 10,
    balanceHistory: [],
  };

  beforeEach(async () => {
    prisma = {
      reservation: { findUnique: jest.fn(), update: jest.fn() },
      student: { findUnique: jest.fn(), update: jest.fn() },
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelReservationHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<CancelReservationHandler>(CancelReservationHandler);
    jest.clearAllMocks();
  });

  it('should cancel a pending reservation (no refund)', async () => {
    prisma.reservation.findUnique.mockResolvedValue(baseReservation);
    prisma.reservation.update.mockResolvedValue({
      ...baseReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      refundAmount: 0,
    });

    const result = await handler.execute(
      new CancelReservationCommand('res-1', 'admin-1'),
    );

    expect(result.status).toBe('cancelled');
    expect(result.refundAmount).toBe(0);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });

  it('should cancel a confirmed reservation before deadline (with refund)', async () => {
    const confirmedReservation = {
      ...baseReservation,
      status: 'confirmed',
    };

    prisma.reservation.findUnique.mockResolvedValue(confirmedReservation);
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({ ...mockStudent, remainingClasses: 11 });
    prisma.reservation.update.mockResolvedValue({
      ...confirmedReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      refundAmount: 1,
    });

    const result = await handler.execute(
      new CancelReservationCommand('res-1', 'admin-1'),
    );

    expect(result.status).toBe('cancelled');
    expect(result.refundAmount).toBe(1);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });

  it('should throw NotFoundException when reservation does not exist', async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new CancelReservationCommand('unknown', 'admin-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when reservation is completed', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...baseReservation,
      status: 'completed',
    });

    await expect(
      handler.execute(new CancelReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when reservation is already cancelled', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...baseReservation,
      status: 'cancelled',
    });

    await expect(
      handler.execute(new CancelReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when past deadline for any status', async () => {
    // Use yesterday's date so deadline (18:00 UTC day prior) has definitely passed
    const yesterdayMidnight = new Date();
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setUTCHours(0, 0, 0, 0);

    const oldReservation = {
      ...baseReservation,
      startTime: yesterdayMidnight,
      status: 'pending',
    };

    prisma.reservation.findUnique.mockResolvedValue(oldReservation);

    await expect(
      handler.execute(new CancelReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should publish event on success', async () => {
    prisma.reservation.findUnique.mockResolvedValue(baseReservation);
    prisma.reservation.update.mockResolvedValue({
      ...baseReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      refundAmount: 0,
    });

    await handler.execute(new CancelReservationCommand('res-1', 'admin-1'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });
});
