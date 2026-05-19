import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { ReservationsController } from './reservations.controller';
import { CreateReservationCommand } from './commands/create-reservation.command';
import { ConfirmReservationCommand } from './commands/confirm-reservation.command';
import { CancelReservationCommand } from './commands/cancel-reservation.command';
import { CompleteReservationCommand } from './commands/complete-reservation.command';

describe('ReservationsController', () => {
  let controller: ReservationsController;
  let prisma: any;
  let commandBus: any;

  const mockUser = { sub: 'admin-1', username: 'admin', role: 'admin' };

  const mockReservation = {
    id: 'res-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleType: 'coche-manual',
    startTime: new Date('2026-06-01T10:00:00.000Z'),
    duration: 45,
    status: 'pending',
    cancelledAt: null,
    refundAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      reservation: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    commandBus = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReservationsController],
      providers: [
        { provide: CommandBus, useValue: commandBus },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<ReservationsController>(ReservationsController);
    jest.clearAllMocks();
  });

  describe('POST /reservations', () => {
    it('should delegate to CreateReservationCommand', async () => {
      commandBus.execute.mockResolvedValue(mockReservation);

      const result = await controller.create(
        {
          studentId: 'student-1',
          teacherId: 'teacher-1',
          vehicleType: 'coche-manual',
          startTime: '2026-06-01T10:00:00.000Z',
          duration: 45,
        },
        mockUser,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateReservationCommand),
      );
      expect(result).toEqual(mockReservation);
    });
  });

  describe('GET /reservations (paginated)', () => {
    it('should return paginated reservations with defaults', async () => {
      const reservations = [mockReservation];
      prisma.reservation.findMany.mockResolvedValue(reservations);
      prisma.reservation.count.mockResolvedValue(1);

      const result = await controller.findAll();

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply status and teacherId filters', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.reservation.count.mockResolvedValue(0);

      await controller.findAll('1', '20', 'pending', 'teacher-1');

      expect(prisma.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'pending', teacherId: 'teacher-1' },
        }),
      );
    });
  });

  describe('GET /reservations/:id', () => {
    it('should return a single reservation when found', async () => {
      prisma.reservation.findUnique.mockResolvedValue(mockReservation);

      const result = await controller.findOne('res-1');

      expect(result).toEqual(mockReservation);
    });

    it('should throw NotFoundException when reservation not found', async () => {
      prisma.reservation.findUnique.mockResolvedValue(null);

      await expect(
        controller.findOne('unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /reservations/:id/confirm', () => {
    it('should delegate to ConfirmReservationCommand', async () => {
      commandBus.execute.mockResolvedValue({ ...mockReservation, status: 'confirmed' });

      const result = await controller.confirm('res-1', mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(ConfirmReservationCommand),
      );
      expect(result.status).toBe('confirmed');
    });
  });

  describe('DELETE /reservations/:id', () => {
    it('should delegate to CancelReservationCommand', async () => {
      commandBus.execute.mockResolvedValue({
        ...mockReservation,
        status: 'cancelled',
        cancelledAt: new Date(),
        refundAmount: 0,
      });

      const result = await controller.remove('res-1', mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CancelReservationCommand),
      );
      expect(result.status).toBe('cancelled');
    });
  });

  describe('PATCH /reservations/:id/complete', () => {
    it('should delegate to CompleteReservationCommand', async () => {
      commandBus.execute.mockResolvedValue({ ...mockReservation, status: 'completed' });

      const result = await controller.complete('res-1', mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CompleteReservationCommand),
      );
      expect(result.status).toBe('completed');
    });
  });

  describe('GET /reservations/availability', () => {
    it('should return free slots', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await controller.getAvailability('2026-06-01', 'teacher-1', '45');

      expect(result.date).toBe('2026-06-01');
      expect(result.teacherId).toBe('teacher-1');
      expect(result.slotDuration).toBe(45);
      expect(result.slots.length).toBeGreaterThan(0);
    });

    it('should handle 90-minute duration parameter', async () => {
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await controller.getAvailability('2026-06-01', 'teacher-1', '90');

      expect(result.slotDuration).toBe(90);
    });
  });
});
