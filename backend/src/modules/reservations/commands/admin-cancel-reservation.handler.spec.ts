import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { AdminCancelReservationHandler } from './admin-cancel-reservation.handler';
import { AdminCancelReservationCommand } from './admin-cancel-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

describe('AdminCancelReservationHandler', () => {
  let handler: AdminCancelReservationHandler;
  let prisma: any;
  let eventBus: any;

  const baseReservation = {
    id: 'res-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleType: 'coche-manual',
    startTime: new Date('2025-01-01T10:00:00.000Z'), // past date — deadline would have passed
    duration: 45,
    status: 'pending',
    cancelledAt: null,
    cancelledById: null,
    cancellationReason: null,
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
        AdminCancelReservationHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<AdminCancelReservationHandler>(
      AdminCancelReservationHandler,
    );
    jest.clearAllMocks();
  });

  it('should cancel a pending reservation past deadline (admin bypass)', async () => {
    prisma.reservation.findUnique.mockResolvedValue(baseReservation);
    prisma.reservation.update.mockResolvedValue({
      ...baseReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledById: 'admin-1',
      cancellationReason: 'Coche averiado',
      refundAmount: 0,
    });

    const result = await handler.execute(
      new AdminCancelReservationCommand('res-1', 'admin-1', 'Coche averiado'),
    );

    expect(result.status).toBe('cancelled');
    expect(result.refundAmount).toBe(0);
    expect(result.cancellationReason).toBe('Coche averiado');
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });

  it('should cancel a confirmed reservation past deadline with refund (admin bypass)', async () => {
    const confirmedReservation = {
      ...baseReservation,
      status: 'confirmed',
    };

    prisma.reservation.findUnique.mockResolvedValue(confirmedReservation);
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 11,
    });
    prisma.reservation.update.mockResolvedValue({
      ...confirmedReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledById: 'admin-1',
      cancellationReason: 'Profesor no disponible',
      refundAmount: 1,
    });

    const result = await handler.execute(
      new AdminCancelReservationCommand(
        'res-1',
        'admin-1',
        'Profesor no disponible',
      ),
    );

    expect(result.status).toBe('cancelled');
    expect(result.refundAmount).toBe(1);
    expect(result.cancelledById).toBe('admin-1');
    expect(result.cancellationReason).toBe('Profesor no disponible');
    expect(prisma.student.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { remainingClasses: 11 },
      }),
    );
  });

  it('should throw NotFoundException when reservation does not exist', async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(
        new AdminCancelReservationCommand('unknown', 'admin-1', 'test'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when reservation is completed', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...baseReservation,
      status: 'completed',
    });

    await expect(
      handler.execute(
        new AdminCancelReservationCommand('res-1', 'admin-1', 'test'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when reservation is already cancelled', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...baseReservation,
      status: 'cancelled',
    });

    await expect(
      handler.execute(
        new AdminCancelReservationCommand('res-1', 'admin-1', 'test'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should refund 2 classes for a 90-minute confirmed reservation', async () => {
    const longReservation = {
      ...baseReservation,
      duration: 90,
      status: 'confirmed',
    };

    prisma.reservation.findUnique.mockResolvedValue(longReservation);
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 12,
    });
    prisma.reservation.update.mockResolvedValue({
      ...longReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledById: 'admin-1',
      cancellationReason: 'Vehículo en mantenimiento',
      refundAmount: 2,
    });

    const result = await handler.execute(
      new AdminCancelReservationCommand(
        'res-1',
        'admin-1',
        'Vehículo en mantenimiento',
      ),
    );

    expect(result.refundAmount).toBe(2);
  });

  it('should publish event on success', async () => {
    prisma.reservation.findUnique.mockResolvedValue(baseReservation);
    prisma.reservation.update.mockResolvedValue({
      ...baseReservation,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledById: 'admin-1',
      cancellationReason: 'Ajuste administrativo',
      refundAmount: 0,
    });

    await handler.execute(
      new AdminCancelReservationCommand(
        'res-1',
        'admin-1',
        'Ajuste administrativo',
      ),
    );

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });
});
