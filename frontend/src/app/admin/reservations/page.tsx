'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto } from '@/services/interfaces';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  confirmed: 'bg-green-50 text-green-700',
  completed: 'bg-surface-container text-on-surface-variant',
  cancelled: 'bg-error-container/30 text-error',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export default function AdminReservations() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, isLoading, error, refresh } = useData<{ data: ReservationDto[]; total: number }>(
    () => services.reservation.list({ status: statusFilter || undefined, limit: 50 }),
    [statusFilter],
  );

  async function handleCancel(reservationId: string) {
    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      setCancelError('El motivo debe tener al menos 3 caracteres');
      return;
    }
    setCancellingId(reservationId);
    setCancelError(null);
    try {
      await services.reservation.cancelAsAdmin(reservationId, cancelReason.trim());
      setCancelReason('');
      refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Error al cancelar');
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-on-surface-variant">Filtrar:</span>
        {['', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setCancelError(null); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {s === '' ? 'Todas' : statusLabel[s] ?? s}
          </button>
        ))}
      </div>

      {cancelError && (
        <div className="p-3 bg-error-container text-error rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {cancelError}
        </div>
      )}

      <DataView
        data={data?.data ?? null}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
      >
        {(reservations) => (
          <div className="space-y-3">
            {reservations.map((r) => (
              <Card key={r.id} accent>
                <div className="flex items-center gap-4">
                  {/* Date block */}
                  <div className="w-14 h-14 bg-surface-container-high rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">
                      {new Date(r.startTime).getDate()}
                    </span>
                    <span className="text-[10px] text-secondary">
                      {new Date(r.startTime).toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-on-surface truncate">
                        {formatDate(r.startTime)}
                      </p>
                      <span className={`text-label-caps px-2 py-0.5 rounded-full shrink-0 ${statusStyles[r.status] ?? ''}`}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {formatTime(r.startTime)} · {r.vehicleType === 'car' ? 'Coche' : 'Moto'} · {r.duration}min
                      {r.cancellationReason && r.status === 'cancelled' && (
                        <> · <span className="text-error">Motivo: {r.cancellationReason}</span></>
                      )}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      Alumno ID: {r.studentId} · Profesor ID: {r.teacherId}
                    </p>
                  </div>

                  {/* Actions */}
                  {(r.status === 'pending' || r.status === 'confirmed') && (
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <input
                        type="text"
                        value={cancellingId === r.id ? cancelReason : ''}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Motivo de cancelación"
                        className="w-48 px-2 py-1.5 text-xs border border-outline-variant/50 rounded-lg bg-white text-on-surface"
                        onFocus={() => { setCancellingId(r.id); setCancelReason(''); }}
                      />
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={cancellingId === r.id && (!cancelReason.trim() || cancelReason.trim().length < 3)}
                        className="text-xs px-3 py-1.5 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {cancellingId === r.id ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </DataView>
    </div>
  );
}
