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
  operator: 'eq' | 'neq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'notIn';
  value: unknown;
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
}

export interface RuleEvaluation {
  ruleId: string;
  ruleName: string;
  action: 'block' | 'warn';
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
}

@Injectable()
export class RuleEngineService implements OnModuleInit {
  private readonly logger = new Logger(RuleEngineService.name);

  /** All active rules, sorted by priority ASC */
  private cachedRules: CachedRule[] = [];

  /** When true, cachedRules will be reloaded on next evaluate call */
  private cacheInvalidated = true;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SchedulingRulesService))
    private readonly schedulingRulesService: SchedulingRulesService,
  ) {}

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

    this.logger.warn(`Unknown operator: ${String(operator)}`);
    return false;
  }

  private resolveFieldValue(field: string, context: RuleContext): unknown {
    switch (field) {
      case 'vehicleType':
        return context.vehicleType;

      case 'time':
        // Parse startTime "HH:mm" → total minutes for comparison
        return this.timeToMinutes(context.startTime);

      case 'date':
        return context.date; // ISO date string "2026-05-23"

      case 'dayOfWeek':
        return new Date(context.date).getDay(); // 0=Sunday, 6=Saturday

      case 'duration':
        return context.duration;

      case 'teacher.doubleSession':
        return context.doubleSession;

      case 'student.licenseType':
        return context.student?.licenseType;

      case 'student.remainingClasses':
        return context.student?.remainingClasses;

      default:
        this.logger.warn(`Unknown rule field: ${field}`);
        return undefined;
    }
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
