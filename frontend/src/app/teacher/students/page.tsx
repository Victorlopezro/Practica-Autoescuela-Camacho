'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { ReservationDto, StudentWithUserDto } from '@/services/interfaces';

interface TeacherStudent {
  id: string;
  name: string;
  email: string;
  remainingClasses: number;
  totalReservations: number;
  nextClass: string | null;
}

function findNextReservation(reservations: ReservationDto[]): string | null {
  const now = new Date();
  const upcoming = reservations
    .filter((r) => new Date(r.startTime) > now && r.status !== 'cancelled')
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return upcoming.length > 0
    ? new Date(upcoming[0].startTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : null;
}

export default function TeacherStudents() {
  const { user } = useAuth();

  const { data, isLoading, error, refresh } = useData<TeacherStudent[]>(
    async () => {
      const [reservations, studentsResult] = await Promise.all([
        services.reservation.list({ teacherId: user?.teacherId ?? undefined }),
        services.student.list(1, 200),
      ]);

      const studentMap = new Map<string, StudentWithUserDto>();
      for (const s of studentsResult.data) {
        studentMap.set(s.id, s);
      }

      // Group reservations by student
      const studentReservations = new Map<string, ReservationDto[]>();
      for (const r of reservations.data) {
        const existing = studentReservations.get(r.studentId) ?? [];
        existing.push(r);
        studentReservations.set(r.studentId, existing);
      }

      return Array.from(studentReservations.entries()).map(([studentId, studentReservations]) => {
        const studentProfile = studentMap.get(studentId);
        const displayName = studentProfile?.user
          ? [studentProfile.user.name, studentProfile.user.lastName].filter(Boolean).join(' ') || studentProfile.user.username
          : studentId;

        return {
          id: studentId,
          name: displayName,
          email: studentProfile?.user?.email ?? '',
          remainingClasses: studentProfile?.remainingClasses ?? 0,
          totalReservations: studentReservations.length,
          nextClass: findNextReservation(studentReservations),
        };
      });
    },
    [user?.teacherId],
  );

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {(students) => (
        <div className="space-y-3">
          {students.length === 0 ? (
            <div className="bg-surface-container-low rounded-xl p-6 text-center">
              <p className="text-body-sm text-on-surface-variant">No tienes alumnos asignados todavía</p>
            </div>
          ) : (
            students.map((s) => (
              <Card key={s.id} accent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-on-surface">{s.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {s.totalReservations} reservas · {s.remainingClasses} clases restantes
                          {s.nextClass ? ` · Próxima: ${s.nextClass}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </DataView>
  );
}
