import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../common/services/prisma.service';
import { RuleEngineService, RuleContext } from './rule-engine.service';
import { SchedulingRulesService } from '../scheduling-rules/services/scheduling-rules.service';

// Helper to build a RuleContext with sensible defaults
function buildContext(overrides: Partial<RuleContext> = {}): RuleContext {
  return {
    teacherId: 'teacher-1',
    date: '2026-06-01',
    startTime: '10:00',
    duration: 45,
    vehicleType: 'coche-manual',
    doubleSession: false,
    ...overrides,
  };
}

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let prisma: any;
  let configService: any;

  const mockActiveRules = [
    {
      id: 'rule-1',
      name: 'Horario laboral',
      action: 'block',
      priority: 10,
      ruleType: 'availability',
      structuredRules: {
        conditions: [
          { field: 'time', operator: 'notIn', value: ['09:00-14:00', '16:00-20:00'] },
        ],
        logic: 'any',
      },
      appliesTo: null,
    },
    {
      id: 'rule-2',
      name: 'Incremento cuadrícula',
      action: 'warn',
      priority: 50,
      ruleType: 'duration',
      structuredRules: {
        conditions: [
          { field: 'student.remainingClasses', operator: 'lte', value: 3 },
          { field: 'duration', operator: 'lt', value: 90 },
        ],
        logic: 'all',
      },
      appliesTo: null,
    },
    {
      id: 'rule-3',
      name: 'Doble sesión moto',
      action: 'block',
      priority: 30,
      ruleType: 'vehicle',
      structuredRules: {
        conditions: [
          { field: 'vehicleType', operator: 'eq', value: 'moto-manual' },
          { field: 'duration', operator: 'gt', value: 60 },
        ],
        logic: 'all',
      },
      appliesTo: null,
    },
  ];

  beforeEach(async () => {
    prisma = {
      schedulingRule: {
        findMany: jest.fn().mockResolvedValue(mockActiveRules),
      },
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'RULES_ENGINE_ENABLED') return 'true';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: { pipe: jest.fn().mockReturnValue({ subscribe: jest.fn() }) } },
        { provide: ConfigService, useValue: configService },
        {
          provide: SchedulingRulesService,
          useValue: { findAllActive: jest.fn().mockResolvedValue([]) },
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────
  //  Cache & initialization
  // ────────────────────────────────────────────

  describe('cache behavior', () => {
    it('should load rules from database on first evaluation', async () => {
      const results = await service.evaluateTeacherRules('teacher-1', buildContext());
      expect(prisma.schedulingRule.findMany).toHaveBeenCalledTimes(1);
      expect(results).toBeDefined();
    });

    it('should NOT reload rules from database on second evaluation (cache hit)', async () => {
      await service.evaluateTeacherRules('teacher-1', buildContext());
      await service.evaluateTeacherRules('teacher-1', buildContext());

      // Only called once — second call hits cache
      expect(prisma.schedulingRule.findMany).toHaveBeenCalledTimes(1);
    });

    it('should reload rules after cache invalidation', async () => {
      await service.evaluateTeacherRules('teacher-1', buildContext());
      service.invalidateCache();
      await service.evaluateTeacherRules('teacher-1', buildContext());

      expect(prisma.schedulingRule.findMany).toHaveBeenCalledTimes(2);
    });

    it('should load empty rules when RULES_ENGINE_ENABLED is false', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'RULES_ENGINE_ENABLED') return 'false';
        return undefined;
      });

      // Reset internal state
      service.invalidateCache();
      const results = await service.evaluateTeacherRules('teacher-1', buildContext());

      expect(prisma.schedulingRule.findMany).not.toHaveBeenCalled();
      expect(results).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────
  //  Condition evaluation
  // ────────────────────────────────────────────

  describe('condition evaluation', () => {
    it('should evaluate eq operator correctly', async () => {
      // Only rule-3 should match: vehicleType === 'moto-manual'
      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        vehicleType: 'moto-manual',
        duration: 90,
      }));

      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-3');
      expect(results[0].action).toBe('block');
    });

    it('should evaluate notIn operator with time ranges', async () => {
      // 07:00 is outside 09:00-14:00 and 16:00-20:00 → rule-1 triggers
      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        startTime: '07:00',
      }));

      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-1');
      expect(results[0].action).toBe('block');
    });

    it('should NOT trigger time rule when within working hours', async () => {
      // 10:00 is inside 09:00-14:00 → rule-1 should NOT trigger
      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        startTime: '10:00',
      }));

      expect(results).toHaveLength(0);
    });

    it('should return empty when no rules match conditions', async () => {
      const results = await service.evaluateTeacherRules('teacher-1', buildContext());

      // Default context: teacher-1, 10:00, 45min, coche-manual, no double session
      // rule-1: time=10:00 is inside 09:00-14:00 → notIn returns false → skip
      // rule-2: remainingClasses not set → undefined → returns false → skip
      // rule-3: vehicleType=coche-manual ≠ moto-manual → skip
      expect(results).toHaveLength(0);
    });

    it('should evaluate lte operator for remaining classes', async () => {
      // rule-2: remainingClasses <= 3 AND duration < 90
      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        student: { remainingClasses: 2 },
        duration: 45,
      }));

      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-2');
      expect(results[0].action).toBe('warn');
    });

    it('should NOT trigger warn when remainingClasses > 3', async () => {
      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        student: { remainingClasses: 5 },
        duration: 45,
      }));

      // rule-2: remainingClasses=5 > 3 → condition fails → skip
      expect(results).toHaveLength(0);
    });
  });

  // ────────────────────────────────────────────
  //  Block vs Warn behavior
  // ────────────────────────────────────────────

  describe('block vs warn behavior', () => {
    it('should stop evaluation on first block rule', async () => {
      // 07:00 triggers rule-1 (block, priority 10)
      // Should NOT evaluate rule-2 (warn, priority 50) because block stops iteration
      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        startTime: '07:00',
        student: { remainingClasses: 2 },
        duration: 45,
      }));

      expect(results).toHaveLength(1);
      expect(results[0].action).toBe('block');
      expect(results[0].ruleId).toBe('rule-1');
    });

    it('should collect all warn rules when no block matches', async () => {
      // Two warn rules that can both match with the same context
      const rules = [
        { ...mockActiveRules[1] }, // rule-2: warn, remainingClasses <= 3 AND duration < 90
        {
          id: 'rule-4',
          name: 'Sin doble sesión sin permiso',
          action: 'warn',
          priority: 60,
          ruleType: 'overlap',
          structuredRules: {
            conditions: [
              { field: 'teacher.doubleSession', operator: 'eq', value: false },
              { field: 'duration', operator: 'lt', value: 90 },
            ],
            logic: 'all',
          },
          appliesTo: null,
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        student: { remainingClasses: 2 },
        duration: 45,
        doubleSession: false,
      }));

      expect(results).toHaveLength(2);
      expect(results[0].action).toBe('warn');
      expect(results[1].action).toBe('warn');
    });
  });

  // ────────────────────────────────────────────
  //  Applies-to filter
  // ────────────────────────────────────────────

  describe('appliesTo teacher filter', () => {
    it('should skip rules that do not apply to this teacher', async () => {
      const rules = [
        {
          ...mockActiveRules[0],
          appliesTo: { teachers: ['teacher-2', 'teacher-3'] },
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        startTime: '07:00',
      }));

      expect(results).toHaveLength(0);
    });

    it('should apply rule when teacher is in appliesTo list', async () => {
      const rules = [
        {
          ...mockActiveRules[0],
          appliesTo: { teachers: ['teacher-1', 'teacher-3'] },
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext({
        startTime: '07:00',
      }));

      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-1');
    });
  });

  // ────────────────────────────────────────────
  //  canCreateReservation
  // ────────────────────────────────────────────

  describe('canCreateReservation', () => {
    it('should return blocked=false when no rules match', async () => {
      const result = await service.canCreateReservation(buildContext());

      expect(result.blocked).toBe(false);
      expect(result.blockingRule).toBeUndefined();
      expect(result.warnings).toEqual([]);
    });

    it('should return blocked=true with blockingRule when block rule matches', async () => {
      const result = await service.canCreateReservation(buildContext({
        startTime: '07:00',
      }));

      expect(result.blocked).toBe(true);
      expect(result.blockingRule).toBeDefined();
      expect(result.blockingRule!.ruleId).toBe('rule-1');
      expect(result.blockingRule!.action).toBe('block');
    });

    it('should return warnings when only warn rules match', async () => {
      const result = await service.canCreateReservation(buildContext({
        student: { remainingClasses: 2 },
        duration: 45,
      }));

      expect(result.blocked).toBe(false);
      expect(result.blockingRule).toBeUndefined();
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].ruleId).toBe('rule-2');
    });
  });

  // ────────────────────────────────────────────
  //  Edge cases
  // ────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle rules with null structuredRules (skip)', async () => {
      const rules = [
        {
          id: 'rule-empty',
          name: 'Regla vacía',
          action: 'block',
          priority: 1,
          ruleType: 'general',
          structuredRules: null,
          appliesTo: null,
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext());
      expect(results).toHaveLength(0);
    });

    it('should handle empty conditions array (passes all)', async () => {
      const rules = [
        {
          id: 'rule-no-conditions',
          name: 'Siempre activa',
          action: 'block',
          priority: 1,
          ruleType: 'general',
          structuredRules: { conditions: [], logic: 'all' },
          appliesTo: null,
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext());
      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-no-conditions');
    });

    it('should handle unknown field gracefully (returns undefined → no match)', async () => {
      const rules = [
        {
          id: 'rule-unknown-field',
          name: 'Campo inválido',
          action: 'block',
          priority: 1,
          ruleType: 'general',
          structuredRules: {
            conditions: [{ field: 'nonexistent.field', operator: 'eq', value: 'x' }],
            logic: 'all',
          },
          appliesTo: null,
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext());
      expect(results).toHaveLength(0);
    });

    it('should evaluate dayOfWeek correctly', async () => {
      // 2026-06-01 is a Monday → getDay() returns 1
      const rules = [
        {
          id: 'rule-weekend',
          name: 'No sábados',
          action: 'block',
          priority: 1,
          ruleType: 'availability',
          structuredRules: {
            conditions: [{ field: 'dayOfWeek', operator: 'eq', value: 6 }],
            logic: 'all',
          },
          appliesTo: null,
        },
        {
          id: 'rule-weekday',
          name: 'Sí lunes',
          action: 'block',
          priority: 2,
          ruleType: 'availability',
          structuredRules: {
            conditions: [{ field: 'dayOfWeek', operator: 'eq', value: 1 }],
            logic: 'all',
          },
          appliesTo: null,
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext());
      // Rule for Saturday should NOT match (it's Monday)
      // Rule for Monday SHOULD match
      expect(results).toHaveLength(1);
      expect(results[0].ruleId).toBe('rule-weekday');
    });

    it('should respect priority order when multiple rules match', async () => {
      const rules = [
        {
          id: 'high-priority',
          name: 'Alta prioridad (warn)',
          action: 'warn',
          priority: 5,
          ruleType: 'general',
          structuredRules: {
            conditions: [{ field: 'duration', operator: 'eq', value: 45 }],
            logic: 'all',
          },
          appliesTo: null,
        },
        {
          id: 'low-priority',
          name: 'Baja prioridad (warn)',
          action: 'warn',
          priority: 100,
          ruleType: 'general',
          structuredRules: {
            conditions: [{ field: 'duration', operator: 'eq', value: 45 }],
            logic: 'all',
          },
          appliesTo: null,
        },
      ];

      prisma.schedulingRule.findMany.mockResolvedValue(rules);
      service.invalidateCache();

      const results = await service.evaluateTeacherRules('teacher-1', buildContext());
      expect(results).toHaveLength(2);
      expect(results[0].ruleId).toBe('high-priority');
      expect(results[1].ruleId).toBe('low-priority');
    });
  });
});
