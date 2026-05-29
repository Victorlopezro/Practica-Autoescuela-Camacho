import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import { SchedulingAiService } from '../../scheduling/scheduling-ai.service';
import {
  ScheduleGenerationService,
  ApplyScheduleRuleInput,
} from './schedule-generation.service';

describe('ScheduleGenerationService', () => {
  let service: ScheduleGenerationService;
  let prisma: any;
  let aiService: any;

  const mockTeacherLuis = { id: 'teacher-luis', name: 'Luis López' };
  const mockTeacherMario = { id: 'teacher-mario', name: 'Mario García' };

  beforeEach(async () => {
    prisma = {
      teacher: {
        findFirst: jest.fn(),
      },
      teacherAvailability: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      $transaction: jest.fn(),
    };

    aiService = {
      translateGenerationRule: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleGenerationService,
        { provide: PrismaService, useValue: prisma },
        { provide: SchedulingAiService, useValue: aiService },
      ],
    }).compile();

    service = module.get<ScheduleGenerationService>(ScheduleGenerationService);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  //  applyScheduleRule
  // ──────────────────────────────────────────────

  describe('applyScheduleRule', () => {
    const defaultInput: ApplyScheduleRuleInput = {
      ruleId: 'rule-1',
      naturalLanguage: 'Luis López de 8:00 a 15:00 entre semana',
    };

    it('should create availability rows from AI translation', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [
          {
            teacher: 'Luis López',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
        ],
      });

      prisma.teacher.findFirst.mockResolvedValue(mockTeacherLuis);
      prisma.$transaction.mockImplementation(async (cb: Function) =>
        cb(prisma),
      );

      const result = await service.applyScheduleRule(defaultInput);

      expect(result.generatedRows).toBe(5); // 5 weekdays
      expect(result.skippedItems).toBe(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.aiFailed).toBeUndefined();
      expect(aiService.translateGenerationRule).toHaveBeenCalledWith(
        defaultInput.naturalLanguage,
      );
      expect(prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
        where: { ruleId: 'rule-1' },
      });
      expect(prisma.teacherAvailability.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            teacherId: 'teacher-luis',
            ruleId: 'rule-1',
            dayOfWeek: 1,
            startTime: '08:00',
            endTime: '15:00',
            track: null,
            isAvailable: true,
          }),
        ]),
      });
    });

    it('should handle AI response with track and specific days', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [
          {
            teacher: 'Mario García',
            daysOfWeek: [1, 3, 5],
            startTime: '10:00',
            endTime: '14:00',
            track: 'pista',
          },
        ],
      });

      prisma.teacher.findFirst.mockResolvedValue(mockTeacherMario);
      prisma.$transaction.mockImplementation(async (cb: Function) =>
        cb(prisma),
      );

      const result = await service.applyScheduleRule({
        ruleId: 'rule-2',
        naturalLanguage: 'Mario lunes/miércoles/viernes 10-14 pista',
      });

      expect(result.generatedRows).toBe(3); // Mon, Wed, Fri
      expect(result.skippedItems).toBe(0);
      expect(prisma.teacherAvailability.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            teacherId: 'teacher-mario',
            track: 'pista',
            dayOfWeek: 1,
          }),
          expect.objectContaining({
            teacherId: 'teacher-mario',
            track: 'pista',
            dayOfWeek: 3,
          }),
          expect.objectContaining({
            teacherId: 'teacher-mario',
            track: 'pista',
            dayOfWeek: 5,
          }),
        ]),
      });
    });

    it('should fall back to scheduleData when AI fails and scheduleData provided', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [],
        error: 'Servicio de IA no disponible',
      });

      prisma.teacher.findFirst.mockResolvedValue(mockTeacherLuis);
      prisma.$transaction.mockImplementation(async (cb: Function) =>
        cb(prisma),
      );

      const result = await service.applyScheduleRule({
        ruleId: 'rule-3',
        naturalLanguage: 'Luis López de 8:00 a 15:00',
        scheduleData: [
          {
            teacher: 'Luis López',
            schedule: [
              { dayOfWeek: 1, startTime: '08:00', endTime: '15:00' },
              { dayOfWeek: 2, startTime: '08:00', endTime: '15:00' },
            ],
            track: 'pista',
          },
        ],
      });

      expect(result.generatedRows).toBe(2);
      expect(result.aiFailed).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('AI translation issue');
    });

    it('should return warning when AI fails and no scheduleData fallback', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [],
        error: 'No se pudo interpretar el texto',
      });

      const result = await service.applyScheduleRule({
        ruleId: 'rule-4',
        naturalLanguage: 'Texto ambiguo sin sentido',
      });

      expect(result.generatedRows).toBe(0);
      expect(result.skippedItems).toBe(0);
      expect(result.aiFailed).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('AI translation failed');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle AI network error with scheduleData fallback', async () => {
      aiService.translateGenerationRule.mockRejectedValue(
        new Error('Network timeout'),
      );

      prisma.teacher.findFirst.mockResolvedValue(mockTeacherLuis);
      prisma.$transaction.mockImplementation(async (cb: Function) =>
        cb(prisma),
      );

      const result = await service.applyScheduleRule({
        ruleId: 'rule-5',
        naturalLanguage: 'Luis López de 8:00 a 15:00',
        scheduleData: [
          {
            teacher: 'Luis López',
            schedule: [
              { dayOfWeek: 1, startTime: '08:00', endTime: '15:00' },
            ],
          },
        ],
      });

      expect(result.generatedRows).toBe(1);
      expect(result.aiFailed).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('AI translation unavailable');
    });

    it('should return warning when AI throws and no fallback', async () => {
      aiService.translateGenerationRule.mockRejectedValue(
        new Error('Network timeout'),
      );

      const result = await service.applyScheduleRule({
        ruleId: 'rule-6',
        naturalLanguage: 'Cualquier cosa',
      });

      expect(result.generatedRows).toBe(0);
      expect(result.aiFailed).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should create rows from scheduleData only (no AI)', async () => {
      prisma.teacher.findFirst.mockResolvedValue(mockTeacherLuis);
      prisma.$transaction.mockImplementation(async (cb: Function) =>
        cb(prisma),
      );

      const result = await service.applyScheduleRule({
        ruleId: 'rule-7',
        scheduleData: [
          {
            teacher: 'Luis López',
            schedule: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '14:00' },
              { dayOfWeek: 3, startTime: '09:00', endTime: '14:00' },
            ],
            track: 'circulacion',
          },
        ],
      });

      expect(result.generatedRows).toBe(2);
      expect(result.skippedItems).toBe(0);
      expect(aiService.translateGenerationRule).not.toHaveBeenCalled();
      expect(prisma.teacherAvailability.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            teacherId: 'teacher-luis',
            track: 'circulacion',
            dayOfWeek: 1,
          }),
          expect.objectContaining({
            teacherId: 'teacher-luis',
            track: 'circulacion',
            dayOfWeek: 3,
          }),
        ]),
      });
    });

    it('should skip items when teacher is not found', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [
          {
            teacher: 'NonExistent Teacher',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
        ],
      });

      // Teacher not found
      prisma.teacher.findFirst.mockResolvedValue(null);

      const result = await service.applyScheduleRule(defaultInput);

      expect(result.generatedRows).toBe(0);
      expect(result.skippedItems).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('not found');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should skip only the missing teacher when some exist and some do not', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [
          {
            teacher: 'Luis López',
            daysOfWeek: [1],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
          {
            teacher: 'Unknown Teacher',
            daysOfWeek: [2],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
        ],
      });

      prisma.teacher.findFirst
        .mockResolvedValueOnce(mockTeacherLuis) // Luis found
        .mockResolvedValueOnce(null); // Unknown not found

      prisma.$transaction.mockImplementation(async (cb: Function) =>
        cb(prisma),
      );

      const result = await service.applyScheduleRule(defaultInput);

      expect(result.generatedRows).toBe(1); // Only Luis row
      expect(result.skippedItems).toBe(1);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Unknown Teacher');
    });

    it('should handle missing both naturalLanguage and scheduleData', async () => {
      const result = await service.applyScheduleRule({
        ruleId: 'rule-8',
      });

      expect(result.generatedRows).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain(
        'No naturalLanguage or scheduleData',
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should do nothing when no rows to create after resolving', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [],
        error: undefined,
      });

      const result = await service.applyScheduleRule(defaultInput);

      expect(result.generatedRows).toBe(0);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle unique constraint violation (P2002) gracefully', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [
          {
            teacher: 'Luis López',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
        ],
      });

      prisma.teacher.findFirst.mockResolvedValue(mockTeacherLuis);

      // Simulate a P2002 error inside the transaction
      prisma.$transaction.mockImplementation(async (cb: Function) => {
        const p2002Error = new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed on teacher_availability',
          { code: 'P2002', clientVersion: '7.8.0', meta: { target: ['teacherId', 'dayOfWeek', 'track'] } },
        );
        // Simulate the tx object that would throw
        const mockTx = {
          teacherAvailability: {
            deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
            createMany: jest.fn().mockRejectedValue(p2002Error),
          },
        };
        await cb(mockTx);
      });

      const result = await service.applyScheduleRule(defaultInput);

      expect(result.generatedRows).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Conflicto de horarios');
    });

    it('should re-throw non-P2002 errors from transaction', async () => {
      aiService.translateGenerationRule.mockResolvedValue({
        schedule: [
          {
            teacher: 'Luis López',
            daysOfWeek: [1],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
        ],
      });

      prisma.teacher.findFirst.mockResolvedValue(mockTeacherLuis);

      const genericError = new Error('Database connection lost');
      prisma.$transaction.mockRejectedValue(genericError);

      await expect(service.applyScheduleRule(defaultInput)).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  // ──────────────────────────────────────────────
  //  removeScheduleRule
  // ──────────────────────────────────────────────

  describe('removeScheduleRule', () => {
    it('should delete all availability rows with matching ruleId', async () => {
      prisma.teacherAvailability.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.removeScheduleRule('rule-1');

      expect(prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
        where: { ruleId: 'rule-1' },
      });
      expect(result.deletedRows).toBe(3);
    });

    it('should return 0 when no rows match the ruleId', async () => {
      prisma.teacherAvailability.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.removeScheduleRule('nonexistent-rule');

      expect(result.deletedRows).toBe(0);
    });

    it('should only delete rows for the given ruleId', async () => {
      prisma.teacherAvailability.deleteMany.mockResolvedValue({ count: 5 });

      await service.removeScheduleRule('rule-specific');

      expect(prisma.teacherAvailability.deleteMany).toHaveBeenCalledWith({
        where: { ruleId: 'rule-specific' },
      });
    });
  });
});
