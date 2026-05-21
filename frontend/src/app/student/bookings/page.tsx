'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  const studentId = user?.studentId;
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: result, isLoading, error, refresh } = useData<{ data: ReservationDto[]; total: number }>(
    () => services.reservation.list({ studentId: studentId ?? undefined }),
    [studentId]
  );

  const { data: balance, refresh: refreshBalance } = useData<Pick<import('@/services/interfaces').StudentDto, 'remainingClasses' | 'balanceHistory'>>(
    async () => {
      if (!studentId) return { remainingClasses: 0, balanceHistory: [] } as Pick<import('@/services/interfaces').StudentDto, 'remainingClasses' | 'balanceHistory'>;
      return services.student.getBalance(studentId);
    },
    [studentId],
  );

  const handleCancel = async (reservationId: string) => {
    if (!window.confirm('¿Estás seguro de cancelar esta clase?')) return;
    setCancellingId(reservationId);
    setCancelError(null);
    try {
      await services.reservation.cancel(reservationId);
      refresh();
      refreshBalance();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with remaining classes */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title-lg font-bold text-on-surface">Mis reservas</h1>
          {balance && (
            <p className="text-body-sm text-on-surface-variant mt-1">
              <span className="font-semibold text-primary">{balance.remainingClasses}</span> clases restantes
            </p>
          )}
        </div>
        <Link
          href="/student/calendar"
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Reservar
        </Link>
      </div>

      {cancelError && (
        <div className="p-3 bg-error-container text-error rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {cancelError}
        </div>
      )}

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
                        <div className="flex items-center gap-2">
                          <span className={`text-label-caps px-2 py-1 rounded-full ${getStatusColor(r.status)}`}>{getStatusLabel(r.status)}</span>
                          <button
                            onClick={() => handleCancel(r.id)}
                            disabled={cancellingId === r.id}
                            className="text-xs text-error hover:text-error/80 disabled:opacity-50 p-1 cursor-pointer"
                            title="Cancelar clase"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {cancellingId === r.id ? 'hourglass_top' : 'close'}
                            </span>
                          </button>
                        </div>
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
