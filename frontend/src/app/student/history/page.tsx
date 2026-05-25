'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto } from '@/services/interfaces';

function formatDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return { day: String(d.getDate()), month: months[d.getMonth()] };
}

function formatTime(iso: string): string {
  // Times come from the backend as UTC ISO strings — extract HH:mm directly to avoid timezone offset.
  return iso.substring(11, 16);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function StudentHistory() {
  const { user } = useAuth();
  const { data: result, isLoading, error, refresh } = useData<{ data: ReservationDto[]; total: number }>(
    () => services.reservation.list({ studentId: user?.id }),
    [user?.id]
  );

  const completedOnly = result?.data?.filter(r => r.status === 'completed') ?? null;

  return (
    <DataView
      data={completedOnly}
      isLoading={isLoading}
      error={error}
      onRetry={refresh}
      emptyComponent={
        <div className="space-y-4">
          <p className="text-center text-on-surface-variant py-8">No hay clases completadas aún</p>
        </div>
      }
    >
      {(reservations) => (
        <div className="space-y-4">
          {reservations.map(r => {
            const { day, month } = formatDate(r.startTime);
            return (
              <Card key={r.id}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-container rounded-xl flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-on-surface-variant">{day}</span>
                    <span className="text-[10px] text-on-surface-variant/60">{month}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface">{formatTime(r.startTime)} · Instructor</p>
                    <p className="text-xs text-on-surface-variant">{r.vehicleType === 'car' ? 'Práctica B' : 'Práctica A'} · {formatDuration(r.duration)}</p>
                  </div>
                  <div className="flex items-center gap-1 text-green-700">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span className="text-label-caps">Completada</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DataView>
  );
}
