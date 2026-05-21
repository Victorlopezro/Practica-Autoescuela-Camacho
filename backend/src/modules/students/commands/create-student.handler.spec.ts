import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateStudentHandler } from './create-student.handler';
import { CreateStudentCommand } from './create-student.command';

describe('CreateStudentHandler', () => {
  let handler: CreateStudentHandler;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    username: 'jperez',
    name: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '612345678',
    role: 'student',
    createdAt: new Date(),
  };

  const mockStudent = {
    id: 'student-1',
    userId: 'user-1',
    teacherId: null,
    licenseType: null,
    remainingClasses: 0,
    balanceHistory: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      teacher: {
        findUnique: jest.fn(),
      },
      student: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateStudentHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<CreateStudentHandler>(CreateStudentHandler);
    jest.clearAllMocks();
  });

  it('should create user and student successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        student: {
          create: jest.fn().mockResolvedValue(mockStudent),
        },
      };
      return cb(tx);
    });

    const result = await handler.execute(
      new CreateStudentCommand(
        'jperez', 'secure123', 'Juan', 'Pérez',
        'juan@example.com', '612345678', undefined, undefined,
      ),
    );

    expect(result).toEqual({ ...mockStudent, user: mockUser });
  });

  it('should throw ConflictException when username already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      handler.execute(
        new CreateStudentCommand('jperez', 'secure123', 'Juan'),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException when teacherId does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.teacher.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(
        new CreateStudentCommand(
          'jperez', 'secure123', 'Juan', undefined,
          undefined, undefined, undefined, 'teacher-unknown',
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
