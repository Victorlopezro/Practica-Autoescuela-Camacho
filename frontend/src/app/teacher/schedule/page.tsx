'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { useAuth } from '@/hooks/useAuth';
import { services } from '@/services';
import type { OverrideDto } from '@/services/interfaces';

const DAYS = [
  { index: 0, label: 'Domingo' },
  { index: 1, label: 'Lunes' },
  { index: 2, label: 'Martes' },
  { index: 3, label: 'Miércoles' },
  { index: 4, label: 'Jueves' },
  { index: 5, label: 'Viernes' },
  { index: 6, label: 'Sábado' },
];

const TRACK_OPTIONS = [
  { value: '', label: 'General' },
  { value: 'pista', label: 'Pista (30 min)' },
  { value: 'circulacion', label: 'Circulación (45 min)' },
] as const;

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

  const [blocksByDay, setBlocksByDay] = useState<Record<number, BlockEntry[]>>({});
  const [doubleSession, setDoubleSession] = useState(false);
  const [overrides, setOverrides] = useState<OverrideDto[]>([]);
  const [newOverrideDate, setNewOverrideDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

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
      setBlocksByDay(grouped);
      setDoubleSession(data.doubleSession);
      setOverrides(data.overrides);
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar disponibilidad' });
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  /* ─── Block helpers ─── */

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

  /* ─── Day toggle ─── */

  const toggleDay = (dayIndex: number) => {
    const blocks = getBlocks(dayIndex);
    if (blocks.length > 0) {
      // Remove all blocks — fire API calls for saved ones
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

  /* ─── Block save ─── */

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

  /* ─── Block remove (individual) ─── */

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

  /* ─── Add block ─── */

  const addBlock = (dayIndex: number) => {
    const blocks = getBlocks(dayIndex);
    if (blocks.length >= 2) return;

    // Auto-select the opposite track if one is already set
    const existingTracks = new Set(blocks.map((b) => b.track));
    const defaultTrack = existingTracks.has('pista') ? 'circulacion' : existingTracks.has('circulacion') ? 'pista' : '';

    setBlocks(dayIndex, [...blocks, { id: uid(), start: '08:00', end: '14:00', track: defaultTrack, saved: false }]);
  };

  /* ─── Overrides ─── */

  const removeOverride = async (date: string) => {
    if (!teacherId) return;
    try {
      await services.scheduling.removeOverride(teacherId, date);
      setOverrides((prev) => prev.filter((o) => o.date !== date));
      setMessage({ type: 'success', text: 'Excepción eliminada' });
    } catch {
      setMessage({ type: 'error', text: 'Error al eliminar excepción' });
    }
  };

  const addOverride = async () => {
    if (!teacherId || !newOverrideDate) return;
    try {
      await services.scheduling.setOverride(teacherId, newOverrideDate, false);
      setOverrides((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          teacherId,
          date: newOverrideDate,
          isAvailable: false,
          startTime: null,
          endTime: null,
          reason: null,
        },
      ]);
      setNewOverrideDate('');
      setMessage({ type: 'success', text: 'Excepción añadida (no disponible)' });
    } catch {
      setMessage({ type: 'error', text: 'Error al añadir excepción' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse text-on-surface-variant">Cargando disponibilidad...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <Card accent>
        <CardHeader title="Horario semanal" subtitle="Configura los días y horarios en que das clase" />
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
                  <div className="mt-2 space-y-2 pl-12">
                    {blocks.map((block) => (
                      <div key={block.id} className="flex items-center gap-2 flex-wrap">
                        <select
                          value={block.track}
                          onChange={(e) => updateBlock(day.index, block.id, 'track', e.target.value)}
                          className="px-2 py-1 text-xs border border-outline-variant/50 rounded-lg bg-white text-on-surface w-auto"
                        >
                          {TRACK_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <input
                          type="time"
                          value={block.start}
                          onChange={(e) => updateBlock(day.index, block.id, 'start', e.target.value)}
                          className="flex-1 min-w-[100px] px-2 py-1 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
                        />
                        <span className="text-outline text-sm flex-shrink-0">a</span>
                        <input
                          type="time"
                          value={block.end}
                          onChange={(e) => updateBlock(day.index, block.id, 'end', e.target.value)}
                          className="flex-1 min-w-[100px] px-2 py-1 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
                        />
                        <button
                          onClick={() => saveBlock(day.index, block)}
                          disabled={saving}
                          className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {saving ? '...' : 'Guardar'}
                        </button>
                        <button
                          onClick={() => removeBlock(day.index, block)}
                          className="flex-shrink-0 p-1 text-error hover:text-error/80 transition-colors text-sm"
                          title="Eliminar bloque"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {blocks.length < 2 && (
                      <button
                        onClick={() => addBlock(day.index)}
                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        + Añadir bloque
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Double Session Toggle */}
      <Card>
        <CardHeader
          title="Doble sesión"
          subtitle="Permite reservas de 90 min (2 clases seguidas)"
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <button
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

      {/* Date Overrides */}
      <Card>
        <CardHeader title="Excepciones" subtitle="Días específicos sin disponibilidad (festivos, etc.)" />
        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={newOverrideDate}
            onChange={(e) => setNewOverrideDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
          />
          <button
            onClick={addOverride}
            disabled={!newOverrideDate}
            className="px-4 py-2 text-sm font-medium bg-error/10 text-error rounded-lg hover:bg-error/20 disabled:opacity-50 transition-colors"
          >
            Marcar no disponible
          </button>
        </div>
        {overrides.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant text-center py-3">No hay excepciones registradas</p>
        ) : (
          <div className="space-y-2">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg">
                <div>
                  <span className="text-sm font-medium text-on-surface">
                    {new Date(o.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-xs text-on-surface-variant ml-2">
                    {o.isAvailable ? 'Disponible (horario especial)' : 'No disponible'}
                  </span>
                </div>
                <button
                  onClick={() => removeOverride(o.date)}
                  className="text-error hover:text-error/80 text-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Status Message */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
            message.type === 'success' ? 'bg-primary text-white' : 'bg-error text-white'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}
    </div>
  );
}
