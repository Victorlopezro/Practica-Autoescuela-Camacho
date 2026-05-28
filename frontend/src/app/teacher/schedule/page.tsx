'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { useAuth } from '@/hooks/useAuth';
import { services } from '@/services';
import { ScheduleBlockEditor } from '@/components/scheduling/ScheduleBlockEditor';
import type { BlockData } from '@/components/scheduling/ScheduleBlockEditor';
import { CalendarGrid, mergeOverridesForBatch } from '@/components/scheduling/CalendarGrid';
import type { TeacherAvailabilityDto, BatchOverrideEntry, OverrideDto } from '@/services/interfaces';

const DAYS = [
  { index: 0, label: 'Domingo' },
  { index: 1, label: 'Lunes' },
  { index: 2, label: 'Martes' },
  { index: 3, label: 'Miércoles' },
  { index: 4, label: 'Jueves' },
  { index: 5, label: 'Viernes' },
  { index: 6, label: 'Sábado' },
];

let _blockSeq = 0;
function uid(): string {
  return `b${++_blockSeq}`;
}

interface BlockEntry {
  id: string;
  start: string;
  end: string;
  track: string;
  saved: boolean;
}

export default function TeacherSchedule() {
  const { user } = useAuth();
  const teacherId = user?.teacherId ?? user?.id;

  const [availability, setAvailability] = useState<TeacherAvailabilityDto | null>(null);
  const [blocksByDay, setBlocksByDay] = useState<Record<number, BlockEntry[]>>({});
  const [doubleSession, setDoubleSession] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [weeklyOpen, setWeeklyOpen] = useState(false);

  const load = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const data = await services.scheduling.getTeacherAvailability(teacherId);
      const grouped: Record<number, BlockEntry[]> = {};
      for (const a of data.availability) {
        if (!grouped[a.dayOfWeek]) grouped[a.dayOfWeek] = [];
        grouped[a.dayOfWeek].push({
          id: uid(),
          start: a.startTime,
          end: a.endTime,
          track: a.track ?? '',
          saved: true,
        });
      }
      setAvailability(data);
      setBlocksByDay(grouped);
      setDoubleSession(data.doubleSession);
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar disponibilidad' });
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  /* ─── Weekly template block helpers ─── */

  function getBlocks(day: number): BlockEntry[] {
    return blocksByDay[day] ?? [];
  }

  function setBlocks(day: number, blocks: BlockEntry[]) {
    setBlocksByDay((prev) => {
      const next = { ...prev };
      if (blocks.length > 0) next[day] = blocks;
      else delete next[day];
      return next;
    });
  }

  function updateBlock(day: number, blockId: string, field: 'start' | 'end' | 'track', value: string) {
    setBlocks(day, getBlocks(day).map((b) => (b.id === blockId ? { ...b, [field]: value } : b)));
  }

  /* ─── Weekly template: Day toggle ─── */

  const toggleDay = (dayIndex: number) => {
    const blocks = getBlocks(dayIndex);
    if (blocks.length > 0) {
      for (const b of blocks) {
        if (b.saved && teacherId) {
          services.scheduling.removeAvailability(teacherId, dayIndex, b.track || undefined).catch(() => {
            setMessage({ type: 'error', text: `Error al eliminar bloque en ${DAYS[dayIndex].label}` });
          });
        }
      }
      setBlocks(dayIndex, []);
      setMessage(null);
    } else {
      setBlocks(dayIndex, [{ id: uid(), start: '08:00', end: '14:00', track: '', saved: false }]);
      setMessage(null);
    }
  };

  /* ─── Weekly template: Block save ─── */

  const saveBlock = async (dayIndex: number, block: BlockEntry) => {
    if (!teacherId) return;

    if (block.start >= block.end) {
      setMessage({ type: 'error', text: `La hora de inicio debe ser anterior a la de fin en ${DAYS[dayIndex].label}` });
      return;
    }

    setSaving(true);
    try {
      await services.scheduling.setAvailability(teacherId, dayIndex, block.start, block.end, block.track || undefined);
      setBlocks(dayIndex, getBlocks(dayIndex).map((b) => (b.id === block.id ? { ...b, saved: true } : b)));
      const label = block.track ? `${DAYS[dayIndex].label} (${block.track})` : DAYS[dayIndex].label;
      setMessage({ type: 'success', text: `Guardado ${label}` });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const apiMessage = err.response?.data?.message;
      const errorText = Array.isArray(apiMessage) ? apiMessage[0] : apiMessage;
      setMessage({ type: 'error', text: errorText || `Error al guardar ${DAYS[dayIndex].label}` });
    } finally {
      setSaving(false);
    }
  };

  /* ─── Weekly template: Block remove (individual) ─── */

  const removeBlock = async (dayIndex: number, block: BlockEntry) => {
    if (!teacherId) return;

    if (block.saved) {
      try {
        await services.scheduling.removeAvailability(teacherId, dayIndex, block.track || undefined);
      } catch {
        setMessage({ type: 'error', text: `Error al eliminar bloque en ${DAYS[dayIndex].label}` });
        return;
      }
    }

    const remaining = getBlocks(dayIndex).filter((b) => b.id !== block.id);
    setBlocks(dayIndex, remaining);
    setMessage(remaining.length === 0 ? null : { type: 'success', text: 'Bloque eliminado' });
  };

  /* ─── Weekly template: Add block ─── */

  const addBlock = (dayIndex: number) => {
    const blocks = getBlocks(dayIndex);
    if (blocks.length >= 2) return;

    const existingTracks = new Set(blocks.map((b) => b.track));
    const defaultTrack = existingTracks.has('pista') ? 'circulacion' : existingTracks.has('circulacion') ? 'pista' : '';

    setBlocks(dayIndex, [...blocks, { id: uid(), start: '08:00', end: '14:00', track: defaultTrack, saved: false }]);
  };

  /* ─── CalendarGrid API handlers ─── */

  async function handleToggleDay(date: string) {
    if (!teacherId || !availability) return;

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

    setMessage(null);

    try {
      if (isAvailable) {
        await services.scheduling.setOverride(teacherId, date, false);
        setMessage({ type: 'success', text: 'Día marcado como no disponible' });
      } else {
        await services.scheduling.removeOverride(teacherId, date);
        setMessage({ type: 'success', text: 'Disponibilidad restaurada' });
      }
      await load();
    } catch {
      setMessage({ type: 'error', text: 'Error al cambiar disponibilidad' });
    }
  }

  async function handleSaveBlock(date: string, block: { start: string; end: string; track?: string }) {
    if (!teacherId) return;
    setMessage(null);

    try {
      const track = block.track || undefined;
      await services.scheduling.setOverride(teacherId, date, true, block.start, block.end, undefined, track);
      setMessage({ type: 'success', text: `Bloque guardado${track ? ` (${track})` : ''}` });
      await load();
    } catch {
      setMessage({ type: 'error', text: 'Error al guardar bloque' });
    }
  }

  async function handleRemoveBlock(date: string, block: { track?: string }) {
    if (!teacherId) return;
    setMessage(null);

    try {
      const track = block.track || undefined;
      await services.scheduling.removeOverride(teacherId, date, track);
      setMessage({ type: 'success', text: 'Bloque eliminado' });
      await load();
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar bloque' });
    }
  }

  /* ── Batch save handler ─────────────────────────────────────── */

  async function handleBatchSave(blocksByDate: Record<string, BlockData[]>) {
    if (!teacherId || !availability) return;

    const entries = Object.entries(blocksByDate);
    const affectedDates = entries.map(([d]) => d);
    const payload: BatchOverrideEntry[] = [];

    for (const [date, unsaved] of entries) {
      const merged = mergeOverridesForBatch(availability.overrides, date, unsaved);
      payload.push(...merged);
    }

    try {
      await services.scheduling.batchSetOverrides(teacherId, payload);

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
          teacherId: teacherId!,
          date: entry.date + 'T00:00:00.000Z',
          isAvailable: entry.isAvailable,
          startTime: entry.startTime ?? null,
          endTime: entry.endTime ?? null,
          reason: null,
          track: entry.track ?? null,
        }));
        return { ...prev, overrides: [...filtered, ...synthetic] };
      });
      setMessage({ type: 'success', text: 'Cambios guardados' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar cambios',
      });
      throw err; // re-throw so CalendarGrid knows to keep unsavedBlocks
    }
  }

  function handleDismissFeedback() {
    setMessage(null);
  }

  /* ─── Loading state (first load only) ─── */

  if (loading && !availability) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-on-surface-variant">Cargando disponibilidad...</div>
      </div>
    );
  }

  /* ─── Derived feedback props for CalendarGrid ─── */

  const calendarError = message?.type === 'error' ? message.text : undefined;
  const calendarSuccess = message?.type === 'success' ? message.text : undefined;

  return (
    <div className="space-y-6">
      {/* ═══ CalendarGrid (PRIMARY VIEW) ═══ */}
      <CalendarGrid
        teacherId={teacherId ?? ''}
        availability={availability}
        loading={loading}
        saving={saving}
        error={calendarError}
        successMsg={calendarSuccess}
        onToggleDay={handleToggleDay}
        onSaveBlock={handleSaveBlock}
        onRemoveBlock={handleRemoveBlock}
        onDismissFeedback={handleDismissFeedback}
        onBatchSave={handleBatchSave}
      />

      {/* ═══ Weekly Template (COLLAPSIBLE — default collapsed) ═══ */}
      <Card accent>
        <button
          type="button"
          onClick={() => setWeeklyOpen((prev) => !prev)}
          className="w-full flex items-start justify-between gap-2 text-left cursor-pointer"
          aria-expanded={weeklyOpen}
        >
          <CardHeader
            title="Horario semanal base"
            subtitle="Define el patrón base de días y horarios de la semana"
          />
          <span
            className={`mt-2 shrink-0 text-on-surface-variant transition-transform ${
              weeklyOpen ? 'rotate-180' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">expand_more</span>
          </span>
        </button>

        {weeklyOpen && (
          <div className="space-y-2">
            {DAYS.map((day) => {
              const blocks = getBlocks(day.index);
              const isActive = blocks.length > 0;
              return (
                <div
                  key={day.index}
                  className={`p-3 rounded-lg transition-colors ${
                    isActive ? 'bg-primary-container/20' : 'bg-surface-container-low/50'
                  }`}
                >
                  {/* Day header row */}
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleDay(day.index)}
                      className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                        isActive ? 'bg-primary' : 'bg-outline/30'
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isActive ? 'translate-x-[18px]' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-medium w-20 ${isActive ? 'text-on-surface' : 'text-outline'}`}>
                      {day.label}
                    </span>
                  </div>

                  {/* Blocks */}
                  {isActive && (
                    <div className="mt-2 pl-12">
                      <ScheduleBlockEditor
                        teacherId={teacherId ?? ''}
                        dayIndex={day.index}
                        dayLabel={day.label}
                        blocks={blocks}
                        isSaving={saving}
                        onSave={saveBlock}
                        onRemove={removeBlock}
                        onAdd={addBlock}
                        onUpdate={updateBlock}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ═══ Double Session Toggle ═══ */}
      <Card>
        <CardHeader
          title="Doble sesión"
          subtitle="Permite reservas de 90 min (2 clases seguidas)"
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <button
            type="button"
            onClick={async () => {
              if (!teacherId) return;
              const next = !doubleSession;
              setDoubleSession(next);
              try {
                await services.teacher.updateTeacher(teacherId, { doubleSession: next });
                setMessage({ type: 'success', text: next ? 'Doble sesión activada' : 'Doble sesión desactivada' });
              } catch {
                setDoubleSession(!next);
                setMessage({ type: 'error', text: 'Error al guardar preferencia' });
              }
            }}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              doubleSession ? 'bg-primary' : 'bg-outline/30'
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                doubleSession ? 'translate-x-[22px]' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="text-sm text-on-surface-variant">
            {doubleSession ? 'Activado — alumnos pueden reservar bloques de 90 min' : 'Desactivado — solo reservas de 45 min'}
          </span>
        </label>
      </Card>

      {/* Status Message Toast */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            message.type === 'success' ? 'bg-primary text-white' : 'bg-error text-white'
          }`}
        >
          {message.text}
          <button type="button" onClick={() => setMessage(null)} className="ml-3 opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
