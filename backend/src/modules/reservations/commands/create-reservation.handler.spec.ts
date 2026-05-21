import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateReservationHandler } from './create-reservation.handler';
import { CreateReservationCommand } from './create-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

describe('CreateReservationHandler', () => {
  let handler: CreateReservationHandler;
  let prisma: any;
  let eventBus: any;

  const mockTeacher = { id: 'teacher-1', name: 'John' };
  const mockStudent = {
    id: 'student-1',
    remainingClasses: 10,
    balanceHistory: [],
  };

  beforeEach(async () => {
    prisma = {
      teacher: { findUnique: jest.fn() },
      student: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateReservationHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<CreateReservationHandler>(CreateReservationHandler);
    jest.clearAllMocks();
  });

  it('should create a reservation when no overlap exists', async () => {
    const startTime = new Date('2026-06-01T10:00:00.000Z');
    const endTime = new Date('2026-06-01T10:45:00.000Z');

    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    const mockReservation = {
      id: 'res-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      vehicleType: 'coche-manual',
      startTime,
      duration: 45,
      status: 'pending',
      cancelledAt: null,
      refundAmount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        student: {
          findUnique: jest.fn().mockResolvedValue(mockStudent),
          update: jest.fn().mockResolvedValue(mockStudent),
        },
        reservation: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue(mockReservation),
        },
      };
      return cb(tx);
    });

    const result = await handler.execute(
      new CreateReservationCommand(
        'student-1',
        'teacher-1',
        'coche-manual',
        startTime,
        45,
        'admin-1',
      ),
    );

    expect(result).toEqual(mockReservation);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });

  it('should throw NotFoundException when teacher does not exist', async () => {
    prisma.teacher.findUnique.mockResolvedValue(null);
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    await expect(
      handler.execute(
        new CreateReservationCommand(
          'student-1',
          'unknown-teacher',
          'coche-manual',
          new Date(),
          45,
          'admin-1',
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when student does not exist', async () => {
    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(
        new CreateReservationCommand(
          'unknown-student',
          'teacher-1',
          'coche-manual',
          new Date(),
          45,
          'admin-1',
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException when schedule overlaps', async () => {
    const startTime = new Date('2026-06-01T10:00:00.000Z');

    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    const existingReservation = {
      id: 'existing-res',
      startTime: new Date('2026-06-01T10:00:00.000Z'),
      duration: 45,
      status: 'confirmed',
    };

    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        student: {
          findUnique: jest.fn().mockResolvedValue(mockStudent),
          update: jest.fn().mockResolvedValue(mockStudent),
        },
        reservation: {
          findMany: jest.fn().mockResolvedValue([existingReservation]),
          create: jest.fn(),
        },
      };
      return cb(tx);
    });

    await expect(
      handler.execute(
        new CreateReservationCommand(
          'student-1',
          'teacher-1',
          'coche-manual',
          startTime,
          45,
          'admin-1',
        ),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should publish ReservationStatusChangedEvent on success', async () => {
    const startTime = new Date('2026-06-01T10:00:00.000Z');
    const mockReservation = {
      id: 'res-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      vehicleType: 'coche-manual',
      startTime,
      duration: 45,
      status: 'pending',
      cancelledAt: null,
      refundAmount: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        student: {
          findUnique: jest.fn().mockResolvedValue(mockStudent),
          update: jest.fn().mockResolvedValue(mockStudent),
        },
        reservation: {
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn().mockResolvedValue(mockReservation),
        },
      };
      return cb(tx);
    });

    await handler.execute(
      new CreateReservationCommand(
        'student-1',
        'teacher-1',
        'coche-manual',
        startTime,
        45,
        'admin-1',
      ),
    );

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(ReservationStatusChangedEvent),
    );
  });
});
