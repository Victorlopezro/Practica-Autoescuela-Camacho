import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { filter } from 'rxjs/operators';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingRulesService } from '../scheduling-rules/services/scheduling-rules.service';
import { RuleChangedEvent } from '../scheduling-rules/events/rule-changed.event';

export interface RuleCondition {
  field: string;
  operator:
    | 'eq'
    | 'neq'
    | 'lt'
    | 'gt'
    | 'lte'
    | 'gte'
    | 'in'
    | 'notIn'
    | 'contains';
  value: unknown;
}

// ──────────────────────────────────────────────
//  Field Registry — single source of truth
// ──────────────────────────────────────────────

export interface FieldDefinition {
  name: string;
  description: string;
  type: 'string' | 'number' | 'string[]';
  /** Enum values (if applicable) */
  values?: string[];
  /** Example conditions for the AI prompt */
  examples: string[];
}

export const FIELD_REGISTRY: FieldDefinition[] = [
  {
    name: 'vehicleType',
    description: 'Tipo de vehículo de la reserva',
    type: 'string',
    values: ['coche-manual', 'coche-automatico', 'moto-pista', 'moto-circulacion'],
    examples: ['eq "coche-manual"', 'neq "moto-pista"', 'in ["coche-manual", "coche-automatico"]'],
  },
  {
    name: 'time',
    description: 'Hora de inicio de la reserva (formato HH:mm)',
    type: 'string',
    examples: [
      'gte "14:00" (desde las 14:00)',
      'lte "09:00" (hasta las 09:00)',
      'in ["09:00-14:00", "16:00-20:00"] (rangos horarios como franjas)',
      'notIn ["09:00-14:00"] (fuera de ese rango)',
    ],
  },
  {
    name: 'dayOfWeek',
    description: 'Día de la semana (0=Domingo, 1=Lunes... 6=Sábado)',
    type: 'number',
    examples: ['eq 6 (sábados)', 'in [0, 6] (findes)', 'neq 0 (excepto domingos)'],
  },
  {
    name: 'date',
    description: 'Fecha específica en formato ISO YYYY-MM-DD',
    type: 'string',
    examples: [
      'eq "2026-12-25" (Navidad)',
      'gte "2026-08-01" (desde agosto)',
      'lte "2026-08-31" (hasta agosto)',
    ],
  },
  {
    name: 'duration',
    description: 'Duración de la clase en minutos',
    type: 'number',
    examples: ['gt 60 (más de 1 hora)', 'lte 90 (90 min o menos)'],
  },
  {
    name: 'student.licenseType',
    description: 'Tipo de carnet del alumno',
    type: 'string',
    values: ['AM', 'A1', 'A2', 'B', 'B-automatico'],
    examples: ['eq "A2"', 'neq "B"', 'in ["A1", "A2"]'],
  },
  {
    name: 'student.remainingClasses',
    description: 'Clases restantes del alumno',
    type: 'number',
    examples: ['lt 3 (menos de 3 clases)', 'gte 5 (5 o más clases)'],
  },
  {
    name: 'teacher.doubleSession',
    description: 'Si el profesor ya tiene una sesión doble programada',
    type: 'string',
    values: ['true', 'false'],
    examples: ['eq true (cuando ya tiene doble sesión)', 'eq false (cuando no)'],
  },
  {
    name: 'overlappingLicenseTypes',
    description: 'Tipos de carnet de los alumnos en reservas solapadas',
    type: 'string[]',
    examples: ['contains "A1" (si hay solapamiento con A1)'],
  },
  {
    name: 'overlappingVehicleTypes',
    description: 'Tipos de vehículo de las reservas solapadas',
    type: 'string[]',
    examples: ['contains "moto-pista" (si hay solapamiento con motos)'],
  },
  {
    name: 'overlappingCount',
    description: 'Número de reservas solapadas existentes',
    type: 'number',
    examples: ['gte 1 (hay al menos 1 solapamiento)', 'gt 3 (más de 3 solapamientos)'],
  },
  {
    name: 'isDeadlinePassed',
    description: 'Si ya pasó la hora límite para cancelar/clases (día anterior a las 18:00)',
    type: 'string',
    values: ['true', 'false'],
    examples: ['eq true (cuando ya pasó el plazo)'],
  },
];

