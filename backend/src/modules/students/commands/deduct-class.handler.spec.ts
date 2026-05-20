import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeductClassHandler } from './deduct-class.handler';
import { DeductClassCommand } from './deduct-class.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

describe('DeductClassHandler', () => {
  let handler: DeductClassHandler;
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
        DeductClassHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<DeductClassHandler>(DeductClassHandler);
    jest.clearAllMocks();
  });

  it('should deduct 1 class for 45-minute session', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 9,
    });

    const result = await handler.execute(
      new DeductClassCommand('student-1', 45, 'admin-1'),
    );

    expect(result).toEqual({ remainingClasses: 9 });
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: 'student-1' },
      data: expect.objectContaining({
        remainingClasses: 9,
      }),
    });
  });

  it('should deduct 2 classes for 90-minute session', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 8,
    });

    const result = await handler.execute(
      new DeductClassCommand('student-1', 90, 'admin-1'),
    );

    expect(result).toEqual({ remainingClasses: 8 });
  });

  it('should throw NotFoundException when student does not exist', async () => {
    prisma.student.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new DeductClassCommand('unknown', 45, 'admin-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when insufficient classes', async () => {
    const poorStudent = { ...mockStudent, remainingClasses: 0 };
    prisma.student.findUnique.mockResolvedValue(poorStudent);

    await expect(
      handler.execute(new DeductClassCommand('student-1', 45, 'admin-1')),
    ).rejects.toThrow(BadRequestException);
  });

  it('should publish BalanceAdjustedEvent with negative amount', async () => {
    prisma.student.findUnique.mockResolvedValue(mockStudent);
    prisma.student.update.mockResolvedValue({
      ...mockStudent,
      remainingClasses: 9,
    });

    await handler.execute(new DeductClassCommand('student-1', 45, 'admin-1'));

    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(BalanceAdjustedEvent),
    );
  });
});
