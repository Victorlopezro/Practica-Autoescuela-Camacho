import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { RefillClassHandler } from './refill-class.handler';
import { RefillClassCommand } from './refill-class.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

describe('RefillClassHandler', () => {
  let handler: RefillClassHandler;
  let prisma: any;
  let eventBus: any;

  const mockStudent = {
    id: 'student-1',
    remainingClasses: 10,
    balanceHistory: [],
  };

  beforeEach(async () => {
    prisma = {
      student: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefillClassHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<RefillClassHandler>(RefillClassHandler);
    jest.clearAllMocks();
  });

  it('should add classes and return new balance', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 15,
    });

    const result = await handler.execute(
      new RefillClassCommand('student-1', 5, 'admin-1'),
    );

    expect(result).toEqual({ remainingClasses: 15 });
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        remainingClasses: 15,
      }),
    });
  });

  it('should throw NotFoundException when student does not exist', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new RefillClassCommand('unknown', 5, 'admin-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should publish BalanceAdjustedEvent with correct parameters', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 15,
    });

    await handler.execute(new RefillClassCommand('student-1', 5, 'admin-1'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(BalanceAdjustedEvent),
    );
  });

  it('should update balanceHistory with refill entry', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 15,
    });

    await handler.execute(new RefillClassCommand('student-1', 5, 'admin-1'));

    const updateCall = prisma.student.update.mock.calls[0][0];
    expect(updateCall.data.balanceHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          amount: 5,
          reason: expect.stringContaining('Classes refilled'),
        }),
      ]),
    );
  });
});
