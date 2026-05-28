import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';
import { SchedulingAiService } from './scheduling-ai.service';
import { BatchOverrideDto, CopyWeekDto } from './dto';

describe('SchedulingController', () => {
  let controller: SchedulingController;
  let scheduling: any;

  beforeEach(async () => {
    scheduling = {
      batchSetOverrides: jest.fn(),
      copyWeekOverrides: jest.fn(),
      getTeacherAvailability: jest.fn(),
      setAvailability: jest.fn(),
      removeAvailability: jest.fn(),
      setOverride: jest.fn(),
      removeOverride: jest.fn(),
      getAvailableSlotsInRange: jest.fn(),
      getAvailableSlots: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingController],
      providers: [
        { provide: SchedulingService, useValue: scheduling },
        {
          provide: SchedulingAiService,
          useValue: { validateSlot: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: { vehicleTypeConfig: { findMany: jest.fn() } },
        },
      ],
    }).compile();

    controller = module.get<SchedulingController>(SchedulingController);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────
  //  POST /teachers/:id/overrides/batch
  // ────────────────────────────────────────────

  describe('POST teachers/:teacherId/overrides/batch', () => {
    const teacherId = 'teacher-1';
    const dto: BatchOverrideDto = {
      overrides: [
        {
          date: '2026-06-01',
          isAvailable: true,
          startTime: '09:00',
          endTime: '14:00',
        },
        { date: '2026-06-02', isAvailable: false },
      ],
    };

    it('should delegate to scheduling.batchSetOverrides with correct params', async () => {
      scheduling.batchSetOverrides.mockResolvedValue([
        { id: 'ov-1' },
        { id: 'ov-2' },
      ]);

      const result = await controller.batchSetOverrides(teacherId, dto);

      expect(scheduling.batchSetOverrides).toHaveBeenCalledWith(
        teacherId,
        dto.overrides,
      );
      expect(result).toEqual({ success: true, count: 2 });
    });

    it('should pass empty overrides array through to service', async () => {
      const emptyDto: BatchOverrideDto = { overrides: [] };
      scheduling.batchSetOverrides.mockResolvedValue([]);

      await controller.batchSetOverrides(teacherId, emptyDto);

      expect(scheduling.batchSetOverrides).toHaveBeenCalledWith(teacherId, []);
    });

    it('should propagate service errors', async () => {
      scheduling.batchSetOverrides.mockRejectedValue(
        new Error('Transaction failed'),
      );

      await expect(
        controller.batchSetOverrides(teacherId, dto),
      ).rejects.toThrow('Transaction failed');
    });
  });

  // ────────────────────────────────────────────
  //  POST /teachers/:id/overrides/copy-week
  // ────────────────────────────────────────────

  describe('POST teachers/:teacherId/overrides/copy-week', () => {
    const teacherId = 'teacher-1';
    const dto: CopyWeekDto = {
      sourceDate: '2026-06-01',
      targetDate: '2026-06-08',
      overrideExisting: false,
    };

    it('should delegate to scheduling.copyWeekOverrides with correct params', async () => {
      scheduling.copyWeekOverrides.mockResolvedValue({ copied: 2 });

      const result = await controller.copyWeekOverrides(teacherId, dto);

      expect(scheduling.copyWeekOverrides).toHaveBeenCalledWith(
        teacherId,
        '2026-06-01',
        '2026-06-08',
        false,
      );
      expect(result).toEqual({ success: true, copied: 2 });
    });

    it('should work without overrideExisting (undefined → false)', async () => {
      const minimalDto: CopyWeekDto = {
        sourceDate: '2026-06-01',
        targetDate: '2026-06-08',
      };
      scheduling.copyWeekOverrides.mockResolvedValue({ copied: 0 });

      await controller.copyWeekOverrides(teacherId, minimalDto);

      expect(scheduling.copyWeekOverrides).toHaveBeenCalledWith(
        teacherId,
        '2026-06-01',
        '2026-06-08',
        undefined,
      );
    });

    it('should return 0 copied when no overrides to copy', async () => {
      scheduling.copyWeekOverrides.mockResolvedValue({ copied: 0 });

      const result = await controller.copyWeekOverrides(teacherId, dto);

      expect(result).toEqual({ success: true, copied: 0 });
    });

    it('should propagate service errors', async () => {
      scheduling.copyWeekOverrides.mockRejectedValue(
        new NotFoundException('Teacher not found'),
      );

      await expect(
        controller.copyWeekOverrides(teacherId, dto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
