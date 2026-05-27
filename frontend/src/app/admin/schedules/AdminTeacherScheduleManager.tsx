'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/layouts/Card';
import { Button } from '@/components/ui/button';
import { services } from '@/services';
import { ScheduleBlockEditor } from '@/components/scheduling/ScheduleBlockEditor';
import type { BlockData } from '@/components/scheduling/ScheduleBlockEditor';
import type { TeacherAvailabilityDto, OverrideDto } from '@/services/interfaces';
import { CopyWeekModal } from './CopyWeekModal';

/* ─── Helpers ────────────────────────────────────────────────── */

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toBackendDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Returns an array of Date objects for a full calendar grid.
 * Monday‑based weeks, padded with leading/lagging days from
 * adjacent months so the grid always starts on Monday and ends
 * on Sunday.
 */
function getMonthGrid(year: number, month: number): Date[] {
  const grid: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // JS getDay(): Sunday=0 → convert to Monday=1 … Sunday=7
  const startDow = first.getDay() || 7;
  const padBefore = startDow - 1; // days to prepend from prev month

  for (let i = padBefore; i > 0; i--) {
    grid.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    grid.push(new Date(year, month, d));
  }
  // Pad at end so the last row is full (multiple of 7)
  const overflow = grid.length % 7;
  if (overflow !== 0) {
    for (let i = 1; i <= 7 - overflow; i++) {
      grid.push(new Date(year, month + 1, i));
    }
  }
  return grid;
}

