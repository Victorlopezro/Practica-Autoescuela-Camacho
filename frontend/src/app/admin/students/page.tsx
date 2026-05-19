'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';

/**
 * BACKLOG: El backend no tiene un endpoint para listar alumnos.
 * Cuando esté disponible, reemplazar el fetcher con:
 *
 *   import { services } from '@/services';
 *   const { data, isLoading, error, refresh } = useData(
 *     () => services.student.list(),  // requires IStudentService.list() first
 *     []
 *   );
 *
 * Por ahora se muestran datos mock mientras se expande el backend.
 */

const mockStudents = [
  { name: 'Juan Pérez', email: 'juan@example.com', progress: 55, status: 'Activo' },
  { name: 'María García', email: 'maria@example.com', progress: 78, status: 'Activo' },
  { name: 'Pedro López', email: 'pedro@example.com', progress: 30, status: 'Inactivo' },
  { name: 'Ana Martínez', email: 'ana@example.com', progress: 90, status: 'Activo' },
];

export default function AdminStudents() {
  const { data, isLoading, error, refresh } = useData(
    async () => mockStudents,
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
              <Card key={s.email} accent>
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
                      <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                      </div>
                      <span className="text-label-caps text-on-surface-variant">{s.progress}%</span>
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
