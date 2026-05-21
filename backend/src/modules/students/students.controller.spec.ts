import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { StudentsController } from './students.controller';
import { AdjustBalanceCommand } from './commands/adjust-balance.command';
import { CreateStudentCommand } from './commands/create-student.command';
import { DeductClassCommand } from './commands/deduct-class.command';
import { RefillClassCommand } from './commands/refill-class.command';
import { UpdateStudentCommand } from './commands/update-student.command';
import { DeleteStudentCommand } from './commands/delete-student.command';

describe('StudentsController', () => {
  let controller: StudentsController;
  let prisma: any;
  let commandBus: any;

  const mockStudent = {
    id: 'student-1',
    userId: 'user-1',
    remainingClasses: 10,
    balanceHistory: [],
  };

  const mockUserRecord = {
    id: 'user-1',
    username: 'jperez',
    name: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '612345678',
  };

  const mockUser = { sub: 'admin-1', username: 'admin', role: 'admin' };

  beforeEach(async () => {
    prisma = {
      student: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
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

  describe('findAll', () => {
    it('should return paginated students with user profiles', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.student.count.mockResolvedValue(1);
      prisma.user.findMany.mockResolvedValue([mockUserRecord]);

      const result = await controller.findAll(undefined, undefined, mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user).toEqual(mockUserRecord);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty list when no students', async () => {
      prisma.student.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(0);

      const result = await controller.findAll('1', '20', mockUser);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('should handle pagination correctly', async () => {
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.student.count.mockResolvedValue(3);
      prisma.user.findMany.mockResolvedValue([mockUserRecord]);

      const result = await controller.findAll('2', '1', mockUser);

      expect(result.data).toHaveLength(1);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(1);
      expect(result.totalPages).toBe(3);
      expect(prisma.student.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 1,
        take: 1,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return student with user profile when found', async () => {
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.user.findUnique.mockResolvedValue(mockUserRecord);

      const result = await controller.findOne('student-1', mockUser);

      expect(result).toEqual({ ...mockStudent, user: mockUserRecord });
    });

    it('should throw NotFoundException when student not found', async () => {
      prisma.student.findUnique.mockResolvedValue(null);

      await expect(controller.findOne('unknown', mockUser)).rejects.toThrow(
        NotFoundException,
      );
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

      await controller.deductClass('student-1', { duration: 45 }, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeductClassCommand),
      );
    });
  });

  describe('refillClass', () => {
    it('should execute RefillClassCommand', async () => {
      commandBus.execute.mockResolvedValue({ remainingClasses: 15 });

      await controller.refillClass('student-1', { amount: 5 }, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(RefillClassCommand),
      );
    });
  });

  describe('create', () => {
    it('should execute CreateStudentCommand', async () => {
      const dto = {
        username: 'jperez',
        password: 'secure123',
        name: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        phone: '612345678',
      };
      commandBus.execute.mockResolvedValue({ id: 'student-1' });

      const result = await controller.create(dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateStudentCommand),
      );
      expect(result).toEqual({ id: 'student-1' });
    });
  });

  describe('update', () => {
    it('should execute UpdateStudentCommand', async () => {
      const dto = { name: 'Juan Carlos' };
      commandBus.execute.mockResolvedValue({ id: 'student-1' });

      const result = await controller.update('student-1', dto);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdateStudentCommand),
      );
      expect(result).toEqual({ id: 'student-1' });
    });
  });

  describe('remove', () => {
    it('should execute DeleteStudentCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      await controller.remove('student-1');

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteStudentCommand),
      );
    });
  });
});
