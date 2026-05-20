import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { AdjustBalanceHandler } from './adjust-balance.handler';
import { AdjustBalanceCommand } from './adjust-balance.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

describe('AdjustBalanceHandler', () => {
  let handler: AdjustBalanceHandler;
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
        AdjustBalanceHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<AdjustBalanceHandler>(AdjustBalanceHandler);
    jest.clearAllMocks();
  });

  it('should adjust balance and publish event when student exists', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 15,
    });

    const result = await handler.execute(
      new AdjustBalanceCommand('student-1', 5, 'Payment received', 'admin-1'),
    );

    expect(result).toEqual({ remainingClasses: 15 });
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        remainingClasses: 15,
        balanceHistory: expect.any(Array),
      }),
    });
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(BalanceAdjustedEvent),
    );
  });

  it('should throw NotFoundException when student does not exist', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(
        new AdjustBalanceCommand('unknown', 5, 'test', 'admin-1'),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when resulting balance is negative', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);

    await expect(
      handler.execute(
        new AdjustBalanceCommand('student-1', -20, 'Penalty', 'admin-1'),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('should publish BalanceAdjustedEvent with correct parameters', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 8,
    });

    await handler.execute(
      new AdjustBalanceCommand('student-1', -2, 'Class deduction', 'admin-1'),
    );

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(BalanceAdjustedEvent),
    );
  });
});
