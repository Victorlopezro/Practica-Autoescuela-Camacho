import { Test, TestingModule } from '@nestjs/testing';
import { SchedulingRulesController } from './scheduling-rules.controller';
import { SchedulingRulesService } from './services/scheduling-rules.service';
import { ScheduleGenerationService } from './services/schedule-generation.service';
import { SchedulingAiService } from '../scheduling/scheduling-ai.service';
import { PrismaService } from '../../common/services/prisma.service';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import {
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
} from './dto';

describe('SchedulingRulesController', () => {
  let controller: SchedulingRulesController;
  let rulesService: any;
  let scheduleGenerationService: any;
  let aiService: any;
  let prisma: any;

  const mockUser: JwtPayload = {
    sub: 'user-1',
    username: 'admin',
    role: 'admin',
  };

  const mockGenerationRule = {
    id: 'rule-gen-1',
    name: 'Horario profesores',
    naturalLanguage: 'Luis López de 8:00 a 15:00 entre semana',
    category: 'generation',
    action: 'doubleBooking',
    ruleType: 'general',
    priority: 100,
    enabled: true,
    appliesTo: null,
    structuredRules: null,
    createdById: 'user-1',
    deletedAt: null,
    createdAt: new Date('2026-05-22'),
    updatedAt: new Date('2026-05-22'),
  };

  const mockEvalRule = {
    id: 'rule-eval-1',
    name: 'No clases finde',
    naturalLanguage: 'No clases los fines de semana',
    category: 'evaluation',
    action: 'block',
    ruleType: 'availability',
    priority: 10,
    enabled: true,
    appliesTo: null,
    structuredRules: { conditions: [], logic: 'AND' },
    createdById: 'user-1',
    deletedAt: null,
    createdAt: new Date('2026-05-22'),
    updatedAt: new Date('2026-05-22'),
  };

  const mockGenerationResult = {
    generatedRows: 5,
    skippedItems: 0,
    warnings: [],
  };

  beforeEach(async () => {
    rulesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findAllActive: jest.fn(),
    };

    scheduleGenerationService = {
      applyScheduleRule: jest.fn(),
      removeScheduleRule: jest.fn(),
    };

    aiService = {
      translateRule: jest.fn(),
      translateGenerationRule: jest.fn(),
    };

    prisma = {
      teacher: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SchedulingRulesController],
      providers: [
        { provide: SchedulingRulesService, useValue: rulesService },
        { provide: ScheduleGenerationService, useValue: scheduleGenerationService },
        { provide: SchedulingAiService, useValue: aiService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<SchedulingRulesController>(SchedulingRulesController);
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────
  //  POST / — create
  // ──────────────────────────────────────────────

  describe('POST create', () => {
    it('should create a generation rule and apply schedule generation', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Horario profesores',
        naturalLanguage: 'Luis López de 8:00 a 15:00 entre semana',
        category: 'generation',
      };

      rulesService.create.mockResolvedValue(mockGenerationRule);
      scheduleGenerationService.applyScheduleRule.mockResolvedValue(
        mockGenerationResult,
      );

      const result = await controller.create(dto, mockUser);

      expect(rulesService.create).toHaveBeenCalledWith(dto, mockUser.sub);
      expect(
        scheduleGenerationService.applyScheduleRule,
      ).toHaveBeenCalledWith({
        ruleId: mockGenerationRule.id,
        naturalLanguage: dto.naturalLanguage,
        scheduleData: undefined,
      });
      expect(result).toEqual({
        data: mockGenerationRule,
        generationResult: mockGenerationResult,
      });
    });

    it('should create a generation rule with scheduleData fallback', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Horario manual',
        naturalLanguage: 'Texto sin sentido para la IA',
        category: 'generation',
        scheduleData: [
          {
            teacher: 'Luis López',
            schedule: [
              { dayOfWeek: 1, startTime: '08:00', endTime: '15:00' },
            ],
          },
        ],
      };

      rulesService.create.mockResolvedValue(mockGenerationRule);
      scheduleGenerationService.applyScheduleRule.mockResolvedValue(
        mockGenerationResult,
      );

      await controller.create(dto, mockUser);

      expect(
        scheduleGenerationService.applyScheduleRule,
      ).toHaveBeenCalledWith({
        ruleId: mockGenerationRule.id,
        naturalLanguage: dto.naturalLanguage,
        scheduleData: dto.scheduleData,
      });
    });

    it('should set default action and ruleType for generation rules', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Horario sin defaults',
        naturalLanguage: 'Test',
        category: 'generation',
      };

      rulesService.create.mockResolvedValue(mockGenerationRule);
      scheduleGenerationService.applyScheduleRule.mockResolvedValue(
        mockGenerationResult,
      );

      await controller.create(dto, mockUser);

      expect(rulesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ruleType: 'general',
        }),
        mockUser.sub,
      );
    });

    it('should not apply schedule generation for evaluation rules', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Regla normal',
        naturalLanguage: 'No clases los sabados',
        ruleType: 'availability',
        action: 'block',
        category: 'evaluation',
      };

      aiService.translateRule.mockResolvedValue({
        success: true,
        data: {
          conditions: [{ field: 'dayOfWeek', operator: 'in', value: [0, 6] }],
          logic: 'OR' as const,
          onMatch: 'block' as const,
          confidence: 'high' as const,
        },
      });
      rulesService.create.mockResolvedValue(mockEvalRule);

      await controller.create(dto, mockUser);

      expect(rulesService.create).toHaveBeenCalled();
      expect(
        scheduleGenerationService.applyScheduleRule,
      ).not.toHaveBeenCalled();
    });

    it('should handle AI translation for evaluation rules with naturalLanguage', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Regla con NL',
        naturalLanguage: 'No clases los sabados',
        category: 'evaluation',
      };

      const aiResult = {
        success: true,
        data: {
          conditions: [{ field: 'dayOfWeek', operator: 'in', value: [0, 6] }],
          logic: 'OR' as const,
          onMatch: 'block' as const,
          confidence: 'high' as const,
        },
      };

      aiService.translateRule.mockResolvedValue(aiResult);
      rulesService.create.mockResolvedValue(mockEvalRule);

      await controller.create(dto, mockUser);

      expect(aiService.translateRule).toHaveBeenCalledWith(dto.naturalLanguage);
      expect(rulesService.create).toHaveBeenCalled();
      expect(
        scheduleGenerationService.applyScheduleRule,
      ).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────
  //  PATCH :id — update
  // ──────────────────────────────────────────────

  describe('PATCH update', () => {
    it('should re-apply generation when naturalLanguage changes on a generation rule', async () => {
      const updatedRule = {
        ...mockGenerationRule,
        naturalLanguage: 'Mario García de 10:00 a 14:00',
      };

      rulesService.findOne.mockResolvedValue(mockGenerationRule);
      rulesService.update.mockResolvedValue(updatedRule);
      scheduleGenerationService.applyScheduleRule.mockResolvedValue(
        mockGenerationResult,
      );

      const dto: UpdateSchedulingRuleDto = {
        naturalLanguage: 'Mario García de 10:00 a 14:00',
      };

      const result = await controller.update('rule-gen-1', dto);

      expect(rulesService.findOne).toHaveBeenCalledWith('rule-gen-1');
      expect(rulesService.update).toHaveBeenCalledWith('rule-gen-1', dto);
      expect(
        scheduleGenerationService.applyScheduleRule,
      ).toHaveBeenCalledWith({
        ruleId: 'rule-gen-1',
        naturalLanguage: 'Mario García de 10:00 a 14:00',
        scheduleData: undefined,
      });
      expect(result).toEqual({
        data: updatedRule,
        generationResult: mockGenerationResult,
      });
    });

    it('should re-apply generation when scheduleData changes on a generation rule', async () => {
      const dto: UpdateSchedulingRuleDto = {
        scheduleData: [
          {
            teacher: 'Luis López',
            schedule: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '14:00' },
            ],
          },
        ],
      };

      rulesService.findOne.mockResolvedValue(mockGenerationRule);
      rulesService.update.mockResolvedValue(mockGenerationRule);
      scheduleGenerationService.applyScheduleRule.mockResolvedValue(
        mockGenerationResult,
      );

      await controller.update('rule-gen-1', dto);

      expect(
        scheduleGenerationService.applyScheduleRule,
      ).toHaveBeenCalledWith({
        ruleId: 'rule-gen-1',
        naturalLanguage: mockGenerationRule.naturalLanguage,
        scheduleData: dto.scheduleData,
      });
    });

    it('should NOT re-apply generation when only name/priority/enabled change', async () => {
      const dto: UpdateSchedulingRuleDto = {
        name: 'Nombre nuevo',
        priority: 50,
      };

      rulesService.findOne.mockResolvedValue(mockGenerationRule);
      rulesService.update.mockResolvedValue({
        ...mockGenerationRule,
        name: 'Nombre nuevo',
        priority: 50,
      });

      const result = await controller.update('rule-gen-1', dto);

      expect(
        scheduleGenerationService.applyScheduleRule,
      ).not.toHaveBeenCalled();
      expect(result.generationResult).toBeUndefined();
    });

    it('should NOT re-apply for evaluation rules even when NL changes', async () => {
      const dto: UpdateSchedulingRuleDto = {
        naturalLanguage: 'Nuevo texto',
      };

      rulesService.findOne.mockResolvedValue(mockEvalRule);
      rulesService.update.mockResolvedValue({
        ...mockEvalRule,
        naturalLanguage: 'Nuevo texto',
      });

      const result = await controller.update('rule-eval-1', dto);

      expect(
        scheduleGenerationService.applyScheduleRule,
      ).not.toHaveBeenCalled();
      expect(result.generationResult).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────
  //  DELETE :id — remove
  // ──────────────────────────────────────────────

  describe('DELETE remove', () => {
    it('should clean up availability before deleting a generation rule', async () => {
      rulesService.findOne.mockResolvedValue(mockGenerationRule);
      scheduleGenerationService.removeScheduleRule.mockResolvedValue({
        deletedRows: 5,
      });
      rulesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('rule-gen-1');

      expect(rulesService.findOne).toHaveBeenCalledWith('rule-gen-1');
      expect(
        scheduleGenerationService.removeScheduleRule,
      ).toHaveBeenCalledWith('rule-gen-1');
      expect(rulesService.remove).toHaveBeenCalledWith('rule-gen-1');
      expect(result).toEqual({
        data: { deleted: true },
        generationRemoval: { deletedRows: 5 },
      });
    });

    it('should not call removeScheduleRule for evaluation rules', async () => {
      rulesService.findOne.mockResolvedValue(mockEvalRule);
      rulesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('rule-eval-1');

      expect(
        scheduleGenerationService.removeScheduleRule,
      ).not.toHaveBeenCalled();
      expect(rulesService.remove).toHaveBeenCalledWith('rule-eval-1');
      expect(result.generationRemoval).toBeUndefined();
    });

    it('should clean up even when there are no availability rows', async () => {
      rulesService.findOne.mockResolvedValue(mockGenerationRule);
      scheduleGenerationService.removeScheduleRule.mockResolvedValue({
        deletedRows: 0,
      });
      rulesService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('rule-gen-1');

      expect(
        scheduleGenerationService.removeScheduleRule,
      ).toHaveBeenCalled();
      expect(result).toEqual({
        data: { deleted: true },
        generationRemoval: { deletedRows: 0 },
      });
    });
  });
});