/**
 * Generate the "Campos permitidos" section for the AI prompt.
 */
export function generateFieldPromptSection(): string {
  return FIELD_REGISTRY.map((f) => {
    const values = f.values ? ` Valores: ${f.values.join(', ')}.` : '';
    const examples = f.examples.map((e) => `  ✅ { "field": "${f.name}", "operator": ..., "value": ... } — ej: ${e}`).join('\n');
    return `- ${f.name}: ${f.description}. Tipo: ${f.type}.${values}\n${examples}`;
  }).join('\n\n');
}

export interface StructuredRuleData {
  conditions: RuleCondition[];
  logic?: 'all' | 'any';
}

export interface RuleContext {
  teacherId: string;
  date: string;
  startTime: string;
  duration: number;
  vehicleType: string;
  student?: {
    id?: string;
    licenseType?: string;
    remainingClasses?: number;
  };
  doubleSession: boolean;
  /** License types of students with overlapping reservations (populated when overlap detected) */
  overlappingLicenseTypes?: string[];
  /** Vehicle types of overlapping reservations */
  overlappingVehicleTypes?: string[];
  /** Number of existing overlapping reservations */
  overlappingCount?: number;
}

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  action: 'block' | 'warn' | 'allow';
  reason: string;
}

export interface CanCreateResult {
  blocked: boolean;
  blockingRule?: RuleEvaluation;
  warnings: RuleEvaluation[];
}

interface CachedRule {
  id: string;
  name: string;
  action: string;
  priority: number;
  ruleType: string;
  structuredRules: StructuredRuleData | null;
  appliesTo: Record<string, unknown> | null;
  category: string; // "evaluation" | "generation"
}

/** A generation rule result — same shape as CachedRule but returned by getGenerationRules */
export interface GenerationRule extends CachedRule {}

@Injectable()
export class RuleEngineService implements OnModuleInit {
  private readonly logger = new Logger(RuleEngineService.name);

  /** All active rules, sorted by priority ASC */
  private cachedRules: CachedRule[] = [];

  /** When true, cachedRules will be reloaded on next evaluate call */
  private cacheInvalidated = true;

