'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';

interface ProgressData {
  remainingClasses: number;
  totalReservations: number;
  completedReservations: number;
  pendingReservations: number;
}

export default function StudentProgress() {
  const { user } = useAuth();

  const { data, isLoading, error, refresh } = useData<ProgressData>(
    async () => {
      const reservations = await services.reservation.list({ studentId: user?.studentId ?? undefined });
      const totalReservations = reservations.data.length;
      const completedReservations = reservations.data.filter((r) => r.status === 'completed').length;
      const pendingReservations = reservations.data.filter((r) => r.status === 'pending' || r.status === 'confirmed').length;

      let remainingClasses = 0;
      try {
        const profile = await services.student.getProfile(user?.studentId ?? '');
        remainingClasses = profile.remainingClasses;
      } catch {
        // If getProfile fails, just use 0
      }

      return {
        remainingClasses,
        totalReservations,
        completedReservations,
        pendingReservations,
      };
    },
    [user?.studentId],
  );

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {(stats) => {
        const theoryPct = stats.completedReservations > 0
          ? Math.min(Math.round((stats.completedReservations / (stats.completedReservations + stats.pendingReservations + 1)) * 100), 100)
          : 0;

        return (
          <div className="space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center">
                <p className="text-display-lg-mobile font-bold text-primary">{stats.remainingClasses}</p>
                <p className="text-label-caps text-on-surface-variant mt-1">Clases restantes</p>
              </Card>
              <Card className="text-center">
                <p className="text-display-lg-mobile font-bold text-secondary">{stats.completedReservations}</p>
                <p className="text-label-caps text-on-surface-variant mt-1">Completadas</p>
              </Card>
            </div>

            {/* Detail breakdown */}
            <Card accent>
              <CardHeader title="Resumen" subtitle="Estado de tus reservas" />
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="text-on-surface">Clases realizadas</span>
                    <span className="font-medium text-secondary">{stats.completedReservations}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-1000"
                      style={{ width: `${stats.totalReservations > 0 ? (stats.completedReservations / stats.totalReservations) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="text-on-surface">Clases pendientes</span>
                    <span className="font-medium text-primary">{stats.pendingReservations}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-1000"
                      style={{ width: `${stats.totalReservations > 0 ? (stats.pendingReservations / stats.totalReservations) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="text-on-surface">Saldo de clases</span>
                    <span className="font-medium text-tertiary">{stats.remainingClasses}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tertiary rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min(stats.remainingClasses * 5, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        );
      }}
    </DataView>
  );
}
