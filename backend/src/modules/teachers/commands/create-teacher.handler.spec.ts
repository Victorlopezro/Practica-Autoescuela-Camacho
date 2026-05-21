import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateTeacherHandler } from './create-teacher.handler';
import { CreateTeacherCommand } from './create-teacher.command';

describe('CreateTeacherHandler', () => {
  let handler: CreateTeacherHandler;
  let prisma: any;

  const mockUser = {
    id: 'user-1',
    username: 'jdoe',
    name: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '612345678',
    role: 'teacher',
    createdAt: new Date(),
  };

  const mockTeacher = {
    id: 'teacher-1',
    name: 'John',
    doubleSession: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVehicles = [
    { id: 'vehicle-1', plate: 'ABC123' },
    { id: 'vehicle-2', plate: 'DEF456' },
  ];

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      teacher: {
        create: jest.fn(),
      },
      vehicle: {
        findMany: jest.fn(),
      },
      teacherVehicle: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTeacherHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<CreateTeacherHandler>(CreateTeacherHandler);
    jest.clearAllMocks();
  });

  it('should create teacher and user successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        teacher: {
          create: jest.fn().mockResolvedValue(mockTeacher),
        },
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        teacherVehicle: {
          createMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
        vehicle: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };
      return cb(tx);
    });

    const result = await handler.execute(
      new CreateTeacherCommand(
        'jdoe', 'secure123', 'John', 'Doe',
        'john@example.com', '612345678', undefined,
      ),
    );

    expect(result).toEqual({ ...mockTeacher, user: mockUser, vehicles: [] });
  });

  it('should create teacher with vehicles', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.vehicle.findMany.mockResolvedValue(mockVehicles);
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        teacher: {
          create: jest.fn().mockResolvedValue(mockTeacher),
        },
        user: {
          create: jest.fn().mockResolvedValue(mockUser),
        },
        teacherVehicle: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        vehicle: {
          findMany: jest.fn().mockResolvedValue(mockVehicles),
        },
      };
      return cb(tx);
    });

    const result = await handler.execute(
      new CreateTeacherCommand(
        'jdoe', 'secure123', 'John', undefined,
        undefined, undefined, ['vehicle-1', 'vehicle-2'],
      ),
    );

    expect(result).toEqual({ ...mockTeacher, user: mockUser, vehicles: mockVehicles });
  });

  it('should throw ConflictException when username already exists', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      handler.execute(
        new CreateTeacherCommand('jdoe', 'secure123', 'John'),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException when vehicles not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.vehicle.findMany.mockResolvedValue([mockVehicles[0]]); // only 1 of 2

    await expect(
      handler.execute(
        new CreateTeacherCommand(
          'jdoe', 'secure123', 'John', undefined,
          undefined, undefined, ['vehicle-1', 'vehicle-unknown'],
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
