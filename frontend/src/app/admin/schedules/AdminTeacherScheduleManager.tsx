'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { services } from '@/services';
import type { TeacherAvailabilityDto, BatchOverrideEntry, OverrideDto } from '@/services/interfaces';
import type { BlockData } from '@/components/scheduling/ScheduleBlockEditor';
import { mergeOverridesForBatch } from '@/components/scheduling/CalendarGrid';
import { formatDate, getMondayBefore } from '@/lib/calendar-utils';
import { CalendarGrid } from '@/components/scheduling/CalendarGrid';
import { CopyWeekModal } from './CopyWeekModal';

/* ─── Types ──────────────────────────────────────────────────── */

interface Props {
  teachers: Array<{ id: string; name: string }>;
  initialTeacherId?: string;
  onRefreshPlanning?: () => void;
}

/* ─── Component ──────────────────────────────────────────────── */

export function AdminTeacherScheduleManager({
  teachers,
  initialTeacherId,
  onRefreshPlanning,
}: Props) {
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    initialTeacherId ?? teachers[0]?.id ?? '',
  );
  const [availability, setAvailability] = useState<TeacherAvailabilityDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copyModalOpen, setCopyModalOpen] = useState(false);

  /* ── Selected teacher name for CalendarGrid ────────────────── */

  const selectedTeacherName = useMemo(() => {
    return teachers.find((t) => t.id === selectedTeacherId)?.name ?? '';
  }, [teachers, selectedTeacherId]);

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

  /* ── Day toggle (available / not available) ─────────────────── */

  async function toggleDay(date: string) {
    if (!selectedTeacherId || !availability) return;

    // Determine current state from availability data
    const todayOverrides = availability.overrides.filter((o) => {
      const oDate =
        typeof o.date === 'string'
          ? o.date.split('T')[0]
          : new Date(o.date).toISOString().split('T')[0];
      return oDate === date;
    });
    const generalOverride = todayOverrides.find((o) => o.track == null);
    const isAvailable =
      todayOverrides.length === 0 || (generalOverride?.isAvailable ?? true);

    setError('');
    setSuccessMsg('');

    try {
      if (isAvailable) {
        await services.scheduling.setOverride(
          selectedTeacherId,
          date,
          false,
          undefined,
          undefined,
          undefined,
          undefined,
        );
        setSuccessMsg('Día marcado como no disponible');
      } else {
        await services.scheduling.removeOverride(selectedTeacherId, date);
        setSuccessMsg('Disponibilidad restaurada');
      }
      await loadAvailability();
      onRefreshPlanning?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar disponibilidad');
    }
  }

  /* ── Override block operations ──────────────────────────────── */

  async function saveBlock(date: string, block: { start: string; end: string; track?: string }) {
    if (!selectedTeacherId) return;
    setError('');
    setSuccessMsg('');

    try {
      const track = block.track || undefined;
      await services.scheduling.setOverride(
        selectedTeacherId,
        date,
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
    }
  }

  async function removeBlock(date: string, block: { track?: string }) {
    if (!selectedTeacherId) return;
    setError('');
    setSuccessMsg('');

    try {
      const track = block.track || undefined;
      await services.scheduling.removeOverride(selectedTeacherId, date, track);
      setSuccessMsg('Bloque eliminado');
      await loadAvailability();
      onRefreshPlanning?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar bloque');
    }
  }

  /* ── Batch save handler ─────────────────────────────────────── */

  async function handleBatchSave(blocksByDate: Record<string, BlockData[]>) {
    if (!selectedTeacherId || !availability) return;

    const entries = Object.entries(blocksByDate);
    const affectedDates = entries.map(([d]) => d);
    const payload: BatchOverrideEntry[] = [];

    for (const [date, unsaved] of entries) {
      const merged = mergeOverridesForBatch(availability.overrides, date, unsaved);
      payload.push(...merged);
    }

    try {
      await services.scheduling.batchSetOverrides(selectedTeacherId, payload);

      // Optimistic merge: replace overrides for affected dates with synthetic entries
      setAvailability((prev) => {
        if (!prev) return prev;
        const filtered = prev.overrides.filter((o) => {
          const d =
            typeof o.date === 'string'
              ? o.date.split('T')[0]
              : new Date(o.date).toISOString().split('T')[0];
          return !affectedDates.includes(d);
        });
        const synthetic: OverrideDto[] = payload.map((entry) => ({
          id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          teacherId: selectedTeacherId,
          date: entry.date + 'T00:00:00.000Z',
          isAvailable: entry.isAvailable,
          startTime: entry.startTime ?? null,
          endTime: entry.endTime ?? null,
          reason: null,
          track: entry.track ?? null,
        }));
        return { ...prev, overrides: [...filtered, ...synthetic] };
      });
      setSuccessMsg('Cambios guardados');
      onRefreshPlanning?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cambios');
      throw err; // re-throw so CalendarGrid knows to keep unsavedBlocks
    }
  }

  /* ── Dismiss feedback ──────────────────────────────────────── */

  function dismissFeedback() {
    setError('');
    setSuccessMsg('');
  }

  /* ── Copy week callback ─────────────────────────────────────── */

  async function handleCopySuccess() {
    setCopyModalOpen(false);
    setSuccessMsg('Semana copiada correctamente');
    await loadAvailability();
    onRefreshPlanning?.();
  }

  /** First Monday before today (used as copy-week default). */
  const firstMonday = useMemo(() => {
    return formatDate(getMondayBefore(new Date()));
  }, []);

  /* ── Render ─────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* ── Teacher selector ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-on-surface-variant whitespace-nowrap">Profesor:</label>
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

      {/* ── CalendarGrid handles: month nav, grid, block editing,
            loading/empty states, feedback messages ──────────── */}
      <CalendarGrid
        teacherId={selectedTeacherId}
        teacherName={selectedTeacherName}
        availability={availability}
        loading={loading}
        error={error}
        successMsg={successMsg}
        onToggleDay={toggleDay}
        onSaveBlock={saveBlock}
        onRemoveBlock={removeBlock}
        onDismissFeedback={dismissFeedback}
        onBatchSave={handleBatchSave}
      />

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
