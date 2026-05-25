import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { SchedulingRulesService } from './scheduling-rules.service';
import { CreateSchedulingRuleDto } from '../dto/create-scheduling-rule.dto';
import { UpdateSchedulingRuleDto } from '../dto/update-scheduling-rule.dto';
import { SchedulingRuleQueryDto } from '../dto/scheduling-rule-query.dto';
import { RuleChangedEvent } from '../events/rule-changed.event';

describe('SchedulingRulesService', () => {
  let service: SchedulingRulesService;
  let prisma: any;
  let eventBus: any;

  const mockRule = {
    id: 'rule-1',
    name: 'Horario laboral',
    naturalLanguage: 'Solo se puede en horario laboral',
    structuredRules: {
      conditions: [
        {
          field: 'time',
          operator: 'notIn',
          value: ['09:00-14:00', '16:00-20:00'],
        },
      ],
      logic: 'any',
    },
    ruleType: 'availability',
    action: 'block',
    priority: 10,
    enabled: true,
    appliesTo: null,
    createdById: 'user-1',
    deletedAt: null,
    createdAt: new Date('2026-05-22'),
    updatedAt: new Date('2026-05-22'),
  };

  beforeEach(async () => {
    prisma = {
      schedulingRule: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
    };

    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingRulesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    service = module.get<SchedulingRulesService>(SchedulingRulesService);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────
  //  Create
  // ────────────────────────────────────────────

  describe('create', () => {
    it('should create a rule and publish RuleChangedEvent', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Nueva regla',
        naturalLanguage: 'No clases antes de las 8',
        ruleType: 'availability',
        action: 'block',
        priority: 50,
        enabled: true,
      };

      const created = { ...mockRule, id: 'new-rule', name: dto.name };
      prisma.schedulingRule.create.mockResolvedValue(created);

      const result = await service.create(dto, 'user-1');

      expect(prisma.schedulingRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: dto.name,
          naturalLanguage: dto.naturalLanguage,
          ruleType: dto.ruleType,
          action: dto.action,
          priority: dto.priority,
          enabled: dto.enabled,
          createdById: 'user-1',
        }),
      });
      expect(result).toEqual(created);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(RuleChangedEvent),
      );
    });

    it('should use defaults for optional fields', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Regla mínima',
        naturalLanguage: 'Regla simple',
        ruleType: 'general',
      };

      prisma.schedulingRule.create.mockResolvedValue({
        ...mockRule,
        name: dto.name,
      });

      await service.create(dto, 'user-1');

      expect(prisma.schedulingRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'block',
          priority: 100,
          enabled: true,
        }),
      });
    });

    it('should pass structuredRules and appliesTo when provided', async () => {
      const dto: CreateSchedulingRuleDto = {
        name: 'Regla con JSON',
        naturalLanguage: 'Solo moto por la tarde',
        ruleType: 'vehicle',
        structuredRules: {
          conditions: [
            { field: 'vehicleType', operator: 'eq', value: 'moto-manual' },
          ],
          logic: 'all',
        },
        appliesTo: { licenseTypes: ['A2'] },
      };

      prisma.schedulingRule.create.mockResolvedValue(mockRule);

      await service.create(dto, 'user-1');

      expect(prisma.schedulingRule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          structuredRules: dto.structuredRules,
          appliesTo: dto.appliesTo,
        }),
      });
    });
  });

  // ────────────────────────────────────────────
  //  Find All (paginated)
  // ────────────────────────────────────────────

  describe('findAll', () => {
    it('should return paginated rules', async () => {
      const rules = [mockRule];
      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      prisma.schedulingRule.count.mockResolvedValue(1);

      const query: SchedulingRuleQueryDto = { page: 1, limit: 20 };
      const result = await service.findAll(query);

      expect(result).toEqual({
        data: rules,
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(prisma.schedulingRule.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 0,
        take: 20,
        orderBy: { priority: 'asc' },
      });
    });

    it('should filter by ruleType', async () => {
      prisma.schedulingRule.findMany.mockResolvedValue([]);
      prisma.schedulingRule.count.mockResolvedValue(0);

      await service.findAll({ ruleType: 'availability', page: 1, limit: 20 });

      expect(prisma.schedulingRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ ruleType: 'availability' }),
        }),
      );
    });

    it('should filter by enabled status', async () => {
      prisma.schedulingRule.findMany.mockResolvedValue([]);
      prisma.schedulingRule.count.mockResolvedValue(0);

      await service.findAll({ enabled: 'true', page: 1, limit: 20 });

      expect(prisma.schedulingRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ enabled: true }),
        }),
      );
    });

    it('should search by name', async () => {
      prisma.schedulingRule.findMany.mockResolvedValue([]);
      prisma.schedulingRule.count.mockResolvedValue(0);

      await service.findAll({ search: 'laboral', page: 1, limit: 20 });

      expect(prisma.schedulingRule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'laboral', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should calculate correct pagination', async () => {
      prisma.schedulingRule.findMany.mockResolvedValue([]);
      prisma.schedulingRule.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result).toEqual({
        data: [],
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });
      expect(prisma.schedulingRule.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        skip: 10,
        take: 10,
        orderBy: { priority: 'asc' },
      });
    });
  });

  // ────────────────────────────────────────────
  //  Find One
  // ────────────────────────────────────────────

  describe('findOne', () => {
    it('should return a rule by id', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(mockRule);

      const result = await service.findOne('rule-1');

      expect(result).toEqual(mockRule);
      expect(prisma.schedulingRule.findFirst).toHaveBeenCalledWith({
        where: { id: 'rule-1', deletedAt: null },
      });
    });

    it('should throw NotFoundException when rule does not exist', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when rule is soft-deleted', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(null);

      await expect(service.findOne('deleted-rule')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ────────────────────────────────────────────
  //  Update
  // ────────────────────────────────────────────

  describe('update', () => {
    it('should update a rule and publish RuleChangedEvent', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(mockRule);
      prisma.schedulingRule.update.mockResolvedValue({
        ...mockRule,
        name: 'Nombre actualizado',
      });

      const dto: UpdateSchedulingRuleDto = { name: 'Nombre actualizado' };
      const result = await service.update('rule-1', dto);

      expect(prisma.schedulingRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { name: 'Nombre actualizado' },
      });
      expect(result.name).toBe('Nombre actualizado');
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(RuleChangedEvent),
      );
    });

    it('should throw NotFoundException when updating non-existent rule', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', { name: 'Nuevo nombre' }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.schedulingRule.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('should only include provided fields in update data', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(mockRule);
      prisma.schedulingRule.update.mockResolvedValue(mockRule);

      await service.update('rule-1', { enabled: false });

      expect(prisma.schedulingRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { enabled: false },
      });
    });

    it('should update multiple fields at once', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(mockRule);
      prisma.schedulingRule.update.mockResolvedValue(mockRule);

      const dto: UpdateSchedulingRuleDto = {
        name: 'Nuevo nombre',
        priority: 5,
        action: 'warn',
      };

      await service.update('rule-1', dto);

      expect(prisma.schedulingRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: {
          name: 'Nuevo nombre',
          priority: 5,
          action: 'warn',
        },
      });
    });
  });

  // ────────────────────────────────────────────
  //  Remove (soft delete)
  // ────────────────────────────────────────────

  describe('remove', () => {
    it('should soft-delete a rule and publish RuleChangedEvent', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(mockRule);
      prisma.schedulingRule.update.mockResolvedValue({
        ...mockRule,
        deletedAt: new Date(),
      });

      await service.remove('rule-1');

      expect(prisma.schedulingRule.update).toHaveBeenCalledWith({
        where: { id: 'rule-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(RuleChangedEvent),
      );
    });

    it('should throw NotFoundException when removing non-existent rule', async () => {
      prisma.schedulingRule.findFirst.mockResolvedValue(null);

      await expect(service.remove('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.schedulingRule.update).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────
  //  Find All Active
  // ────────────────────────────────────────────

  describe('findAllActive', () => {
    it('should return only enabled and non-deleted rules', async () => {
      const rules = [mockRule];
      prisma.schedulingRule.findMany.mockResolvedValue(rules);

      const result = await service.findAllActive();

      expect(result).toEqual(rules);
      expect(prisma.schedulingRule.findMany).toHaveBeenCalledWith({
        where: { enabled: true, deletedAt: null },
        orderBy: { priority: 'asc' },
      });
    });

    it('should return empty array when no active rules exist', async () => {
      prisma.schedulingRule.findMany.mockResolvedValue([]);

      const result = await service.findAllActive();

      expect(result).toEqual([]);
    });
  });
});
