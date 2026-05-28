'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/layouts/Card';
import { ScheduleBlockEditor } from '@/components/scheduling/ScheduleBlockEditor';
import type { BlockData } from '@/components/scheduling/ScheduleBlockEditor';
import type { TeacherAvailabilityDto, OverrideDto, BatchOverrideEntry } from '@/services/interfaces';
import {
  formatDate,
  getFirstOfMonth,
  buildDayGrid,
  DAY_LABELS_SHORT,
} from '@/lib/calendar-utils';
import type { DayState } from '@/lib/calendar-utils';

/* ─── Types ──────────────────────────────────────────────────── */

export interface CalendarGridProps {
  teacherId: string;
  availability: TeacherAvailabilityDto | null;
  loading?: boolean;
  saving?: boolean;
  error?: string;
  successMsg?: string;
  onToggleDay: (date: string) => Promise<void>;
  /** @deprecated Use (date: string, block: BlockData) => void signature */
  onSaveBlock: (date: string, block: BlockData) => Promise<void>;
  /** @deprecated Use (date: string, block: BlockData) => void signature */
  onRemoveBlock: (date: string, block: BlockData) => Promise<void>;
  onDismissFeedback?: () => void;
  /** Optional admin-only label shown in the detail panel header */
  teacherName?: string;
  /** Called when user clicks "Guardar Todo" — receives all dates with unsaved blocks */
  onBatchSave?: (blocksByDate: Record<string, BlockData[]>) => Promise<void>;
}

/* ─── Local ID generator ──────────────────────────────────────── */

let _localSeq = 0;
function localId(): string {
  return `local-${Date.now()}-${++_localSeq}`;
}

/* ─── Component ──────────────────────────────────────────────── */

