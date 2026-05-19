import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { ConfirmReservationHandler } from './confirm-reservation.handler';
import { ConfirmReservationCommand } from './confirm-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

describe('ConfirmReservationHandler', () => {
  let handler: ConfirmReservationHandler;
  let prisma: any;
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

  const mockStudent = {
    id: 'student-1',
    remainingClasses: 10,
    balanceHistory: [],
  };

  beforeEach(async () => {
    prisma = {
      reservation: { findUnique: jest.fn(), update: jest.fn() },
      student: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmReservationHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<ConfirmReservationHandler>(ConfirmReservationHandler);
    jest.clearAllMocks();
  });

  it('should confirm a pending reservation with sufficient balance', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    const updatedReservation = { ...mockReservation, status: 'confirmed' };
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        student: { update: jest.fn().mockResolvedValue({ ...mockStudent, remainingClasses: 9 }) },
        reservation: { update: jest.fn().mockResolvedValue(updatedReservation) },
      };
      return cb(tx);
    });

    const result = await handler.execute(
      new ConfirmReservationCommand('res-1', 'admin-1'),
    );

    expect(result).toEqual(updatedReservation);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });

  it('should throw NotFoundException when reservation does not exist', async () => {
    prisma.reservation.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new ConfirmReservationCommand('unknown', 'admin-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when reservation is not pending', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'confirmed',
    });

    await expect(
      handler.execute(new ConfirmReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when insufficient balance', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.student.findUnique.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 0,
    });

    await expect(
      handler.execute(new ConfirmReservationCommand('res-1', 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should publish event on success', async () => {
    prisma.reservation.findUnique.mockResolvedValue(mockReservation);
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    const updatedReservation = { ...mockReservation, status: 'confirmed' };
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        student: { update: jest.fn() },
        reservation: { update: jest.fn().mockResolvedValue(updatedReservation) },
      };
      return cb(tx);
    });

    await handler.execute(new ConfirmReservationCommand('res-1', 'admin-1'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });
});