  /** Resolver map built from FIELD_REGISTRY — maps field name → resolver fn */
  private readonly fieldResolvers: Map<string, (ctx: RuleContext) => unknown>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SchedulingRulesService))
    private readonly schedulingRulesService: SchedulingRulesService,
  ) {
    const resolvers: Array<[string, (ctx: RuleContext) => unknown]> = [
      ['vehicleType', (ctx) => ctx.vehicleType],
      ['time', (ctx) => this.timeToMinutes(ctx.startTime)],
      ['date', (ctx) => ctx.date],
      ['dayOfWeek', (ctx) => new Date(ctx.date).getDay()],
      ['duration', (ctx) => ctx.duration],
      ['teacher.doubleSession', (ctx) => ctx.doubleSession],
      ['student.licenseType', (ctx) => ctx.student?.licenseType],
      ['student.remainingClasses', (ctx) => ctx.student?.remainingClasses],
      ['overlappingLicenseTypes', (ctx) => ctx.overlappingLicenseTypes],
      ['overlappingVehicleTypes', (ctx) => ctx.overlappingVehicleTypes],
      ['overlappingCount', (ctx) => ctx.overlappingCount],
      ['isDeadlinePassed', (ctx) => this.resolveIsDeadlinePassed(ctx)],
    ];
    this.fieldResolvers = new Map(resolvers);
  }

  onModuleInit(): void {
    // Subscribe to RuleChangedEvent to invalidate cache
    this.eventBus
      .pipe(filter((event) => event instanceof RuleChangedEvent))
      .subscribe((event: RuleChangedEvent) => {
        this.cacheInvalidated = true;
        this.logger.debug(
          `Rule cache invalidated: ${event.changeType} ${event.ruleId}`,
        );
      });
  }

  /**
   * Public method to invalidate the cache (used by event handler).
   */
  invalidateCache(): void {
    this.cacheInvalidated = true;
  }

  // ──────────────────────────────────────────────
  //  Private helpers
  // ──────────────────────────────────────────────

  private async ensureRulesLoaded(): Promise<void> {
    if (!this.cacheInvalidated) return;

    if (this.configService.get<string>('RULES_ENGINE_ENABLED') !== 'true') {
      this.cachedRules = [];
      this.cacheInvalidated = false;
      return;
    }

    const rules = await this.prisma.schedulingRule.findMany({
      where: { enabled: true, deletedAt: null },
      orderBy: { priority: 'asc' },
    });

    this.cachedRules = rules.map((r) => ({
      id: r.id,
      name: r.name,
      action: r.action,
      priority: r.priority,
      ruleType: r.ruleType,
      structuredRules: r.structuredRules as StructuredRuleData | null,
      appliesTo: r.appliesTo as Record<string, unknown> | null,
      category: r.category,
    }));

    this.cacheInvalidated = false;
    this.logger.debug(`Loaded ${this.cachedRules.length} active rules`);
  }

  // ──────────────────────────────────────────────
  //  Public API
  // ──────────────────────────────────────────────

  /**
   * Evaluate all applicable rules for a given teacher and context.
   * Returns an array of RuleEvaluation results.
   *
   * - Rules are evaluated in priority order (ascending).
   * - Block rules STOP further evaluation (first block wins).
   * - Warn rules CONTINUE — all warnings are collected.
   */
  async evaluateTeacherRules(
    teacherId: string,
    context: RuleContext,
  ): Promise<RuleEvaluation[]> {
    await this.ensureRulesLoaded();

    const results: RuleEvaluation[] = [];

    for (const rule of this.cachedRules) {
      // Check if this rule applies to this teacher
      if (!this.doesRuleApplyToTeacher(rule, teacherId)) continue;

      // Evaluate conditions
      if (!rule.structuredRules) continue;
      const conditionsMatch = this.evaluateConditions(
        rule.structuredRules,
        context,
      );
      if (!conditionsMatch) continue;

      const evaluation: RuleEvaluation = {
        ruleId: rule.id,
        ruleName: rule.name,
        action: rule.action as 'block' | 'warn',
        reason: `Bloqueado por regla: ${rule.name}`,
      };

      if (rule.action === 'allow') {
        // Allow rule matched — slot is explicitly allowed, skip all further rules
        return [];
      }

      if (rule.action === 'block') {
        // First blocking rule wins — stop evaluation
        results.push(evaluation);
        return results;
      }

      // Warn — collect and continue
      results.push(evaluation);
    }

    return results;
  }

  /**
   * High-level check for CreateReservationHandler.
   * Returns whether a reservation is blocked, by which rule, and any warnings.
   */
  async canCreateReservation(context: RuleContext): Promise<CanCreateResult> {
    const evaluations = await this.evaluateTeacherRules(
      context.teacherId,
      context,
    );

    const blockingRule = evaluations.find((r) => r.action === 'block');
    const warnings = evaluations.filter((r) => r.action === 'warn');

    return {
      blocked: !!blockingRule,
      blockingRule,
      warnings,
    };
  }

  /**
   * Get all active generation rules that apply to a specific teacher.
   * Generation rules affect HOW slots are generated (e.g. double booking).
   */
  async getGenerationRules(teacherId: string): Promise<CachedRule[]> {
    await this.ensureRulesLoaded();
    return this.cachedRules.filter(
      (rule) =>
        rule.category === 'generation' &&
        rule.action === 'doubleBooking' &&
        this.doesRuleApplyToTeacher(rule, teacherId),
    );
  }

  // ──────────────────────────────────────────────
  //  Applies-to checking
  // ──────────────────────────────────────────────

  private doesRuleApplyToTeacher(rule: CachedRule, teacherId: string): boolean {
    if (!rule.appliesTo) return true; // applies to all teachers

    // If appliesTo has a teachers array, check membership
    const teachers = rule.appliesTo['teachers'] as string[] | undefined;
    if (Array.isArray(teachers) && teachers.length > 0) {
      return teachers.includes(teacherId);
    }

    // No teacher restriction → applies to all
    return true;
  }

  // ──────────────────────────────────────────────
  //  Condition evaluation
  // ──────────────────────────────────────────────

  private evaluateConditions(
    rule: StructuredRuleData,
    context: RuleContext,
  ): boolean {
    const { conditions, logic = 'all' } = rule;

    if (!conditions || conditions.length === 0) return true;

    if (logic === 'any') {
      return conditions.some((c) => this.evaluateCondition(c, context));
    }

    // Default: 'all'
    return conditions.every((c) => this.evaluateCondition(c, context));
  }

  private evaluateCondition(
    condition: RuleCondition,
    context: RuleContext,
  ): boolean {
    const { field, operator } = condition;
    const resolvedValue = this.resolveFieldValue(field, context);
    const rawValue = condition.value;

    if (resolvedValue === undefined) return false;

    // Numeric operators need numeric values
    if (
      operator === 'lt' ||
      operator === 'gt' ||
      operator === 'lte' ||
      operator === 'gte'
    ) {
      const resolvedNum = resolvedValue as number;
      const condNum = rawValue as number;
      switch (operator) {
        case 'lt':
          return resolvedNum < condNum;
        case 'gt':
          return resolvedNum > condNum;
        case 'lte':
          return resolvedNum <= condNum;
        case 'gte':
          return resolvedNum >= condNum;
      }
    }

    // Equality operators
    if (operator === 'eq') {
      return resolvedValue === rawValue;
    }
    if (operator === 'neq') {
      return resolvedValue !== rawValue;
    }

    // Array membership operators
    if (operator === 'in') {
      return this.evaluateIn(resolvedValue, rawValue);
    }
    if (operator === 'notIn') {
      return !this.evaluateIn(resolvedValue, rawValue);
    }

    // Array contains operator: resolvedValue is array, check if value is in it
    if (operator === 'contains') {
      if (!Array.isArray(resolvedValue)) return false;
      return resolvedValue.includes(rawValue);
    }

    this.logger.warn(`Unknown operator: ${String(operator)}`);
    return false;
  }

  private resolveFieldValue(field: string, context: RuleContext): unknown {
    const resolver = this.fieldResolvers.get(field);
    if (!resolver) {
      this.logger.warn(`Unknown rule field: ${field}`);
      return undefined;
    }
    return resolver(context);
  }

  private resolveIsDeadlinePassed(context: RuleContext): boolean {
    // Deadline = slot date - 1 day at BOOKING_DEADLINE_HOUR (default 18)
    // The server runs in UTC; adjust BOOKING_DEADLINE_HOUR for your timezone.
    // Example: Spain CEST (UTC+2) → 16 = 18:00 Spain time
    const [h, m] = context.startTime.split(':').map(Number);
    const slotDate = new Date(context.date + 'T00:00:00.000Z');
    slotDate.setHours(0, h * 60 + m, 0, 0);
    const deadline = new Date(slotDate);
    deadline.setDate(deadline.getDate() - 1);
    const cutoffHour =
      Number(this.configService.get<number>('BOOKING_DEADLINE_HOUR')) || 18;
    deadline.setHours(cutoffHour, 0, 0, 0);
    return new Date() > deadline;
  }

  private evaluateIn(resolvedValue: unknown, value: unknown): boolean {
    if (!Array.isArray(value)) return resolvedValue === value;

    // Check if values look like time ranges ("HH:MM-HH:MM")
    if (
      typeof value[0] === 'string' &&
      value[0].includes('-') &&
      typeof resolvedValue === 'number'
    ) {
      // Time range check — value elements are "09:00-14:00" format
      return (value as string[]).some((range) => {
        const [start, end] = range.split('-');
        if (!start || !end) return false;
        const startMin = this.timeToMinutes(start);
        const endMin = this.timeToMinutes(end);
        return resolvedValue >= startMin && resolvedValue < endMin;
      });
    }

    // Standard array membership
    return value.includes(resolvedValue);
  }

  // ──────────────────────────────────────────────
  //  Utilities
  // ──────────────────────────────────────────────

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
