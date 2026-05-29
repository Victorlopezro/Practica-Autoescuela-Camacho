'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { Modal } from '@/components/shared/Modal';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import { LICENSE_TYPES } from '@/lib/constants';
import type {
  SchedulingRuleDto,
  UpdateSchedulingRuleDto,
  PaginatedRulesDto,
  RuleType,
  RuleAction,
  RuleCategory,
  AppliesTo,
} from '@/services/interfaces';
import {
  RULE_CATEGORIES,
} from '@/services/interfaces';

/* ─── Helpers ─────────────────────────────────────────────────── */

const RULE_TYPE_LABELS: Record<string, string> = {
  availability: 'Disponibilidad',
  overlap: 'Solapamiento',
  duration: 'Duración',
  vehicle: 'Vehículo',
  general: 'General',
};

const RULE_TYPE_COLORS: Record<string, string> = {
  availability: 'bg-error-container text-error',
  overlap: 'bg-warning-container text-warning',
  duration: 'bg-info-container text-info',
  vehicle: 'bg-tertiary-container text-tertiary',
  general: 'bg-surface-container-high text-on-surface-variant',
};

const VEHICLE_TYPES = [
  { value: 'coche-manual', label: 'Coche Manual' },
  { value: 'coche-automatico', label: 'Coche Automático' },
  { value: 'moto-pista', label: 'Moto (Pista)' },
  { value: 'moto-circulacion', label: 'Moto (Circulación)' },
] as const;

const ruleTypeBadge = (type: string) => RULE_TYPE_COLORS[type] ?? 'bg-surface-container-high text-on-surface-variant';
const ruleTypeLabel = (type: string) => RULE_TYPE_LABELS[type] ?? type;

const actionLabel = (action: string) =>
  action === 'block' ? 'Bloquear' : action === 'warn' ? 'Advertir' : 'Permitir';

const SELECTOR_LABELS: Record<string, string> = {
  teachers: 'Profesores',
  licenseTypes: 'Tipos de licencia',
  vehicleTypes: 'Tipos de vehículo',
};

