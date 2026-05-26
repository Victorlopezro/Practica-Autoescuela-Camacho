export const RULE_TYPES = ['availability', 'overlap', 'duration', 'vehicle', 'general'] as const;
export type RuleType = (typeof RULE_TYPES)[number];

export const RULE_ACTIONS = ['allow', 'block', 'warn', 'doubleBooking'] as const;
export type RuleAction = (typeof RULE_ACTIONS)[number];

export const RULE_CATEGORIES = ['evaluation', 'generation'] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];

export const GENERATION_ACTIONS = ['doubleBooking'] as const;
export type GenerationAction = (typeof GENERATION_ACTIONS)[number];

export interface SchedulingRuleDto {
  id: string;
  name: string;
  naturalLanguage: string;
  structuredRules: Record<string, unknown> | null;
  ruleType: RuleType;
  action: RuleAction;
  priority: number;
  enabled: boolean;
  appliesTo: Record<string, unknown> | null;
  createdById: string;
  category: RuleCategory;
  createdAt: string;
  updatedAt: string;
}

export interface AppliesTo {
  /** Teacher IDs that this rule applies to (empty = all teachers) */
  teachers?: string[];
  /** License types this rule applies to (empty = all licenses) */
  licenseTypes?: string[];
  /** Vehicle types this rule applies to (empty = all vehicles) */
  vehicleTypes?: string[];
}

export interface CreateSchedulingRuleDto {
  name: string;
  naturalLanguage: string;
  ruleType?: RuleType;
  action?: RuleAction;
  priority?: number;
  enabled?: boolean;
  appliesTo?: AppliesTo;
  category?: RuleCategory;
}

export interface UpdateSchedulingRuleDto {
  name?: string;
  ruleType?: RuleType;
  action?: RuleAction;
  priority?: number;
  enabled?: boolean;
  appliesTo?: AppliesTo;
  category?: RuleCategory;
}

export interface SchedulingRuleQueryDto {
  page?: number;
  limit?: number;
  ruleType?: string;
  enabled?: string;
  search?: string;
}

export interface PaginatedRulesDto {
  data: SchedulingRuleDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ISchedulingRuleService {
  findAll(query: SchedulingRuleQueryDto): Promise<PaginatedRulesDto>;
  findOne(id: string): Promise<SchedulingRuleDto>;
  create(dto: CreateSchedulingRuleDto): Promise<SchedulingRuleDto>;
  update(id: string, dto: UpdateSchedulingRuleDto): Promise<SchedulingRuleDto>;
  remove(id: string): Promise<void>;
  translate(id: string): Promise<SchedulingRuleDto>;
  toggle(id: string, enabled: boolean): Promise<SchedulingRuleDto>;
}
