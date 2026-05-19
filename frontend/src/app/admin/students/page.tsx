'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';

interface DisplayStudent {
  id: string;
  name: string;
  email: string;
  remainingClasses: number;
  status: string;
}

export default function AdminStudents() {
  const { data, isLoading, error, refresh } = useData(
    async (): Promise<DisplayStudent[]> => {
      const result = await services.student.list();
      return result.data.map((s) => {
        const displayName = s.user
          ? [s.user.name, s.user.lastName].filter(Boolean).join(' ') || s.user.username
          : 'Sin nombre';
        return {
          id: s.id,
          name: displayName,
          email: s.user?.email ?? '',
          remainingClasses: s.remainingClasses,
          status: s.remainingClasses > 0 ? 'Activo' : 'Sin clases',
        };
      });
    },
    [],
  );

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {(students) => (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Añadir
            </button>
          </div>
          <div className="space-y-3">
            {students.map((s) => (
              <Card key={s.id} accent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-on-surface">{s.name}</p>
                      <span
                        className={`text-label-caps px-2 py-0.5 rounded-full ${
                          s.status === 'Activo'
                            ? 'bg-primary-container text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{s.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-label-caps text-on-surface-variant">
                        {s.remainingClasses} clases restantes
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </DataView>
  );
}
