'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';

interface AnalyticsData {
  totalReservations: number;
  totalStudents: number;
  totalTeachers: number;
  completedRate: string;
  thisMonthReservations: number;
  weeklyData: number[];
}

export default function AdminAnalytics() {
  const { data, isLoading, error, refresh } = useData<AnalyticsData>(
    async () => {
      const [reservations, students, teachers] = await Promise.all([
        services.reservation.list({ limit: 1 }),
        services.student.list(1, 1),
        services.teacher.list(),
      ]);

      // Get this month's reservations count
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const allReservations = await services.reservation.list({ limit: 1000 });
      const thisMonth = allReservations.data.filter(
        (r) => new Date(r.startTime) >= startOfMonth,
      );
      const completed = allReservations.data.filter(
        (r) => r.status === 'completed',
      );
      const completedRate = allReservations.data.length > 0
        ? Math.round((completed.length / allReservations.data.length) * 100)
        : 0;

      // Weekly distribution (last 7 days)
      const weekDays = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      for (const r of allReservations.data) {
        const rDate = new Date(r.startTime);
        if (rDate >= weekAgo) {
          weekDays[rDate.getDay()]++;
        }
      }

      return {
        totalReservations: reservations.total,
        totalStudents: students.total,
        totalTeachers: teachers.length,
        completedRate: `${completedRate}%`,
        thisMonthReservations: thisMonth.length,
        weeklyData: weekDays,
      };
    },
    [],
  );

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {(stats) => (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <p className="text-body-sm text-on-surface-variant">Reservas totales</p>
              <p className="text-headline-md font-bold text-on-surface mt-1">{stats.totalReservations}</p>
            </Card>
            <Card>
              <p className="text-body-sm text-on-surface-variant">Este mes</p>
              <p className="text-headline-md font-bold text-on-surface mt-1">{stats.thisMonthReservations}</p>
            </Card>
            <Card>
              <p className="text-body-sm text-on-surface-variant">Alumnos</p>
              <p className="text-headline-md font-bold text-on-surface mt-1">{stats.totalStudents}</p>
            </Card>
            <Card>
              <p className="text-body-sm text-on-surface-variant">Completados</p>
              <p className="text-headline-md font-bold text-on-surface mt-1">{stats.completedRate}</p>
            </Card>
          </div>

          {/* Bar Chart — last 7 days */}
          <Card accent>
            <p className="text-body-sm text-on-surface-variant mb-4">Reservas últimos 7 días</p>
            <div className="flex items-end gap-2 h-32">
              {stats.weeklyData.map((val, i) => {
                const maxVal = Math.max(...stats.weeklyData, 1);
                const heightPct = (val / maxVal) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80"
                      style={{ height: `${Math.max(heightPct, val > 0 ? 8 : 0)}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                    <span className="text-label-caps text-on-surface-variant mt-2">
                      {['D', 'L', 'M', 'X', 'J', 'V', 'S'][i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </DataView>
  );
}