/** Human-readable summary of appliesTo for the rule card */
function appliesToSummary(a: Record<string, unknown> | null, teacherNames: Map<string, string>): string | null {
  if (!a) return null;
  const parts: string[] = [];
  const teachers = a.teachers as string[] | undefined;
  const licenseTypes = a.licenseTypes as string[] | undefined;
  const vehicleTypes = a.vehicleTypes as string[] | undefined;
  if (teachers && teachers.length > 0) {
    const names = teachers.map((id) => teacherNames.get(id) ?? id).join(', ');
    parts.push(`Profesores: ${names}`);
  }
  if (licenseTypes && licenseTypes.length > 0) {
    parts.push(`Licencias: ${licenseTypes.join(', ')}`);
  }
  if (vehicleTypes && vehicleTypes.length > 0) {
    parts.push(`Vehículos: ${vehicleTypes.join(', ')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/* ─── Shared appliesTo widget ──────────────────────────────────── */

function AppliesToSection({
  value,
  onChange,
  teachers,
}: {
  value: AppliesTo | undefined;
  onChange: (a: AppliesTo | undefined) => void;
  teachers: Array<{ id: string; name: string }>;
}) {
  const selectedTeachers = value?.teachers ?? [];
  const selectedLicenses = value?.licenseTypes ?? [];
  const selectedVehicles = value?.vehicleTypes ?? [];

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const build = (partial: Partial<AppliesTo>): AppliesTo | undefined => {
    const merged = {
      teachers: selectedTeachers,
      licenseTypes: selectedLicenses,
      vehicleTypes: selectedVehicles,
      ...partial,
    };
    // If all empty → undefined (applies to everyone)
    if (
      merged.teachers.length === 0 &&
      merged.licenseTypes.length === 0 &&
      merged.vehicleTypes.length === 0
    ) {
      return undefined;
    }
    // Remove empty arrays
    const result: AppliesTo = {};
    if (merged.teachers.length > 0) result.teachers = merged.teachers;
    if (merged.licenseTypes.length > 0) result.licenseTypes = merged.licenseTypes;
    if (merged.vehicleTypes.length > 0) result.vehicleTypes = merged.vehicleTypes;
    return result;
  };

  return (
    <fieldset className="space-y-4 border border-outline-variant/30 rounded-xl p-4">
      <legend className="text-sm font-medium text-on-surface px-1">
        Ámbito de aplicación
      </legend>
      <p className="text-xs text-on-surface-variant -mt-2">
        Si no seleccionas nada, la regla aplica a todos.
      </p>

      {/* Teachers */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-2">
          {SELECTOR_LABELS.teachers}
        </label>
        <div className="max-h-40 overflow-y-auto space-y-1.5">
          {teachers.length === 0 && (
            <p className="text-xs text-on-surface-variant/60 italic">Cargando profesores…</p>
          )}
          {teachers.map((t) => (
            <label
              key={t.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-surface-container-low rounded px-1 py-0.5"
            >
              <input
                type="checkbox"
                checked={selectedTeachers.includes(t.id)}
                onChange={() =>
                  onChange(build({ teachers: toggleArray(selectedTeachers, t.id) }))
                }
                className="rounded border-outline-variant accent-primary"
              />
              <span className="text-sm text-on-surface">{t.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* License types */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-2">
          {SELECTOR_LABELS.licenseTypes}
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(LICENSE_TYPES).map(([key, lt]) => (
            <label
              key={key}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-surface-container-low rounded px-2 py-1"
            >
              <input
                type="checkbox"
                checked={selectedLicenses.includes(key)}
                onChange={() =>
                  onChange(build({ licenseTypes: toggleArray(selectedLicenses, key) }))
                }
                className="rounded border-outline-variant accent-primary"
              />
              <span className="text-xs text-on-surface">{lt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Vehicle types */}
      <div>
        <label className="block text-xs font-medium text-on-surface-variant mb-2">
          {SELECTOR_LABELS.vehicleTypes}
        </label>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_TYPES.map((vt) => (
            <label
              key={vt.value}
              className="flex items-center gap-1.5 cursor-pointer hover:bg-surface-container-low rounded px-2 py-1"
            >
              <input
                type="checkbox"
                checked={selectedVehicles.includes(vt.value)}
                onChange={() =>
                  onChange(build({ vehicleTypes: toggleArray(selectedVehicles, vt.value) }))
                }
                className="rounded border-outline-variant accent-primary"
              />
              <span className="text-xs text-on-surface">{vt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

/* ─── Page ─────────────────────────────────────────────────────── */

export default function AdminSchedulingRules() {
  const { data, isLoading, error, refresh } = useData(
    () => services.schedulingRule.findAll({ page: 1, limit: 100 }),
    [],
  );

  const { data: teachersData } = useData(
    () => services.teacher.list(),
    [],
  );

  const teachers = useMemo(() => teachersData ?? [], [teachersData]);

  /* Modals state */
  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<SchedulingRuleDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  /* ── Create form state ── */
  const [createForm, setCreateForm] = useState<{
    name: string;
    naturalLanguage: string;
    priority: number;
    category: RuleCategory;
    action?: RuleAction;
    ruleType?: RuleType;
  }>({
    name: '',
    naturalLanguage: '',
    priority: 100,
    category: 'evaluation',
  });

  /* ── Edit form state ── */
  const [editForm, setEditForm] = useState<UpdateSchedulingRuleDto>({});

  /* ── Handlers ── */

  const resetCreateForm = useCallback(() => {
    setCreateForm({ name: '', naturalLanguage: '', priority: 100, category: 'evaluation' });
    setCreateOpen(false);
  }, []);

  const openEdit = useCallback((rule: SchedulingRuleDto) => {
    const appliesTo = rule.appliesTo as AppliesTo | null;
    setEditForm({
      name: rule.name,
      ruleType: rule.ruleType,
      action: rule.action,
      priority: rule.priority,
      enabled: rule.enabled,
      appliesTo: appliesTo ?? undefined,
      category: rule.category,
    });
    setEditRule(rule);
  }, []);

  const closeEdit = useCallback(() => {
    setEditForm({});
    setEditRule(null);
  }, []);

  const handleCreate = useCallback(async () => {
    await services.schedulingRule.create(createForm);
    resetCreateForm();
    refresh();
  }, [createForm, resetCreateForm, refresh]);

  const handleEdit = useCallback(async () => {
    if (!editRule) return;
    await services.schedulingRule.update(editRule.id, editForm);
    closeEdit();
    refresh();
  }, [editRule, editForm, closeEdit, refresh]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await services.schedulingRule.remove(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  }, [deleteTarget, refresh]);

  const handleToggle = useCallback(
    async (rule: SchedulingRuleDto) => {
      await services.schedulingRule.toggle(rule.id, !rule.enabled);
      refresh();
    },
    [refresh],
  );

  const handleTranslate = useCallback(
    async (id: string) => {
      setTranslatingId(id);
      try {
        await services.schedulingRule.translate(id);
        refresh();
      } finally {
        setTranslatingId(null);
      }
    },
    [refresh],
  );

  /* ── Derived data ── */
  const rules = useMemo(() => (data ? data.data : []), [data]);

  const teacherNameMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, t.name])),
    [teachers],
  );

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {() => (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-on-surface">Gestión de Reglas de Calendario</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Define reglas que el motor de scheduling evaluará automáticamente.
              </p>
            </div>
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 min-h-[44px] shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Nueva Regla
            </button>
          </div>

          {/* Info banner */}
          <div className="bg-tertiary-container/30 border border-tertiary-container rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">info</span>
            <p className="text-sm text-on-surface-variant">
              Las reglas se crean en lenguaje natural y la IA detecta automáticamente el tipo, la acción, los profesores y vehículos involucrados.
              Una vez creadas, el motor de scheduling las evalúa en tiempo real al generar horarios.
            </p>
          </div>

          {/* Empty state */}
          {rules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40">rule</span>
              <p className="text-on-surface-variant text-sm">No hay reglas de calendario. Crea la primera.</p>
            </div>
          )}

          {/* Rules list */}
          {rules.length > 0 && (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} accent>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Left: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-on-surface truncate">{rule.name}</p>
                        <span className={`text-label-caps px-2 py-0.5 rounded-full text-[11px] ${ruleTypeBadge(rule.ruleType)}`}>
                          {ruleTypeLabel(rule.ruleType)}
                        </span>
                        <span className={`text-label-caps px-2 py-0.5 rounded-full text-[11px] ${rule.action === 'block' ? 'bg-error-container/50 text-error' : rule.action === 'allow' ? 'bg-success-container/50 text-success' : rule.action === 'doubleBooking' ? 'bg-info-container/50 text-info' : 'bg-warning-container/50 text-warning'}`}>
                          {rule.action === 'doubleBooking' ? 'Doble Sesión' : actionLabel(rule.action)}
                        </span>
                        <span className={`text-label-caps px-2 py-0.5 rounded-full text-[11px] ${rule.category === 'generation' ? 'bg-info-container/50 text-info' : 'bg-surface-container-high text-on-surface-variant'}`}>
                          {rule.category === 'generation' ? 'Generación' : 'Evaluación'}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{rule.naturalLanguage}</p>
                      <div className="flex items-center gap-3 mt-2 text-label-caps text-on-surface-variant">
                        <span>Prioridad: {rule.priority}</span>
                        {rule.structuredRules && rule.category !== 'generation' && (
                          <span className="flex items-center gap-1 text-tertiary">
                            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            Traducida
                          </span>
                        )}
                      </div>
                      {appliesToSummary(rule.appliesTo, teacherNameMap) && (
                        <p className="text-label-caps text-tertiary mt-1 truncate">
                          {appliesToSummary(rule.appliesTo, teacherNameMap)}
                        </p>
                      )}
                    </div>

                    {/* Right: toggle + actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* Toggle */}
                      <button
                        onClick={() => handleToggle(rule)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          rule.enabled ? 'bg-primary' : 'bg-surface-container-high'
                        }`}
                        aria-label={rule.enabled ? 'Deshabilitar regla' : 'Habilitar regla'}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            rule.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Translate AI — only for evaluation rules */}
                      {rule.category !== 'generation' && (
                        <button
                          onClick={() => handleTranslate(rule.id)}
                          disabled={
                            translatingId === rule.id ||
                            !!rule.structuredRules ||
                            !rule.naturalLanguage
                          }
                          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed text-tertiary"
                          aria-label="Traducir con IA"
                          title="Traducir con IA"
                        >
                          {translatingId === rule.id ? (
                            <span className="material-symbols-outlined text-[20px] animate-spin">sync</span>
                          ) : (
                            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                          )}
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => openEdit(rule)}
                        className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant"
                        aria-label="Editar"
                      >
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteTarget({ id: rule.id, name: rule.name })}
                        className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-error"
                        aria-label="Eliminar"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ── Create Modal ── */}
          <Modal open={createOpen} onClose={resetCreateForm} title="Nueva Regla">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreate();
              }}
              className="space-y-4"
            >
              {/* Category selector */}
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Categoría</label>
                <div className="flex gap-2">
                  {RULE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setCreateForm((f) => ({
                          ...f,
                          category: cat,
                          action: cat === 'generation' ? 'doubleBooking' : undefined,
                          ruleType: cat === 'generation' ? undefined : f.ruleType,
                        }))
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border min-h-[44px] cursor-pointer transition-colors ${
                        createForm.category === cat
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'
                      }`}
                    >
                      {cat === 'evaluation' ? 'Evaluación' : 'Generación'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  {createForm.category === 'generation'
                    ? 'Las reglas de generación definen cómo se crean los slots de horario base del profesor. El texto en lenguaje natural se traduce automáticamente mediante IA para generar la disponibilidad.'
                    : 'Las reglas de evaluación definen qué slots se bloquean, permiten o advierten.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Horario laboral"
                />
              </div>

              {createForm.category === 'evaluation' && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">
                    Lenguaje natural <span className="text-error">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={createForm.naturalLanguage}
                    onChange={(e) => setCreateForm((f) => ({ ...f, naturalLanguage: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Ej: Juan Pérez no da clases de coche automático los viernes"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    La IA detectará automáticamente el tipo de regla, la acción, los profesores y vehículos involucrados al guardar.
                  </p>
                </div>
              )}

              {createForm.category === 'generation' && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">
                    Lenguaje natural
                  </label>
                  <textarea
                    rows={2}
                    value={createForm.naturalLanguage}
                    onChange={(e) => setCreateForm((f) => ({ ...f, naturalLanguage: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Ej: Generar doble sesión automática para Juan Pérez"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">
                    El texto se usará para generar automáticamente los horarios del profesor mediante IA.
                  </p>
                </div>
              )}

              {createForm.category === 'generation' && (
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Acción</label>
                  <select
                    value={createForm.action ?? 'doubleBooking'}
                    onChange={(e) => setCreateForm((f) => ({ ...f, action: e.target.value as RuleAction }))}
                    className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="doubleBooking">Doble sesión</option>
                  </select>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Las reglas de generación solo soportan la acción de doble sesión.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Prioridad</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.priority}
                  onChange={(e) => setCreateForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-on-surface-variant mt-1">A menor número, mayor prioridad.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetCreateForm}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white min-h-[44px]"
                >
                  Crear regla
                </button>
              </div>
            </form>
          </Modal>

          {/* ── Edit Modal ── */}
          <Modal open={!!editRule} onClose={closeEdit} title="Editar Regla">
            {editRule && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEdit();
                }}
                className="space-y-4"
              >
                {/* Category badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-on-surface-variant">Categoría:</span>
                  <span className={`text-label-caps px-2 py-0.5 rounded-full text-[11px] ${
                    editRule.category === 'generation'
                      ? 'bg-info-container/50 text-info'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>
                    {editRule.category === 'generation' ? 'Generación' : 'Evaluación'}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Nombre</label>
                  <input
                    type="text"
                    value={editForm.name ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Lenguaje natural</label>
                  <textarea
                    rows={3}
                    readOnly
                    value={editRule.naturalLanguage}
                    className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm bg-surface-container-low text-on-surface-variant resize-none cursor-not-allowed"
                  />
                  <p className="text-xs text-on-surface-variant mt-1">El lenguaje natural no se puede modificar después de crear la regla.</p>
                </div>

                {editRule.category !== 'generation' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1">Tipo de regla</label>
                      <select
                        value={editForm.ruleType ?? editRule.ruleType}
                        onChange={(e) => setEditForm((f) => ({ ...f, ruleType: e.target.value as RuleType }))}
                        className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="availability">Disponibilidad</option>
                        <option value="overlap">Solapamiento</option>
                        <option value="duration">Duración</option>
                        <option value="vehicle">Vehículo</option>
                        <option value="general">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1">Acción</label>
                      <select
                        value={editForm.action ?? editRule.action}
                        onChange={(e) => setEditForm((f) => ({ ...f, action: e.target.value as RuleAction }))}
                        className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="block">Bloquear</option>
                        <option value="warn">Advertir</option>
                        <option value="allow">Permitir</option>
                      </select>
                    </div>
                  </div>
                )}

                {editRule.category === 'generation' && (
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1">Acción</label>
                    <select
                      value={editForm.action ?? editRule.action}
                      onChange={(e) => setEditForm((f) => ({ ...f, action: e.target.value as RuleAction }))}
                      className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="doubleBooking">Doble sesión</option>
                    </select>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Las reglas de generación solo soportan la acción de doble sesión.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Prioridad</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.priority ?? editRule.priority}
                    onChange={(e) => setEditForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-outline-variant/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {editForm.appliesTo && (
                  <AppliesToSection
                    value={editForm.appliesTo}
                    onChange={(a) => setEditForm((f) => ({ ...f, appliesTo: a }))}
                    teachers={teachers}
                  />
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low min-h-[44px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white min-h-[44px]"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            )}
          </Modal>

          {/* ── Delete confirmation ── */}
          <Modal
            open={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            title="Eliminar Regla"
          >
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                ¿Estás seguro de que deseas eliminar la regla{' '}
                <span className="font-medium text-on-surface">{deleteTarget?.name}</span>?
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container-low min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-error text-white min-h-[44px]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </DataView>
  );
}
