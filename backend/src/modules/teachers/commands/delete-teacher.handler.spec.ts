import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeleteTeacherHandler } from './delete-teacher.handler';
import { DeleteTeacherCommand } from './delete-teacher.command';

describe('DeleteTeacherHandler', () => {
  let handler: DeleteTeacherHandler;
  let prisma: any;

  const mockTeacher = {
    id: 'teacher-1',
    name: 'John',
    doubleSession: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      teacher: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      teacherVehicle: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteTeacherHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<DeleteTeacherHandler>(DeleteTeacherHandler);
    jest.clearAllMocks();
  });

  it('should delete teacher, vehicles, and user successfully', async () => {
    prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
    prisma.$transaction.mockImplementation(async (cb: Function) => {
      const tx = {
        teacherVehicle: {
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
        teacher: {
          delete: jest.fn().mockResolvedValue(mockTeacher),
        },
        user: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'user-1', teacherId: 'teacher-1' }),
          delete: jest.fn().mockResolvedValue({}),
        },
      };
      return cb(tx);
    });

    const result = await handler.execute(new DeleteTeacherCommand('teacher-1'));

    expect(result).toEqual({ message: 'Teacher deleted successfully' });
  });

  it('should throw NotFoundException when teacher not found', async () => {
    prisma.teacher.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteTeacherCommand('unknown')),
    ).rejects.toThrow(NotFoundException);
  });
});