function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Returns the first Monday <= startDate (walk backwards). */
function getMondayBefore(date: Date): Date {
  const d = new Date(date);
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_LABELS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/* ─── Types ──────────────────────────────────────────────────── */

interface DayTrackInfo {
  track: string;
  startTime: string;
  endTime: string;
}

interface DayState {
  date: string;
  dayLabel: string;
  monthDay: number;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  reason?: string;
  tracks: DayTrackInfo[];
  overrideBlocks: BlockData[];
}

interface Props {
  teachers: Array<{ id: string; name: string }>;
  initialTeacherId?: string;
  onRefreshPlanning?: () => void;
}

let _blockSeq = 0;
function uid(): string {
  return `b${++_blockSeq}`;
}

/* ─── Component ──────────────────────────────────────────────── */

export function AdminTeacherScheduleManager({
  teachers,
  initialTeacherId,
  onRefreshPlanning,
}: Props) {
  const today = new Date();
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    initialTeacherId ?? teachers[0]?.id ?? '',
  );
  const [monthStart, setMonthStart] = useState(() => formatDate(getFirstOfMonth(today)));
  const [availability, setAvailability] = useState<TeacherAvailabilityDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [days, setDays] = useState<DayState[]>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  /* ── Load availability when teacher changes ────────────────── */

  const loadAvailability = useCallback(async () => {
    if (!selectedTeacherId) return;
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await services.scheduling.getTeacherAvailability(selectedTeacherId);
      setAvailability(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar disponibilidad');
    } finally {
      setLoading(false);
    }
  }, [selectedTeacherId]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  /* ── Rebuild day grid when availability or monthStart changes ─ */

  useEffect(() => {
    if (!availability) {
      setDays([]);
      return;
    }

    const [y, m] = monthStart.split('-').map(Number);
    const gridDates = getMonthGrid(y, m - 1);
    const currentYear = y;
    const currentMonth = m - 1;
    const newDays: DayState[] = [];

    for (const date of gridDates) {
      const dateStr = formatDate(date);
      const jsDayOfWeek = date.getDay();
      const backendDayOfWeek = toBackendDayOfWeek(jsDayOfWeek);
      const isCurrentMonth =
        date.getFullYear() === currentYear && date.getMonth() === currentMonth;

      const dateOverrides = availability.overrides.filter(
        (o: OverrideDto) => o.date === dateStr,
      );

      const generalOverride = dateOverrides.find((o) => o.track == null);
      const isAvailable = dateOverrides.length === 0 || (generalOverride?.isAvailable ?? true);

      const overrideBlocks: BlockData[] = dateOverrides
        .filter((o) => o.track != null)
        .map((o) => ({
          id: uid(),
          start: o.startTime ?? '08:00',
          end: o.endTime ?? '14:00',
          track: o.track ?? '',
          saved: true,
        }));

      if (generalOverride && generalOverride.isAvailable && generalOverride.startTime) {
        overrideBlocks.push({
          id: uid(),
          start: generalOverride.startTime,
          end: generalOverride.endTime ?? '14:00',
          track: '',
          saved: true,
        });
      }

      const dayAvail = availability.availability.filter(
        (a) => a.dayOfWeek === backendDayOfWeek,
      );

      const tracks: DayTrackInfo[] = dayAvail.map((a) => ({
        track: a.track ?? 'default',
        startTime: a.startTime,
        endTime: a.endTime,
      }));

      newDays.push({
        date: dateStr,
        dayLabel: DAY_LABELS[jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1],
        monthDay: date.getDate(),
        isCurrentMonth,
        isAvailable,
        reason: generalOverride?.reason ?? undefined,
        tracks,
        overrideBlocks,
      });
    }

    setDays(newDays);
    // Reset selection when month changes
    setSelectedDayIndex(null);
  }, [availability, monthStart]);

  /* ── Month navigation ──────────────────────────────────────── */

  const monthLabel = useMemo(() => {
    const [y, m] = monthStart.split('-').map(Number);
    const d = new Date(y, m - 1, 15);
    return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
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

  /* ── Day toggle (available / not available) ─────────────────── */

  async function toggleDay(date: string) {
    if (!selectedTeacherId) return;
    const day = days.find((d) => d.date === date);
    if (!day) return;

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      if (day.isAvailable) {
        await services.scheduling.setOverride(selectedTeacherId, date, false, undefined, undefined, undefined, undefined);
        setSuccessMsg('Día marcado como no disponible');
      } else {
        await services.scheduling.removeOverride(selectedTeacherId, date);
        setSuccessMsg('Disponibilidad restaurada');
      }
      await loadAvailability();
      onRefreshPlanning?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar disponibilidad');
    } finally {
      setSaving(false);
    }
  }

  /* ── Override block operations ──────────────────────────────── */

  async function saveBlock(dayIndex: number, block: BlockData) {
    if (!selectedTeacherId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const day = days[dayIndex];
      const track = block.track || undefined;
      await services.scheduling.setOverride(
        selectedTeacherId,
        day.date,
        true,
        block.start,
        block.end,
        undefined,
        track,
      );
      setSuccessMsg(`Bloque guardado${track ? ` (${track})` : ''}`);
      await loadAvailability();
      onRefreshPlanning?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar bloque');
    } finally {
      setSaving(false);
    }
  }

  async function removeBlock(dayIndex: number, block: BlockData) {
    if (!selectedTeacherId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const day = days[dayIndex];
      const track = block.track || undefined;
      await services.scheduling.removeOverride(selectedTeacherId, day.date, track);
      setSuccessMsg('Bloque eliminado');
      await loadAvailability();
      onRefreshPlanning?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar bloque');
    } finally {
      setSaving(false);
    }
  }

  function addBlock(dayIndex: number) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        const existingTracks = new Set(d.overrideBlocks.map((b) => b.track));
        const defaultTrack = existingTracks.has('pista')
          ? 'circulacion'
          : existingTracks.has('circulacion')
            ? 'pista'
            : 'pista';
        return {
          ...d,
          overrideBlocks: [
            ...d.overrideBlocks,
            { id: uid(), start: '08:00', end: '14:00', track: defaultTrack, saved: false },
          ],
        };
      }),
    );
  }

  function updateBlock(dayIndex: number, blockId: string, field: 'start' | 'end' | 'track', value: string) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIndex) return d;
        return {
          ...d,
          overrideBlocks: d.overrideBlocks.map((b) =>
            b.id === blockId ? { ...b, [field]: value } : b,
          ),
        };
      }),
    );
  }

  /* ── Selected day (for block editing) ───────────────────────── */

  const selectedDay = selectedDayIndex !== null ? days[selectedDayIndex] : null;

  /* ── Copy week callback ─────────────────────────────────────── */

  async function handleCopySuccess() {
    setCopyModalOpen(false);
    setSuccessMsg('Semana copiada correctamente');
    await loadAvailability();
    onRefreshPlanning?.();
  }

  /** First Monday of the current month (used as copy-week default). */
  const firstMonday = useMemo(() => {
    return formatDate(getMondayBefore(new Date(monthStart + 'T12:00:00')));
  }, [monthStart]);

  /* ── Render helpers ─────────────────────────────────────────── */

  function renderTrackLabel(t: DayTrackInfo, compact = false) {
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

  /* ── Render ─────────────────────────────────────────────────── */

  const inputClass =
    'w-full px-2 py-1.5 text-xs border border-outline-variant/50 rounded-lg bg-white text-on-surface text-center';

  return (
    <div className="space-y-4">
      {/* ── Header: teacher selector + month nav ──────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-on-surface-variant">Profesor:</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
            }}
            className="px-2.5 py-1.5 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
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
      </div>

      {/* ── Feedbacks ────────────────────────────────────────── */}
      {error && (
        <div className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {successMsg}
        </div>
      )}

      {/* ── Loading spinner ──────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* ── No teacher selected ──────────────────────────────── */}
      {!loading && !selectedTeacherId && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="material-symbols-outlined text-[40px] text-on-surface-variant">
            person_search
          </span>
          <p className="text-sm text-on-surface-variant">
            Selecciona un profesor para ver su planificación mensual
          </p>
        </div>
      )}

      {/* ── Calendar grid ────────────────────────────────────── */}
      {!loading && days.length > 0 && (
        <>
          {/* ═══ DESKTOP ═══ */}
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
                const isToday = formatDate(today) === day.date;

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
                          toggleDay(day.date);
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
                          // skip if already shown as an override block
                          const alreadyShown = day.overrideBlocks.some(
                            (b) => b.saved && b.track === (t.track === 'default' ? '' : t.track),
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

          {/* ═══ MOBILE ═══ */}
          <div className="sm:hidden space-y-2">
            {/* Month header with nav */}
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
                <div key={l} className="text-center text-[10px] font-semibold text-on-surface-variant py-1">
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
                      ${formatDate(today) === day.date && !isSelected ? 'ring-1 ring-primary/40 ring-inset' : ''}
                    `}
                  >
                    <span
                      className={`
                        text-[11px] font-semibold leading-none
                        ${formatDate(today) === day.date
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
                    {selectedDay.dayLabel}
                    {' '}
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
                    onClick={() => toggleDay(selectedDay.date)}
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

              {/* Day info: reason */}
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
                      {t.track === 'pista' ? 'Pista' : t.track === 'circulacion' ? 'Circulación' : 'Base'}: {t.startTime}-{t.endTime}
                    </span>
                  ))}
                </div>
              )}

              {/* Block editor */}
              {selectedDay.isAvailable && (
                <ScheduleBlockEditor
                  teacherId={selectedTeacherId}
                  dayIndex={selectedDayIndex!}
                  dayLabel={selectedDay.dayLabel}
                  blocks={selectedDay.overrideBlocks}
                  isSaving={saving}
                  maxBlocks={3}
                  onSave={saveBlock}
                  onRemove={removeBlock}
                  onAdd={addBlock}
                  onUpdate={updateBlock}
                />
              )}
            </Card>
          )}
        </>
      )}

      {/* ── Actions bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
        <Button
          variant="outline"
          onClick={() => setCopyModalOpen(true)}
          disabled={loading || !availability}
        >
          <span className="material-symbols-outlined text-[16px]">
            content_copy
          </span>
          Copiar semana
        </Button>
      </div>

      {/* ── Copy week modal ──────────────────────────────────── */}
      <CopyWeekModal
        open={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        teacherId={selectedTeacherId}
        sourceWeekStart={firstMonday}
        onSuccess={handleCopySuccess}
      />
    </div>
  );
}
