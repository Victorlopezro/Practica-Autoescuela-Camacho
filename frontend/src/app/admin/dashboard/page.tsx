'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';

interface DashboardStats {
  studentCount: number;
  teacherCount: number;
  vehicleCount: number;
  todayClasses: number;
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

const activity = [
  { action: 'Nuevo alumno', user: 'Lucía Fernández', time: 'Hace 2h', icon: 'person_add' },
  { action: 'Clase completada', user: 'Carlos M. → Juan P.', time: 'Hace 1h', icon: 'check_circle' },
  { action: 'Pago recibido', user: 'María García - 150€', time: 'Hace 3h', icon: 'payments' },
  { action: 'Cancelación', user: 'Pedro L. - 11:00', time: 'Hace 30min', icon: 'cancel' },
];

export default function AdminDashboard() {
  const { data: stats, isLoading, error, refresh } = useData<DashboardStats>(
    async () => {
      const [teachers, vehicles, reservations] = await Promise.all([
        services.teacher.list(),
        services.vehicle.list(),
        services.reservation.list(),
      ] as const);
      return {
        // PENDING: no student list endpoint exists; keep placeholder until added
        studentCount: 47,
        teacherCount: teachers.length,
        vehicleCount: vehicles.total,
        todayClasses: reservations.data.filter((r) => isToday(r.startTime)).length,
      };
    },
    [],
  );

  return (
    <DataView data={stats} isLoading={isLoading} error={error} onRetry={refresh}>
      {(s) => (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Alumnos activos', value: String(s.studentCount), color: 'text-primary' },
              { label: 'Profesores', value: String(s.teacherCount), color: 'text-secondary' },
              { label: 'Vehículos', value: String(s.vehicleCount), color: 'text-tertiary' },
              { label: 'Clases hoy', value: String(s.todayClasses), color: 'text-[#1b7a3e]' },
            ].map((item) => (
              <Card key={item.label} className="text-center">
                <p className={`text-headline-md font-bold ${item.color}`}>{item.value}</p>
                <p className="text-label-caps text-on-surface-variant mt-1">{item.label}</p>
              </Card>
            ))}
          </div>

          {/* Activity Feed */}
          <Card accent>
            <CardHeader title="Actividad reciente" />
            <div className="space-y-1">
              {activity.map((a) => (
                <div
                  key={a.action + a.user}
                  className="flex items-center gap-3 py-3 border-b border-outline-variant/20 last:border-0"
                >
                  <div className="w-9 h-9 bg-surface-container rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">{a.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium text-on-surface">{a.action}</p>
                    <p className="text-body-sm text-on-surface-variant">{a.user}</p>
                  </div>
                  <span className="text-body-sm text-on-surface-variant/60">{a.time}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#2b3f94] rounded-xl p-6 text-white shadow-md flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[32px] mb-3">person_add</span>
              <h3 className="font-semibold mb-1">Nuevo Alumno</h3>
              <p className="text-body-sm text-surface-container-high opacity-80">Registrar un nuevo alumno en el sistema</p>
            </div>
            <div className="bg-primary rounded-xl p-6 text-white shadow-md flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[32px] mb-3">assignment_add</span>
              <h3 className="font-semibold mb-1">Nueva Clase</h3>
              <p className="text-body-sm text-white/80 opacity-80">Programar una clase para un alumno</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-outline-variant/30 shadow-sm flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-[32px] mb-3 text-primary">description</span>
              <h3 className="font-semibold text-on-surface mb-1">Reportes</h3>
              <p className="text-body-sm text-on-surface-variant">Generar informes de rendimiento</p>
            </div>
          </div>
        </div>
      )}
    </DataView>
  );
}
