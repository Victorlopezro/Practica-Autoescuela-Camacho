'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { TeacherDto, TeacherStatsDto } from '@/services/interfaces';

interface TeacherWithStats extends TeacherDto {
  stats: TeacherStatsDto;
}

function emailFromName(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@autoescuela.com`;
}

export default function AdminTeachers() {
  const { data: teachers, isLoading, error, refresh } = useData<TeacherWithStats[]>(
    async () => {
      const list = await services.teacher.list();
      const stats = await Promise.all(list.map((t) => services.teacher.getStats(t.id)));
      return list.map((t, i) => ({ ...t, stats: stats[i] }));
    },
    [],
  );

  return (
    <DataView data={teachers} isLoading={isLoading} error={error} onRetry={refresh}>
      {(teachers) => (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Añadir
            </button>
          </div>
          <div className="space-y-3">
            {teachers.map((t) => (
              <Card key={t.id} accent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface">{t.name}</p>
                    <p className="text-xs text-on-surface-variant">{emailFromName(t.name)}</p>
                    <div className="flex gap-4 mt-1.5">
                      <span className="text-label-caps text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">group</span>
                        {t.stats.completedReservations ?? 0} alumnos
                      </span>
                      <span className="text-label-caps text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        {'—'}
                      </span>
                      <span className="text-label-caps text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                        {t.stats.totalReservations ?? 0} clases
                      </span>
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
