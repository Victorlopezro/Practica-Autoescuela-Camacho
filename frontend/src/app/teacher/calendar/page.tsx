'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { CalendarReservationDto } from '@/services/interfaces';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function getFullStudentName(s: CalendarReservationDto['student']): string {
  if (!s) return 'Alumno';
  return `${s.name ?? ''} ${s.lastName ?? ''}`.trim() || s.username;
}

const statusStyles: Record<string, string> = {
  confirmed: 'bg-primary-container text-primary font-semibold',
  pending: 'bg-tertiary-fixed text-tertiary',
  completed: 'bg-surface-container text-on-surface-variant',
  cancelled: 'bg-surface-container-low text-on-surface-variant/60 line-through',
};

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export default function TeacherCalendar() {
  const { user } = useAuth();
  const teacherId = user?.teacherId;
  const today = useMemo(() => new Date(), []);

  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toISOString().split('T')[0];
  }, [currentMonth, currentYear]);

  const monthEnd = useMemo(() => {
    const d = new Date(currentYear, currentMonth + 1, 0);
    return d.toISOString().split('T')[0];
  }, [currentMonth, currentYear]);

  const { data: reservations, isLoading, error, refresh } = useData<CalendarReservationDto[]>(
    async () => {
      if (!teacherId) return [];
      return services.reservation.getCalendar({
        teacherId,
        from: monthStart,
        to: monthEnd,
      });
    },
    [teacherId, monthStart, monthEnd],
  );

  // Build month calendar grid
  const calendarCells = useMemo(() => {
    const firstDow = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: Array<{ type: 'empty' } | { type: 'day'; day: number; date: string; isToday: boolean }> = [];

    // Pad to Monday (dow === 0 → 6 padding, dow === 1 → 0, dow === 2 → 1, ...)
    const padding = firstDow === 0 ? 6 : firstDow - 1;
    for (let i = 0; i < padding; i++) {
      cells.push({ type: 'empty' });
    }

    const todayStr = today.toISOString().split('T')[0];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ type: 'day', day: d, date: dateStr, isToday: dateStr === todayStr });
    }
    return cells;
  }, [currentMonth, currentYear, today]);

  // Group into weeks
  const gridRows = useMemo(() => {
    const rows: typeof calendarCells[] = [];
    for (let i = 0; i < calendarCells.length; i += 7) {
      rows.push(calendarCells.slice(i, i + 7));
    }
    return rows;
  }, [calendarCells]);

  // Build a map of date → reservations for quick lookup
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, CalendarReservationDto[]>();
    if (reservations) {
      for (const r of reservations) {
        const date = new Date(r.startTime).toISOString().split('T')[0];
        if (!map.has(date)) map.set(date, []);
        map.get(date)!.push(r);
      }
    }
    return map;
  }, [reservations]);

  const selectedDayReservations = selectedDate ? reservationsByDate.get(selectedDate) ?? [] : [];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
    setSelectedDate(null);
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-title-md font-bold text-on-surface capitalize">{monthName}</h2>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={() => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); setSelectedDate(null); }}
            className="px-2 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card accent>
        <CardHeader title="Calendario" subtitle="Tus clases del mes" />
        <DataView
          data={reservations ?? []}
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
          loadingComponent={
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map(n => <div key={n} className="text-center text-label-caps text-on-surface-variant py-1">{n}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-surface-container-low rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          {() => (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map(n => (
                  <div key={n} className="text-center text-label-caps text-on-surface-variant py-1">{n}</div>
                ))}
              </div>
              {gridRows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 gap-1">
                  {row.map((cell, ci) =>
                    cell.type === 'empty' ? (
                      <div key={`e-${ri}-${ci}`} />
                    ) : (
                      <button key={cell.date}
                        onClick={() => setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-colors relative cursor-pointer ${
                          cell.date === selectedDate
                            ? 'bg-primary text-white'
                            : 'hover:bg-surface-container-low text-on-surface'
                        }`}
                      >
                        <span className={`text-xs sm:text-sm font-medium ${
                          cell.isToday && cell.date !== selectedDate ? 'text-primary' :
                          cell.date === selectedDate ? 'text-white' : ''
                        }`}>
                          {cell.day}
                        </span>
                        {reservationsByDate.has(cell.date) && cell.date !== selectedDate && (
                          <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
                        )}
                        {cell.isToday && cell.date !== selectedDate && (
                          <span className="absolute inset-0 border border-primary/40 rounded-lg pointer-events-none" />
                        )}
                      </button>
                    )
                  )}
                </div>
              ))}
            </>
          )}
        </DataView>
      </Card>

      {/* Selected day details */}
      {selectedDate && (
        <Card>
          <CardHeader
            title={new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            subtitle={`${selectedDayReservations.length} clase${selectedDayReservations.length !== 1 ? 's' : ''}`}
          />
          {selectedDayReservations.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant text-center py-8">No hay clases este día</p>
          ) : (
            <div className="space-y-2">
              {selectedDayReservations
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-2 p-3 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-primary-container rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{formatTime(r.startTime)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {getFullStudentName(r.student)}
                        </p>
                        <p className="text-xs text-on-surface-variant truncate">
                          {r.vehicleType} · {r.duration} min
                        </p>
                      </div>
                    </div>
                    <span className={`text-label-caps px-2 py-1 rounded-full flex-shrink-0 ${statusStyles[r.status] ?? ''}`}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
