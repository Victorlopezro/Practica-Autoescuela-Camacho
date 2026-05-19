import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { StudentsController } from './students.controller';
import { AdjustBalanceCommand } from './commands/adjust-balance.command';
import { DeductClassCommand } from './commands/deduct-class.command';
import { RefillClassCommand } from './commands/refill-class.command';

describe('StudentsController', () => {
  let controller: StudentsController;
  let prisma: any;
  let commandBus: any;

  const mockStudent = {
    id: 'student-1',
    remainingClasses: 10,
    balanceHistory: [],
  };

  const mockUser = { sub: 'admin-1', username: 'admin', role: 'admin' };

  beforeEach(async () => {
    prisma = {
      student: {
        findUnique: jest.fn(),
      },
    };
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('should return student when found', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);

      const result = await controller.findOne('student-1');

      expect(result).toEqual(mockStudent);
    });

    it('should throw NotFoundException when student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      await expect(
        controller.findOne('unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjustBalance', () => {
    it('should execute AdjustBalanceCommand', async () => {
      commandBus.execute.mockResolvedValue({ remainingClasses: 15 });

      await controller.adjustBalance(
        'student-1',
        { amount: 5, reason: 'Payment received' },
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AdjustBalanceCommand),
      );
    });
  });

  describe('deductClass', () => {
    it('should execute DeductClassCommand', async () => {
      commandBus.execute.mockResolvedValue({ remainingClasses: 9 });

      await controller.deductClass(
        'student-1',
        { duration: 45 },
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeductClassCommand),
      );
    });
  });

  describe('refillClass', () => {
    it('should execute RefillClassCommand', async () => {
      commandBus.execute.mockResolvedValue({ remainingClasses: 15 });

      await controller.refillClass(
        'student-1',
        { amount: 5 },
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RefillClassCommand),
      );
    });
  });
});
