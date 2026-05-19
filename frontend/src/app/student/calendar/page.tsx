'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto } from '@/services/interfaces';

function getWeekDays(): { day: string; date: number }[] {
  const now = new Date();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return { day: dayNames[d.getDay()], date: d.getDate() };
  });
}

function getTodayDate(): string {
  const now = new Date();
  return `${now.getDate()} de ${['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][now.getMonth()]}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function getClassesForDay(reservations: ReservationDto[], dayDate: number): ReservationDto[] {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const targetDate = new Date(startOfWeek);
  targetDate.setDate(startOfWeek.getDate() + dayDate - startOfWeek.getDate());

  // Recalculate properly: match by day-of-month
  return reservations.filter((r) => {
    const rDate = new Date(r.startTime);
    return rDate.getDate() === dayDate
      && rDate.getMonth() === targetDate.getMonth()
      && rDate.getFullYear() === targetDate.getFullYear();
  });
}

function getTodayClasses(reservations: ReservationDto[]): ReservationDto[] {
  const now = new Date();
  return reservations.filter((r) => isSameDay(new Date(r.startTime), now));
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function StudentCalendar() {
  const { user } = useAuth();
  const { data: reservations, isLoading, error, refresh } = useData<ReservationDto[]>(
    async () => {
      const result = await services.reservation.list({ studentId: user?.studentId ?? undefined });
      return result.data;
    },
    [user?.studentId],
  );

  const weekDays = getWeekDays();
  const todayDate = getTodayDate();

  return (
    <DataView data={reservations} isLoading={isLoading} error={error} onRetry={refresh}>
      {(reservations) => {
        const todayClasses = getTodayClasses(reservations);
        return (
          <div className="space-y-6">
            {/* Week View */}
            <div className="bg-white rounded-xl p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-outline-variant/30">
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((d) => {
                  const dayClasses = getClassesForDay(reservations, d.date);
                  return (
                    <div key={d.date} className={`p-2 rounded-lg ${dayClasses.length > 0 ? 'bg-surface-container-high' : ''}`}>
                      <p className="text-label-caps text-on-surface-variant">{d.day}</p>
                      <p className={`text-sm font-bold ${dayClasses.length > 0 ? 'text-primary' : 'text-on-surface'}`}>{d.date}</p>
                      {dayClasses.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {dayClasses.map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today's Classes */}
            <Card accent>
              <CardHeader title="Clases de hoy" subtitle={todayDate} />
              {todayClasses.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant py-4 text-center">No tienes clases programadas hoy</p>
              ) : (
                todayClasses.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 py-3">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-bold text-primary w-12">{formatTime(c.startTime)}</span>
                      <div>
                        <p className="text-sm font-medium text-on-surface">Profesor {c.teacherId}</p>
                        <p className="text-xs text-on-surface-variant">{c.vehicleType} · {c.duration} min</p>
                      </div>
                    </div>
                    <span className={`text-label-caps px-2 py-1 rounded-full font-semibold ${
                      c.status === 'confirmed' ? 'bg-primary-container text-primary' :
                      c.status === 'completed' ? 'bg-surface-container text-on-surface-variant' :
                      'bg-surface-container-high text-tertiary'
                    }`}>
                      {c.status === 'confirmed' ? 'Confirmada' :
                       c.status === 'completed' ? 'Completada' : 'Pendiente'}
                    </span>
                  </div>
                ))
              )}
            </Card>
          </div>
        );
      }}
    </DataView>
  );
}
