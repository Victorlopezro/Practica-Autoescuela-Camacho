'use client';

import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { TeacherStatsDto, ReservationDto } from '@/services/interfaces';

interface DashboardData {
  stats: TeacherStatsDto;
  todayReservations: ReservationDto[];
}

const statusStyles: Record<string, string> = {
  completed: 'bg-surface-container text-on-surface-variant',
  confirmed: 'bg-primary-container text-primary font-semibold',
  pending: 'bg-tertiary-fixed text-tertiary',
};

const statusLabel: Record<string, string> = {
  completed: 'Completada',
  confirmed: 'Confirmada',
  pending: 'Pendiente',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getTodayDateString(): string {
  const d = new Date();
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${d.getDate()} de ${months[d.getMonth()]}`;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, refresh } = useData<DashboardData>(
    async () => {
      const [stats, reservations] = await Promise.all([
        services.teacher.getStats(user?.id ?? ''),
        services.reservation.list({ teacherId: user?.id }),
      ]);
      return {
        stats,
        todayReservations: reservations.data.filter(r => isToday(r.startTime)),
      };
    },
    [user?.id]
  );

  const todayCount = data?.todayReservations.length ?? 0;

  return (
    <DataView
      data={data}
      isLoading={isLoading}
      error={error}
      onRetry={refresh}
    >
      {(d) => (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-outline-variant/30 p-5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <p className="text-headline-md font-bold text-primary">{todayCount}</p>
              <p className="text-label-caps text-on-surface-variant mt-1">Clases hoy</p>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/30 p-5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <p className="text-headline-md font-bold text-secondary">{d.stats.completedReservations ?? 0}</p>
              <p className="text-label-caps text-on-surface-variant mt-1">Clases completadas</p>
            </div>
            <div className="bg-white rounded-xl border border-outline-variant/30 p-5 text-center shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
              <p className="text-headline-md font-bold text-tertiary">{d.stats.totalReservations ?? 0}</p>
              <p className="text-label-caps text-on-surface-variant mt-1">Total reservas</p>
            </div>
          </div>

          {/* Today's schedule */}
          <div className="bg-white rounded-xl border border-outline-variant/30 p-6 shadow-[0_2px_4px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">schedule</span>
              </div>
              <div>
                <h3 className="font-semibold text-on-surface">Clases de hoy</h3>
                <p className="text-body-sm text-on-surface-variant">{getTodayDateString()}</p>
              </div>
            </div>
            {d.todayReservations.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-on-surface-variant">
                No hay clases programadas para hoy
              </div>
            ) : (
              <div className="space-y-2">
                {d.todayReservations.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-primary w-12 text-body-base">{formatTime(r.startTime)}</span>
                      <div>
                        <p className="text-body-sm font-medium text-on-surface">Alumno</p>
                        <p className="text-body-sm text-on-surface-variant">{r.vehicleType === 'car' ? 'Práctica B' : 'Práctica A'} · {r.duration}min</p>
                      </div>
                    </div>
                    <span className={`text-label-caps px-3 py-1 rounded-full ${statusStyles[r.status] || ''}`}>
                      {statusLabel[r.status] ?? r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next class highlight */}
          {d.todayReservations
            .filter(r => r.status === 'confirmed' || r.status === 'pending')
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 1)
            .map(next => (
              <div key={next.id} className="bg-[#2b3f94] rounded-xl p-6 text-white shadow-md">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-[36px]">school</span>
                  <div>
                    <h3 className="font-semibold mb-1">Próxima clase: {formatTime(next.startTime)}</h3>
                    <p className="text-body-sm text-surface-container-high opacity-90">
                      Alumno — {next.vehicleType === 'car' ? 'Práctica B' : 'Práctica A'} — {next.duration}min
                    </p>
                    <div className="flex gap-3 mt-4">
                      <button className="px-4 py-2 bg-white text-[#2b3f94] rounded-lg text-label-caps font-bold hover:bg-surface-container transition-colors cursor-pointer">
                        VER DETALLES
                      </button>
                      <button className="px-4 py-2 border border-white/30 text-white rounded-lg text-label-caps font-bold hover:bg-white/10 transition-colors cursor-pointer">
                        NOTIFICAR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </DataView>
  );
}