export function CalendarGrid({
  teacherId,
  availability,
  loading = false,
  saving = false,
  error,
  successMsg,
  onToggleDay,
  onSaveBlock,
  onRemoveBlock,
  onDismissFeedback,
  teacherName,
  onBatchSave,
}: CalendarGridProps) {
  const today = new Date();
  const [monthStart, setMonthStart] = useState(() =>
    formatDate(getFirstOfMonth(today)),
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [unsavedBlocks, setUnsavedBlocks] = useState<Record<string, BlockData[]>>({});
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  /* ── Build day grid ────────────────────────────────────────── */

  const days: DayState[] = useMemo(() => {
    if (!availability) return [];
    const [y, m] = monthStart.split('-').map(Number);
    return buildDayGrid(availability, y, m - 1);
  }, [availability, monthStart]);

  /* ── Reset selection + local blocks when month or data changes ── */

  useEffect(() => {
    setSelectedDayIndex(null);
    setUnsavedBlocks({});
  }, [monthStart, availability]);

  const selectedDay = selectedDayIndex !== null ? days[selectedDayIndex] : null;

  /* ── Merge override blocks with local unsaved blocks ────────── */

  const displayBlocks = useMemo(() => {
    if (!selectedDay) return [];
    const local = unsavedBlocks[selectedDay.date] || [];
    return [...selectedDay.overrideBlocks, ...local] as BlockData[];
  }, [selectedDay, unsavedBlocks]);

  /* ── Pending count (unsaved blocks) ────────────────────────── */

  const pendingCount = useMemo(() => {
    return Object.values(unsavedBlocks).flat().filter((b) => !b.saved).length;
  }, [unsavedBlocks]);

  /* ── Month navigation helpers ──────────────────────────────── */

  const monthLabel = useMemo(() => {
    const [y, m] = monthStart.split('-').map(Number);
    const d = new Date(y, m - 1, 15);
    return d.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  }, [monthStart]);

  function prevMonth() {
    const [y, m] = monthStart.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    d.setMonth(d.getMonth() - 1);
    setMonthStart(formatDate(getFirstOfMonth(d)));
  }

  function nextMonth() {
    const [y, m] = monthStart.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    d.setMonth(d.getMonth() + 1);
    setMonthStart(formatDate(getFirstOfMonth(d)));
  }

  function goToCurrentMonth() {
    setMonthStart(formatDate(getFirstOfMonth(today)));
  }

  /* ── Block CRUD (CalendarGrid manages local state) ──────────── */

  function handleAddBlock(dayIndex: number) {
    const day = days[dayIndex];
    if (!day) return;

    const existingTracks = new Set(
      [...day.overrideBlocks, ...(unsavedBlocks[day.date] || [])].map((b) => b.track),
    );
    const defaultTrack = existingTracks.has('pista') ? 'circulacion' : 'pista';

    const newBlock: BlockData = {
      id: localId(),
      start: '08:00',
      end: '14:00',
      track: defaultTrack,
      saved: false,
    };

    setUnsavedBlocks((prev) => ({
      ...prev,
      [day.date]: [...(prev[day.date] || []), newBlock],
    }));
  }

  function handleUpdateBlock(
    dayIndex: number,
    blockId: string,
    field: 'start' | 'end' | 'track',
    value: string,
  ) {
    const day = days[dayIndex];
    if (!day) return;

    // Only update local unsaved blocks; saved blocks go through save/remove
    if (unsavedBlocks[day.date]?.some((b) => b.id === blockId)) {
      setUnsavedBlocks((prev) => ({
        ...prev,
        [day.date]: prev[day.date].map((b) =>
          b.id === blockId ? { ...b, [field]: value } : b,
        ),
      }));
    }
  }

  /** Trigger batch save — collects all unsaved blocks and delegates to parent */
  async function handleBatchSaveClick() {
    if (!onBatchSave || pendingCount === 0) return;
    setIsBatchSaving(true);
    try {
      await onBatchSave(unsavedBlocks);
      setUnsavedBlocks({});
    } catch {
      // Error already set by parent — keep unsavedBlocks for retry
    } finally {
      setIsBatchSaving(false);
    }
  }

  /** Wraps onSaveBlock: resolves date from dayIndex before calling parent */
  async function handleBlockSave(dayIndex: number, block: BlockData) {
    const day = days[dayIndex];
    if (day) {
      await onSaveBlock(day.date, block);
    }
  }

  /** Wraps onRemoveBlock: resolves date from dayIndex before calling parent */
  async function handleBlockRemove(dayIndex: number, block: BlockData) {
    const day = days[dayIndex];
    if (!day) return;

    if (!block.saved) {
      // Unsaved block — remove locally only, skip API call
      setUnsavedBlocks((prev) => {
        const next = { ...prev };
        const filtered = (next[day.date] || []).filter((b) => b.id !== block.id);
        if (filtered.length > 0) {
          next[day.date] = filtered;
        } else {
          delete next[day.date];
        }
        return next;
      });
      return;
    }

    // Saved block — delegate to parent
    await onRemoveBlock(day.date, block);
  }

  /* ── Render helpers ────────────────────────────────────────── */

  function renderTrackLabel(
    t: { track: string; startTime: string; endTime: string },
    compact = false,
  ) {
    const isPista = t.track === 'pista';
    const isCirculacion = t.track === 'circulacion';
    const cls = compact
      ? `text-[9px] leading-tight px-1 rounded-full w-full text-center truncate ${
          isPista
            ? 'bg-amber-50 text-amber-700'
            : isCirculacion
              ? 'bg-sky-50 text-sky-700'
              : 'bg-surface-container-low text-on-surface-variant'
        }`
      : `text-[10px] px-1.5 py-0.5 rounded-full w-full text-center ${
          isPista
            ? 'bg-amber-50 text-amber-700'
            : isCirculacion
              ? 'bg-sky-50 text-sky-700'
              : 'bg-surface-container-low text-on-surface-variant'
        }`;

    return (
      <span key={t.track} className={cls}>
        {isPista ? 'P' : isCirculacion ? 'C' : '—'} {t.startTime}-{t.endTime}
      </span>
    );
  }

  /* ── Empty state ───────────────────────────────────────────── */

  if (!loading && !teacherId) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
          person_search
        </span>
        <p className="text-sm text-on-surface-variant">
          Selecciona un profesor para ver su planificación mensual
        </p>
      </div>
    );
  }

  /* ── Loading state ─────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  /* ── No data state (loaded but empty) ──────────────────────── */

  if (!loading && days.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-on-surface-variant">
          No hay datos de disponibilidad para este mes
        </p>
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* ── Month navigation ────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Mes anterior"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>
          <button
            onClick={goToCurrentMonth}
            className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary-container/20 rounded-lg transition-colors cursor-pointer"
          >
            ESTE MES
          </button>
          <span className="text-sm font-medium text-on-surface capitalize min-w-[140px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Mes siguiente"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_right
            </span>
          </button>
        </div>

        {/* ── Batch save area ─────────────────────────────── */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-full whitespace-nowrap">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={handleBatchSaveClick}
              disabled={isBatchSaving}
              className="px-3 py-1 text-xs font-medium bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isBatchSaving ? 'Guardando...' : 'Guardar Todo'}
            </button>
          </div>
        )}
      </div>

      {/* ── Feedbacks ───────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">
          <span>{error}</span>
          {onDismissFeedback && (
            <button
              onClick={onDismissFeedback}
              className="ml-2 text-error/70 hover:text-error"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span>{successMsg}</span>
          {onDismissFeedback && (
            <button
              onClick={onDismissFeedback}
              className="ml-2 text-green-500 hover:text-green-700"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ═══ DESKTOP GRID ═══ */}
      <div className="hidden sm:block">
        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 gap-px mb-px bg-outline-variant/30 rounded-t-lg overflow-hidden">
          {DAY_LABELS_SHORT.map((label) => (
            <div
              key={label}
              className="bg-surface-container-low px-2 py-1.5 text-center text-xs font-semibold text-on-surface-variant"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-px bg-outline-variant/30 rounded-b-lg overflow-hidden">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const isToday = day.isToday;

            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`
                  relative bg-white p-1.5 min-h-[90px] cursor-pointer
                  transition-colors duration-100
                  ${!day.isCurrentMonth ? 'opacity-30 bg-gray-50' : ''}
                  ${isSelected ? 'ring-2 ring-primary ring-inset bg-primary-container/10' : ''}
                  ${isToday && !isSelected ? 'ring-1 ring-primary/50 ring-inset' : ''}
                  hover:bg-surface-container-low/60
                `}
              >
                {/* Day number */}
                <div className="flex items-start justify-between mb-1">
                  <span
                    className={`
                      text-xs font-semibold leading-none
                      ${isToday ? 'bg-primary text-on-primary w-5 h-5 flex items-center justify-center rounded-full' : 'text-on-surface'}
                    `}
                  >
                    {day.monthDay}
                  </span>

                  {/* Toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleDay(day.date);
                    }}
                    disabled={saving || !day.isCurrentMonth}
                    className={`
                      text-[10px] font-medium px-1.5 py-0.5 rounded
                      transition-colors cursor-pointer leading-none
                      ${!day.isCurrentMonth ? 'opacity-0 pointer-events-none' : ''}
                      ${day.isAvailable
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }
                    `}
                  >
                    {day.isAvailable ? 'Sí' : 'No'}
                  </button>
                </div>

                {/* Track / block labels */}
                <div className="flex flex-col gap-0.5">
                  {/* Override blocks (saved) */}
                  {day.overrideBlocks
                    .filter((b) => b.saved)
                    .map((b) => (
                      <span
                        key={b.id}
                        className={`
                          text-[9px] leading-tight px-1 rounded-full w-full truncate
                          ${!b.track || b.track === ''
                            ? 'bg-green-50 text-green-600'
                            : b.track === 'pista'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-sky-50 text-sky-700'
                          }
                        `}
                      >
                        {b.track === 'pista' ? 'P' : b.track === 'circulacion' ? 'C' : 'G'}{' '}
                        {b.start}-{b.end}
                      </span>
                    ))}

                  {/* Base availability labels (only on current-month days with no overrides hiding them) */}
                  {day.isAvailable &&
                    day.tracks.length > 0 &&
                    day.tracks.map((t) => {
                      const alreadyShown = day.overrideBlocks.some(
                        (b) =>
                          b.saved &&
                          b.track === (t.track === 'default' ? '' : t.track),
                      );
                      if (alreadyShown) return null;
                      return (
                        <span
                          key={t.track}
                          className={`
                            text-[9px] leading-tight px-1 rounded-full w-full truncate
                            ${t.track === 'pista'
                              ? 'bg-amber-50/60 text-amber-600'
                              : t.track === 'circulacion'
                                ? 'bg-sky-50/60 text-sky-600'
                                : 'bg-surface-container-low text-on-surface-variant/60'
                            }
                          `}
                        >
                          {t.track === 'pista' ? 'P' : t.track === 'circulacion' ? 'C' : '—'}{' '}
                          {t.startTime}-{t.endTime}
                        </span>
                      );
                    })}

                  {/* Reason if not available */}
                  {!day.isAvailable && day.reason && (
                    <span className="text-[9px] text-gray-400 truncate leading-tight mt-0.5">
                      {day.reason}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ MOBILE GRID ═══ */}
      <div className="sm:hidden space-y-2">
        {/* Month header with nav (mobile) */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={goToCurrentMonth}
            className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary-container/20 rounded-lg"
          >
            ESTE MES
          </button>
          <span className="text-sm font-medium text-on-surface capitalize">{monthLabel}</span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-px">
          {DAY_LABELS_SHORT.map((l) => (
            <div
              key={l}
              className="text-center text-[10px] font-semibold text-on-surface-variant py-1"
            >
              {l}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-px bg-outline-variant/30 rounded-lg overflow-hidden">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            return (
              <div
                key={day.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`
                  relative bg-white p-1 min-h-[48px] cursor-pointer
                  text-center transition-colors duration-100
                  ${!day.isCurrentMonth ? 'opacity-20 bg-gray-50' : ''}
                  ${isSelected ? 'ring-2 ring-primary ring-inset bg-primary-container/10' : ''}
                  ${day.isToday && !isSelected ? 'ring-1 ring-primary/40 ring-inset' : ''}
                `}
              >
                <span
                  className={`
                    text-[11px] font-semibold leading-none
                    ${day.isToday
                      ? 'bg-primary text-on-primary w-5 h-5 inline-flex items-center justify-center rounded-full'
                      : 'text-on-surface'
                    }
                  `}
                >
                  {day.monthDay}
                </span>

                <div className="flex justify-center gap-0.5 mt-0.5">
                  {day.isAvailable ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                  )}
                  {day.overrideBlocks.filter((b) => b.saved).length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Selected day detail panel ═══ */}
      {selectedDay && (
        <Card className="!p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  selectedDay.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-sm font-semibold text-on-surface">
                {selectedDay.dayLabel}{' '}
                {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
              <span className="text-[10px] text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded-full">
                {selectedDay.isAvailable ? 'Disponible' : 'No disponible'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleDay(selectedDay.date)}
                disabled={saving}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                  selectedDay.isAvailable
                    ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {selectedDay.isAvailable ? 'Desactivar día' : 'Activar día'}
              </button>
            </div>
          </div>

          {/* Reason if not available */}
          {!selectedDay.isAvailable && selectedDay.reason && (
            <div className="mb-3 text-xs text-on-surface-variant">
              Motivo: {selectedDay.reason}
            </div>
          )}

          {/* Base track info */}
          {selectedDay.tracks.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {selectedDay.tracks.map((t) => (
                <span
                  key={t.track}
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    t.track === 'pista'
                      ? 'bg-amber-50 text-amber-700'
                      : t.track === 'circulacion'
                        ? 'bg-sky-50 text-sky-700'
                        : 'bg-surface-container-low text-on-surface-variant'
                  }`}
                >
                  {t.track === 'pista'
                    ? 'Pista'
                    : t.track === 'circulacion'
                      ? 'Circulación'
                      : 'Base'}
                  : {t.startTime}-{t.endTime}
                </span>
              ))}
            </div>
          )}

          {/* Block editor */}
          {selectedDay.isAvailable && (
            <ScheduleBlockEditor
              teacherId={teacherId}
              dayIndex={selectedDayIndex!}
              dayLabel={selectedDay.dayLabel}
              blocks={displayBlocks}
              isSaving={saving}
              maxBlocks={3}
              onSave={handleBlockSave}
              onRemove={handleBlockRemove}
              onAdd={handleAddBlock}
              onUpdate={handleUpdateBlock}
            />
          )}
        </Card>
      )}
    </div>
  );
}

/* ─── Utility: merge overrides for batch save ───────────────── */

/**
 * Builds the DESIRED FINAL STATE for a single date by merging existing
 * saved overrides with new unsaved blocks. Unsaved blocks' tracks win
 * over existing overrides (they replace). The result is what should be
 * sent to batchSetOverrides to avoid the backend's stale-cleanup from
 * deleting existing entries.
 */
export function mergeOverridesForBatch(
  existingOverrides: OverrideDto[],
  date: string,
  unsavedBlocks: BlockData[],
): BatchOverrideEntry[] {
  const existingForDate = existingOverrides.filter((o) => {
    const d =
      typeof o.date === 'string'
        ? o.date.split('T')[0]
        : new Date(o.date).toISOString().split('T')[0];
    return d === date;
  });

  const unsavedTracks = new Set(unsavedBlocks.map((b) => b.track));
  const result: BatchOverrideEntry[] = [];

  // Keep existing overrides whose track is NOT being overwritten
  for (const ov of existingForDate) {
    if (!unsavedTracks.has(ov.track ?? '')) {
      result.push({
        date,
        isAvailable: ov.isAvailable,
        startTime: ov.startTime ?? undefined,
        endTime: ov.endTime ?? undefined,
        track: ov.track ?? undefined,
      });
    }
  }

  // Append unsaved blocks (these win for overlapping tracks)
  for (const b of unsavedBlocks) {
    result.push({
      date,
      isAvailable: true,
      startTime: b.start,
      endTime: b.end,
      track: b.track || undefined,
    });
  }

  return result;
}
