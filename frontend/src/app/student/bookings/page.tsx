'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto } from '@/services/interfaces';

const statusStyles: Record<string, string> = {
  confirmed: 'bg-green-50 text-green-700',
  pending: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-surface-container text-on-surface-variant',
};

const statusLabel: Record<string, string> = {
  confirmed: 'Confirmada',
  pending: 'Pendiente',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function formatDate(iso: string): { day: string; month: string } {
  const d = new Date(iso);
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return { day: String(d.getDate()), month: months[d.getMonth()] };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getStatusColor(status: string): string {
  return statusStyles[status] ?? 'bg-surface-container text-on-surface-variant';
}

function getStatusLabel(status: string): string {
  return statusLabel[status] ?? status;
}

export default function StudentBookings() {
  const { user } = useAuth();
  const { data: result, isLoading, error, refresh } = useData<{ data: ReservationDto[]; total: number }>(
    () => services.reservation.list({ studentId: user?.id }),
    [user?.id]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Reservar
        </button>
      </div>

      <DataView
        data={result?.data ?? null}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
      >
        {(reservations) => (
          <>
            <Card accent>
              <CardHeader title="Próximas" subtitle="Clases programadas" />
              {reservations.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length === 0 ? (
                <div className="flex items-center justify-center p-8 text-on-surface-variant">
                  No hay clases próximas
                </div>
              ) : (
                reservations
                  .filter(r => r.status !== 'completed' && r.status !== 'cancelled')
                  .map(r => {
                    const { day, month } = formatDate(r.startTime);
                    return (
                      <div key={r.id} className="flex items-center justify-between py-3 border-b border-outline-variant/20 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-surface-container-high rounded-xl flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-primary">{day}</span>
                            <span className="text-[10px] text-secondary">{month}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{formatTime(r.startTime)}</p>
                            <p className="text-xs text-on-surface-variant">{r.vehicleType === 'car' ? 'Coche' : 'Moto'} · {r.duration}min</p>
                          </div>
                        </div>
                        <span className={`text-label-caps px-2 py-1 rounded-full ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                      </div>
                    );
                  })
              )}
            </Card>

            <Card>
              <CardHeader title="Historial" subtitle="Clases completadas" />
              {reservations.filter(r => r.status === 'completed').length === 0 ? (
                <div className="flex items-center justify-center p-8 text-on-surface-variant">
                  No hay clases completadas
                </div>
              ) : (
                reservations
                  .filter(r => r.status === 'completed')
                  .map(r => {
                    const { day, month } = formatDate(r.startTime);
                    return (
                      <div key={r.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-surface-container rounded-xl flex flex-col items-center justify-center">
                            <span className="text-sm font-bold text-on-surface-variant">{day}</span>
                            <span className="text-[10px] text-on-surface-variant/60">{month}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-on-surface">{formatTime(r.startTime)}</p>
                            <p className="text-xs text-on-surface-variant">{r.duration}min</p>
                          </div>
                        </div>
                        <span className={`text-label-caps px-2 py-1 rounded-full ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                      </div>
                    );
                  })
              )}
            </Card>
          </>
        )}
      </DataView>
    </div>
  );
}
