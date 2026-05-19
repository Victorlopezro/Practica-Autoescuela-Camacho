'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto } from '@/services/interfaces';

function getDayNumbers(): number[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

function getMonthName(): string {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
}

function getReservationDays(reservations: ReservationDto[]): Set<number> {
  const days = new Set<number>();
  for (const r of reservations) {
    const d = new Date(r.startTime);
    days.add(d.getDate());
  }
  return days;
}

export default function TeacherCalendar() {
  const { user } = useAuth();
  const { data: reservations, isLoading, error, refresh } = useData<ReservationDto[]>(
    async () => {
      const result = await services.reservation.list({ teacherId: user?.id });
      return result.data;
    },
    [user?.id]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title={getMonthName()} />
        <DataView
          data={reservations}
          isLoading={isLoading}
          error={error}
          onRetry={refresh}
          loadingComponent={
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                <div key={d} className="text-on-surface-variant font-medium py-1">{d}</div>
              ))}
              {getDayNumbers().map(day => (
                <div key={day} className="py-2 rounded-lg text-on-surface hover:bg-surface-container-low animate-pulse">
                  {day}
                </div>
              ))}
            </div>
          }
        >
          {(res) => {
            const reservationDays = getReservationDays(res);
            return (
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
                  <div key={d} className="text-on-surface-variant font-medium py-1">{d}</div>
                ))}
                {getDayNumbers().map(day => {
                  const hasClass = reservationDays.has(day);
                  return (
                    <div
                      key={day}
                      className={`py-2 rounded-lg transition-colors ${
                        hasClass
                          ? 'bg-surface-container-high text-primary font-bold'
                          : 'text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            );
          }}
        </DataView>
      </Card>
    </div>
  );
}
