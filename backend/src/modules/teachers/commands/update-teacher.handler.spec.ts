import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateTeacherHandler } from './update-teacher.handler';
import { UpdateTeacherCommand } from './update-teacher.command';

describe('UpdateTeacherHandler', () => {
  let handler: UpdateTeacherHandler;
  let prisma: any;

  const mockTeacher = {
    id: 'teacher-1',
    name: 'John',
    doubleSession: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    username: 'jdoe',
    name: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '612345678',
    role: 'teacher',
    teacherId: 'teacher-1',
  };

  const mockTeacherVehicles = [
    {
      id: 'tv-1',
      teacherId: 'teacher-1',
      vehicleId: 'vehicle-1',
      vehicle: { id: 'vehicle-1', plate: 'ABC123' },
    },
  ];

  beforeEach(async () => {
    prisma = {
      teacher: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      vehicle: {
        findMany: jest.fn(),
      },
      teacherVehicle: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateTeacherHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<UpdateTeacherHandler>(UpdateTeacherHandler);
    jest.clearAllMocks();
  });

  it('should update teacher fields', async () => {
    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.user.findFirst.mockResolvedValue(mockUser);
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        user: {
          update: jest.fn().mockResolvedValue({ ...mockUser, name: 'John Updated' }),
        },
        teacher: {
          update: jest.fn().mockResolvedValue({ ...mockTeacher, name: 'John Updated' }),
        },
        teacherVehicle: {
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        vehicle: {
          findMany: jest.fn().mockResolvedValue([{ id: 'vehicle-2', plate: 'DEF456' }]),
        },
      };
      return cb(tx);
    });

    prisma.teacher.findUnique
      .mockResolvedValueOnce(mockTeacher) // first find
      .mockResolvedValueOnce({ ...mockTeacher, name: 'John Updated' }); // after update

    prisma.teacherVehicle.findMany.mockResolvedValue(mockTeacherVehicles);

    const result = await handler.execute(
      new UpdateTeacherCommand('teacher-1', undefined, undefined, 'John Updated'),
    );

    expect(result).toBeDefined();
    expect(result.name).toBe('John Updated');
  });

  it('should throw NotFoundException when teacher not found', async () => {
    prisma.teacher.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateTeacherCommand('unknown')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw NotFoundException when associated user not found', async () => {
    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateTeacherCommand('teacher-1')),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw ConflictException when username already taken', async () => {
    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.user.findFirst.mockResolvedValue(mockUser);
    prisma.user.findUnique.mockResolvedValue({ ...mockUser, id: 'user-2', username: 'taken' });

    await expect(
      handler.execute(new UpdateTeacherCommand('teacher-1', 'taken')),
    ).rejects.toThrow(ConflictException);
  });
});
