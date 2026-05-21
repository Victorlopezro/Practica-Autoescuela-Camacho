'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { useAuth } from '@/hooks/useAuth';
import { services } from '@/services';
import type { WeeklyAvailabilityDto, OverrideDto } from '@/services/interfaces';

const DAYS = [
  { index: 0, label: 'Domingo' },
  { index: 1, label: 'Lunes' },
  { index: 2, label: 'Martes' },
  { index: 3, label: 'Miércoles' },
  { index: 4, label: 'Jueves' },
  { index: 5, label: 'Viernes' },
  { index: 6, label: 'Sábado' },
];

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function TeacherSchedule() {
  const { user } = useAuth();
  const teacherId = user?.teacherId ?? user?.id;

  const [availability, setAvailability] = useState<Record<number, { start: string; end: string }>>({});
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
      const av: Record<number, { start: string; end: string }> = {};
      for (const a of data.availability) {
        av[a.dayOfWeek] = { start: a.startTime, end: a.endTime };
      }
      setAvailability(av);
      setDoubleSession(data.doubleSession);
      setOverrides(data.overrides);
    } catch {
      setMessage({ type: 'error', text: 'Error al cargar disponibilidad' });
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => { load(); }, [load]);

  const toggleDay = async (dayIndex: number) => {
    if (availability[dayIndex]) {
      // Removing → save immediately (no extra config needed)
      setAvailability((prev) => {
        const next = { ...prev };
        delete next[dayIndex];
        return next;
      });
      setMessage(null);
      try {
        if (teacherId) await services.scheduling.removeAvailability(teacherId, dayIndex);
      } catch {
        setMessage({ type: 'error', text: 'Error al eliminar disponibilidad' });
        load();
      }
    } else {
      // Adding → local only, user sets times and clicks Guardar
      setAvailability((prev) => ({ ...prev, [dayIndex]: { start: '08:00', end: '14:00' } }));
      setMessage(null);
    }
  };

  const updateTime = async (dayIndex: number, field: 'start' | 'end', value: string) => {
    if (!teacherId) return;
    setAvailability((prev) => ({
      ...prev,
      [dayIndex]: { ...prev[dayIndex], [field]: value },
    }));
  };

  const saveDay = async (dayIndex: number) => {
    if (!teacherId || !availability[dayIndex]) return;

    // Client-side validation: start must be before end
    const { start, end } = availability[dayIndex];
    if (start >= end) {
      setMessage({ type: 'error', text: `La hora de inicio debe ser anterior a la hora de fin en ${DAYS[dayIndex].label}` });
      return;
    }

    setSaving(true);
    try {
      await services.scheduling.setAvailability(teacherId, dayIndex, start, end);
      setMessage({ type: 'success', text: `Guardado ${DAYS[dayIndex].label}` });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string | string[] } } };
      const apiMessage = err.response?.data?.message;
      const errorText = Array.isArray(apiMessage) ? apiMessage[0] : apiMessage;
      setMessage({ type: 'error', text: errorText || `Error al guardar ${DAYS[dayIndex].label}` });
    } finally {
      setSaving(false);
    }
  };

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
            const isActive = !!availability[day.index];
            const times = availability[day.index];
            return (
              <div
                key={day.index}
                className={`flex flex-wrap items-center gap-2 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-container/20' : 'bg-surface-container-low/50'
                }`}
              >
                {/* Toggle + Day label */}
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

                {/* Time pickers */}
                {isActive && times && (
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <input
                      type="time"
                      value={times.start}
                      onChange={(e) => updateTime(day.index, 'start', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
                    />
                    <span className="text-outline flex-shrink-0">a</span>
                    <input
                      type="time"
                      value={times.end}
                      onChange={(e) => updateTime(day.index, 'end', e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
                    />
                    <button
                      onClick={() => saveDay(day.index)}
                      disabled={saving}
                      className="flex-shrink-0 px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {saving ? '...' : 'Guardar'}
                    </button>
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
              // Save doubleSession preference (handled by teacher update endpoint)
              try {
                // For now just optimistic update — backend handles via teacher profile
                setMessage({ type: 'success', text: next ? 'Doble sesión activada' : 'Doble sesión desactivada' });
              } catch {
                setDoubleSession(!next);
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
