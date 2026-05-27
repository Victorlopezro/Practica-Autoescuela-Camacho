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

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/* ─── Types ──────────────────────────────────────────────────── */

interface DayTrackInfo {
  track: string;
  startTime: string;
  endTime: string;
}

interface DayState {
  date: string;
  dayLabel: string;
  isAvailable: boolean;
  reason?: string;
  /** Base availability per track (read-only visual info) */
  tracks: DayTrackInfo[];
  /** Override blocks for this date (per-track override entries) */
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
  const [weekStart, setWeekStart] = useState(() => formatDate(getMonday(today)));
  const [availability, setAvailability] = useState<TeacherAvailabilityDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [days, setDays] = useState<DayState[]>([]);
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

  /* ── Rebuild day grid when availability or weekStart changes ── */

  useEffect(() => {
    if (!availability) {
      setDays([]);
      return;
    }

    const newDays: DayState[] = [];
    const startDate = new Date(weekStart + 'T12:00:00');

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dateStr = formatDate(date);
      const jsDayOfWeek = date.getDay();
      const backendDayOfWeek = toBackendDayOfWeek(jsDayOfWeek);

      // All overrides for this date (per-track)
      const dateOverrides = availability.overrides.filter(
        (o: OverrideDto) => o.date === dateStr,
      );

      // Find if there's a "general" override (track=null) that sets availability
      const generalOverride = dateOverrides.find((o) => o.track == null);
      const isAvailable = dateOverrides.length === 0 || (generalOverride?.isAvailable ?? true);

      // Build override blocks from track-specific overrides
      const overrideBlocks: BlockData[] = dateOverrides
        .filter((o) => o.track != null) // only track-specific overrides become blocks
        .map((o) => ({
          id: uid(),
          start: o.startTime ?? '08:00',
          end: o.endTime ?? '14:00',
          track: o.track ?? '',
          saved: true,
        }));

      // Also show a block for the general override if it has custom hours
      if (generalOverride && generalOverride.isAvailable && generalOverride.startTime) {
        overrideBlocks.push({
          id: uid(),
          start: generalOverride.startTime,
          end: generalOverride.endTime ?? '14:00',
          track: '',
          saved: true,
        });
      }

      // All base availability entries for this dayOfWeek (multi-track)
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
        dayLabel: DAY_LABELS[i],
        isAvailable,
        reason: generalOverride?.reason ?? undefined,
        tracks,
        overrideBlocks,
      });
    }

    setDays(newDays);
  }, [availability, weekStart]);

  /* ── Week navigation ────────────────────────────────────────── */

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 6);
    return formatDate(d);
  }, [weekStart]);

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart + 'T12:00:00');
    const end = new Date(weekEnd + 'T12:00:00');
    return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }, [weekStart, weekEnd]);

  function prevWeek() {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() - 7);
    setWeekStart(formatDate(d));
  }

  function nextWeek() {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    setWeekStart(formatDate(d));
  }

  function goToCurrentWeek() {
    setWeekStart(formatDate(getMonday(today)));
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
        // Mark as not available — create general override
        await services.scheduling.setOverride(selectedTeacherId, date, false, undefined, undefined, undefined, undefined);
        setSuccessMsg('Día marcado como no disponible');
      } else {
        // Remove the general "not available" override
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

  /* ── Copy week callback ─────────────────────────────────────── */

  async function handleCopySuccess() {
    setCopyModalOpen(false);
    setSuccessMsg('Semana copiada correctamente');
    await loadAvailability();
    onRefreshPlanning?.();
  }

  /* ── Render ─────────────────────────────────────────────────── */

  const inputClass =
    'w-full px-2 py-1.5 text-xs border border-outline-variant/50 rounded-lg bg-white text-on-surface text-center';

  return (
    <div className="space-y-4">
      {/* ── Header: teacher selector + week nav ──────────────── */}
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
            onClick={prevWeek}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Semana anterior"
          >
            <span className="material-symbols-outlined text-[18px]">
              chevron_left
            </span>
          </button>
          <button
            onClick={goToCurrentWeek}
            className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary-container/20 rounded-lg transition-colors cursor-pointer"
          >
            ESTA SEMANA
          </button>
          <span className="text-sm font-medium text-on-surface min-w-[180px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer"
            aria-label="Semana siguiente"
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
            Selecciona un profesor para ver su planificación semanal
          </p>
        </div>
      )}

      {/* ── Day grid ─────────────────────────────────────────── */}
      {!loading && days.length > 0 && (
        <div className="space-y-2">
          {/* ═══ DESKTOP ═══ */}
          <div className="hidden sm:block">
            {/* Grid header */}
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 mb-1">
              <div />
              {days.map((d) => (
                <div
                  key={d.date}
                  className="text-xs font-medium text-on-surface-variant text-center py-1"
                >
                  {d.dayLabel}
                  <br />
                  <span className="text-[10px]">
                    {new Date(d.date + 'T12:00:00').getDate()}
                  </span>
                </div>
              ))}
            </div>

            {/* Availability toggle row */}
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 mb-2">
              <div className="text-xs text-on-surface-variant self-center">
                Disponible
              </div>
              {days.map((d) => (
                <div key={d.date} className="flex justify-center">
                  <button
                    onClick={() => toggleDay(d.date)}
                    disabled={saving}
                    className={`w-10 h-6 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      d.isAvailable
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {d.isAvailable ? 'Sí' : 'No'}
                  </button>
                </div>
              ))}
            </div>

            {/* Override blocks per day — using ScheduleBlockEditor */}
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-2 mb-1">
              <div className="text-xs text-on-surface-variant self-start pt-1">
                Bloques
              </div>
              {days.map((d) => (
                <div key={d.date} className="flex flex-col items-center gap-1">
                  {d.isAvailable ? (
                    <div className="w-full">
                      <ScheduleBlockEditor
                        teacherId={selectedTeacherId}
                        dayIndex={days.indexOf(d)}
                        dayLabel={d.dayLabel}
                        blocks={d.overrideBlocks}
                        isSaving={saving}
                        maxBlocks={3}
                        onSave={saveBlock}
                        onRemove={removeBlock}
                        onAdd={addBlock}
                        onUpdate={updateBlock}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-on-surface-variant py-3">
                      {d.reason ?? '—'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Base availability track info (read-only) */}
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-2">
              <div className="text-[10px] text-on-surface-variant self-center">
                Bloques base
              </div>
              {days.map((day) => (
                <div key={day.date} className="flex flex-col items-center gap-0.5">
                  {day.tracks.length > 0 ? (
                    day.tracks.map((t) => (
                      <span
                        key={t.track}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full w-full text-center ${
                          t.track === 'pista'
                            ? 'bg-amber-50 text-amber-700'
                            : t.track === 'circulacion'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-surface-container-low text-on-surface-variant'
                        }`}
                      >
                        {t.track === 'pista' ? 'P' : t.track === 'circulacion' ? 'C' : '—'}{' '}
                        {t.startTime}-{t.endTime}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-on-surface-variant py-0.5">—</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ═══ MOBILE ═══ */}
          <div className="sm:hidden space-y-2">
            {days.map((d) => (
              <Card key={d.date} className="!p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        d.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <span className="text-sm font-medium text-on-surface">
                      {d.dayLabel}{' '}
                      {new Date(d.date + 'T12:00:00').getDate()}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleDay(d.date)}
                    disabled={saving}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      d.isAvailable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {d.isAvailable ? 'Disponible' : 'No disponible'}
                  </button>
                </div>

                {d.isAvailable && (
                  <div className="mb-2">
                    <ScheduleBlockEditor
                      teacherId={selectedTeacherId}
                      dayIndex={days.indexOf(d)}
                      dayLabel={d.dayLabel}
                      blocks={d.overrideBlocks}
                      isSaving={saving}
                      maxBlocks={3}
                      onSave={saveBlock}
                      onRemove={removeBlock}
                      onAdd={addBlock}
                      onUpdate={updateBlock}
                    />
                  </div>
                )}

                {/* Base track blocks for mobile */}
                {d.tracks.length > 1 && d.isAvailable && (
                  <div className="flex flex-col gap-1 mt-2">
                    {d.tracks.map((t) => (
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
              </Card>
            ))}
          </div>
        </div>
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
        sourceWeekStart={weekStart}
        onSuccess={handleCopySuccess}
      />
    </div>
  );
}
