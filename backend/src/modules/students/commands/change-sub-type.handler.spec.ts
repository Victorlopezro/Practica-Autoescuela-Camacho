import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { ChangeSubTypeHandler } from './change-sub-type.handler';
import { ChangeSubTypeCommand } from './change-sub-type.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

describe('ChangeSubTypeHandler', () => {
  let handler: ChangeSubTypeHandler;
  let prisma: any;
  let eventBus: any;

  const mockStudent = {
    id: 'student-1',
    remainingClasses: 5,
    balanceHistory: [],
    licenseType: 'A2',
    licenseSubType: 'pista',
  };

  const mockFutureReservations = [
    {
      id: 'res-1',
      studentId: 'student-1',
      vehicleType: 'moto-pista',
      startTime: new Date('2026-06-15T10:00:00Z'),
      duration: 45,
      status: 'confirmed',
    },
    {
      id: 'res-2',
      studentId: 'student-1',
      vehicleType: 'moto-pista',
      startTime: new Date('2026-06-16T11:00:00Z'),
      duration: 45,
      status: 'pending',
    },
  ];

  beforeEach(async () => {
    prisma = {
      student: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      reservation: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeSubTypeHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<ChangeSubTypeHandler>(ChangeSubTypeHandler);
    jest.clearAllMocks();
  });

  it('should cancel future reservations and refund classes', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.reservation.findMany.mockResolvedValue(mockFutureReservations);
    // Simulate transaction callback being called with tx object
    const txMock = {
      reservation: { update: jest.fn() },
      student: {
        update: jest.fn().mockResolvedValue({
          ...mockStudent,
          remainingClasses: 7,
          licenseSubType: 'circulacion',
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(txMock));

    const result = await handler.execute(
      new ChangeSubTypeCommand('student-1', 'circulacion', 'admin-1'),
    );

    // Verify transaction created
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    // Verify both reservations cancelled
    expect(txMock.reservation.update).toHaveBeenCalledTimes(2);
    expect(txMock.reservation.update).toHaveBeenCalledWith({
      where: { id: 'res-1' },
      data: expect.objectContaining({
        status: 'cancelled',
        cancellationReason: 'Cambio a circulación',
        cancelledById: 'admin-1',
      }),
    });
    expect(txMock.reservation.update).toHaveBeenCalledWith({
      where: { id: 'res-2' },
      data: expect.objectContaining({
        status: 'cancelled',
        cancellationReason: 'Cambio a circulación',
        cancelledById: 'admin-1',
      }),
    });

    // Verify student updated: 2 reservations × 45min = 90min / 45 = 2 refund classes
    // 5 existing + 2 refund = 7
    expect(txMock.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        licenseSubType: 'circulacion',
        remainingClasses: 7,
        balanceHistory: expect.arrayContaining([
          expect.objectContaining({
            amount: 2,
            reason: expect.stringContaining('Refund por cambio a circulación'),
          }),
        ]),
      }),
    });

    expect(result.remainingClasses).toBe(7);
    expect(result.licenseSubType).toBe('circulacion');
  });

  it('should publish BalanceAdjustedEvent when refund > 0', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.reservation.findMany.mockResolvedValue(mockFutureReservations);
    const txMock = {
      reservation: { update: jest.fn() },
      student: {
        update: jest.fn().mockResolvedValue({
          ...mockStudent,
          remainingClasses: 7,
          licenseSubType: 'circulacion',
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(txMock));

    await handler.execute(
      new ChangeSubTypeCommand('student-1', 'circulacion', 'admin-1'),
    );

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(BalanceAdjustedEvent),
    );
  });

  it('should handle no future reservations (zero refund)', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.reservation.findMany.mockResolvedValue([]); // No future reservations
    const txMock = {
      reservation: { update: jest.fn() },
      student: {
        update: jest.fn().mockResolvedValue({
          ...mockStudent,
          remainingClasses: 5,
          licenseSubType: 'circulacion',
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(txMock));

    const result = await handler.execute(
      new ChangeSubTypeCommand('student-1', 'circulacion', 'admin-1'),
    );

    // No reservations to cancel
    expect(txMock.reservation.update).not.toHaveBeenCalled();
    // Balance unchanged (no refund)
    expect(txMock.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        remainingClasses: 5,
        licenseSubType: 'circulacion',
      }),
    });
    expect(result.remainingClasses).toBe(5);
    // No event should be published when refund is 0
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException when student does not exist', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(
        new ChangeSubTypeCommand('unknown', 'circulacion', 'admin-1'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when student is not A1/A2', async () => {
    prisma.student.findUnique.mockResolvedValue({
      ...mockStudent,
      licenseType: 'B',
    });

    await expect(
      handler.execute(
        new ChangeSubTypeCommand('student-1', 'circulacion', 'admin-1'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when student does not have licenseSubType=pista', async () => {
    prisma.student.findUnique.mockResolvedValue({
      ...mockStudent,
      licenseSubType: null,
    });

    await expect(
      handler.execute(
        new ChangeSubTypeCommand('student-1', 'circulacion', 'admin-1'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should refund correctly with different durations', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    // Mix of 45min and 90min reservations
    prisma.reservation.findMany.mockResolvedValue([
      {
        id: 'res-1',
        studentId: 'student-1',
        vehicleType: 'moto-pista',
        startTime: new Date('2026-06-15T10:00:00Z'),
        duration: 45,
        status: 'confirmed',
      },
      {
        id: 'res-2',
        studentId: 'student-1',
        vehicleType: 'moto-pista',
        startTime: new Date('2026-06-16T10:00:00Z'),
        duration: 90,
        status: 'confirmed',
      },
    ]);
    const txMock = {
      reservation: { update: jest.fn() },
      student: {
        update: jest.fn().mockResolvedValue({
          ...mockStudent,
          remainingClasses: 8,
          licenseSubType: 'circulacion',
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb: Function) => cb(txMock));

    const result = await handler.execute(
      new ChangeSubTypeCommand('student-1', 'circulacion', 'admin-1'),
    );

    // Total duration = 45 + 90 = 135. Refund = floor(135/45) = 3
    expect(txMock.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        remainingClasses: 8, // 5 + 3
        balanceHistory: expect.arrayContaining([
          expect.objectContaining({ amount: 3 }),
        ]),
      }),
    });
    expect(result.remainingClasses).toBe(8);
  });
});
