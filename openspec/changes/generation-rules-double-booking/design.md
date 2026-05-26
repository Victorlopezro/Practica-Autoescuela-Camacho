# Design: Generation Rules — Double Booking

## Technical Approach

Agregar un campo `category` (`evaluation` | `generation`) a `SchedulingRule` para separar reglas de evaluación (existentes) de reglas de generación (nuevas). El motor de reglas se extiende con `getGenerationRules()`, y el scheduling service consulta ese método para determinar la duración efectiva de slots en lugar del booleano `teacher.doubleSession`. La UI de reglas muestra campos condicionales según la categoría. Seed data migra teachers con `doubleSession = true` a reglas `generation`.

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Usar `action` string existente vs. nuevo enum `generationAction` | `action` es String, acepta cualquier valor; nuevo enum es más restrictivo pero requiere migración | Usar `action` existente (String), crear const `GENERATION_ACTIONS` solo en frontend |
| Cargar todas las categorías en una cache vs. cache separada | Una cache: misma query, filtro en memoria. Cache separada: más queries, posibilidad de inconsistency | Misma cache — `getGenerationRules()` filtra en memoria sobre `cachedRules` |
| `category` editable en edición vs. read-only tras creación | Editable es más flexible pero puede causar confusiones. Read-only simplifica UI | Read-only — se muestra como badge informativo |
| Seed como parte de `seed.ts` vs. script separado | Separado: se ejecuta on-demand, no rompe seed existente. En seed.ts: se ejecuta siempre | Script separado `seed-generation-rules.ts` para no contaminar seed existente |

## Data Flow

```
Admin UI → POST /scheduling/rules (category: "generation")
  → SchedulingRulesController.create()
    (salta AI translation si category=generation)
    → SchedulingRulesService.create() → Prisma INSERT

Slot generation (getAvailableSlots / getAvailableSlotsInRange):
  → load teacher + vehicleTypeConfig
  → ruleEngine.getGenerationRules(teacherId)
    → ensureRulesLoaded() (carga batch TODAS las rules activas)
    → filter(category === 'generation' && appliesTo teacher)
  → if has rule with action 'doubleBooking'
    → effectiveDuration = baseSlotDuration * 2
  → else fallback a teacher.doubleSession
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/prisma/schema.prisma` | Modify | +`category String @default("evaluation")` en SchedulingRule |
| `backend/prisma/migrations/*add_rule_category` | Create | Migración automática prisma migrate |
| `backend/prisma/seed-generation-rules.ts` | Create | Script para migrar `doubleSession=true` a reglas generation |
| `backend/src/modules/scheduling/rule-engine.service.ts` | Modify | +`category` en `CachedRule`, +`getGenerationRules()` |
| `backend/src/modules/scheduling/scheduling.service.ts` | Modify | `getAvailableSlots*()` consultan generation rules para effectiveDuration |
| `backend/src/modules/scheduling-rules/dto/create-scheduling-rule.dto.ts` | Modify | +`RULE_CATEGORIES`, +`category` field |
| `backend/src/modules/scheduling-rules/dto/update-scheduling-rule.dto.ts` | Modify | +`category` field |
| `backend/src/modules/scheduling-rules/services/scheduling-rules.service.ts` | Modify | Pasar `category` en create/update |
| `backend/src/modules/scheduling-rules/scheduling-rules.controller.ts` | Modify | Saltar AI translation si `category=generation` |
| `frontend/src/services/interfaces/scheduling-rule.service.ts` | Modify | +`RULE_CATEGORIES`, +`GENERATION_ACTIONS`, +`category` en DTOs |
| `frontend/src/app/admin/scheduling/rules/page.tsx` | Modify | Selector categoría, UI condicional, badge en cards |

## Interfaces / Contracts

### CachedRule (rule-engine.service.ts)
```typescript
interface CachedRule {
  id: string;
  name: string;
  action: string;
  priority: number;
  ruleType: string;
  category: string;            // ← NUEVO
  structuredRules: StructuredRuleData | null;
  appliesTo: Record<string, unknown> | null;
}
```

### getGenerationRules (rule-engine.service.ts)
```typescript
async getGenerationRules(teacherId: string): Promise<CachedRule[]> {
  await this.ensureRulesLoaded();
  return this.cachedRules.filter(
    (r) => r.category === 'generation'
      && r.enabled                    // ya filtrado en ensureRulesLoaded
      && this.doesRuleApplyToTeacher(r, teacherId)
  );
}
```

### Frontend types (scheduling-rule.service.ts)
```typescript
export const RULE_CATEGORIES = ['evaluation', 'generation'] as const;
export type RuleCategory = (typeof RULE_CATEGORIES)[number];
export const GENERATION_ACTIONS = ['doubleBooking'] as const;
export type GenerationAction = (typeof GENERATION_ACTIONS)[number];

// SchedulingRuleDto: + category: RuleCategory
// CreateSchedulingRuleDto: + category?: RuleCategory
// UpdateSchedulingRuleDto: + category?: RuleCategory
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `getGenerationRules` filtra correctamente | Mock `cachedRules` con mezcla evaluation/generation, verificar filtro |
| Unit | `getGenerationRules` vacío sin rules | Mock sin generation rules → array vacío |
| Unit | `getAvailableSlots*` duración con generation rule vs. fallback | Mock `ruleEngine.getGenerationRules()` retorna/no retorna doubleBooking |
| Integration | Create rule con `category=generation` salta AI | Llamar endpoint con category, verificar que no invoca translateRule |
| E2E | UI condicional generation/evaluation | Verificar que selector categoría oculta/muestra campos |

## Migration / Rollout

No migration de datos automática. El seed script `seed-generation-rules.ts` se ejecuta manualmente para migrar teachers con `doubleSession = true`.

Rollback: revertir cambios en scheduling service → usar `teacher.doubleSession` nuevamente. Dejar columna `category` (no rompe nada). Borrar reglas generation creadas.

## Open Questions

- [ ] `naturalLanguage` debería ser `@IsOptional()` en `CreateSchedulingRuleDto` cuando se soporten reglas generation creadas manualmente sin texto?
- [ ] El frontend debería poder crear reglas generation sin `naturalLanguage`? (Actual: required en textarea)
