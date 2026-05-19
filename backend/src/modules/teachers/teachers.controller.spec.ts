import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { TeachersController } from './teachers.controller';

describe('TeachersController', () => {
  let controller: TeachersController;
  let prisma: any;

  const mockTeachers = [
    { id: 'teacher-1', name: 'John Doe', createdAt: new Date() },
    { id: 'teacher-2', name: 'Jane Smith', createdAt: new Date() },
  ];

  beforeEach(async () => {
    prisma = {
      teacher: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
      },
      reservation: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeachersController],
      providers: [
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<TeachersController>(TeachersController);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated teachers with default pagination', async () => {
      prisma.teacher.findMany.mockResolvedValue(mockTeachers);
      prisma.teacher.count.mockResolvedValue(2);

      const result = await controller.findAll();

      expect(result).toEqual({
        data: mockTeachers,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.teacher.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return paginated teachers with custom page and limit', async () => {
      const singleTeacher = [mockTeachers[0]];
      prisma.teacher.findMany.mockResolvedValue(singleTeacher);
      prisma.teacher.count.mockResolvedValue(2);

      const result = await controller.findAll('2', '1');

      expect(result).toEqual({
        data: singleTeacher,
        total: 2,
        page: 2,
        limit: 1,
        totalPages: 2,
      });
      expect(prisma.teacher.findMany).toHaveBeenCalledWith({
        skip: 1,
        take: 1,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getStats', () => {
    it('should return stats for existing teacher', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeachers[0]);
      prisma.reservation.count
        .mockResolvedValueOnce(10)  // totalReservations
        .mockResolvedValueOnce(3)   // upcomingReservations
        .mockResolvedValueOnce(7);  // completedReservations

      const result = await controller.getStats('teacher-1');

      expect(result).toEqual({
        id: 'teacher-1',
        name: 'John Doe',
        totalReservations: 10,
        upcomingReservations: 3,
        completedReservations: 7,
      });
    });

    it('should throw NotFoundException when teacher does not exist', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        controller.getStats('unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
