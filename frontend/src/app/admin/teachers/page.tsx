'use client';

import { useState } from 'react';
import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import { CreateTeacherModal, EditTeacherModal, DeleteTeacherModal } from '@/components/teachers';
import type { TeacherDto, TeacherStatsDto, TeacherWithUserDto } from '@/services/interfaces';

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

  const [createOpen, setCreateOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<TeacherWithUserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  async function handleEditClick(teacher: TeacherDto) {
    setLoadingEdit(true);
    try {
      const full = await services.teacher.getById(teacher.id);
      setEditTeacher(full);
    } catch {
      /* error handled silently */
    } finally {
      setLoadingEdit(false);
    }
  }

  function handleSuccess() {
    refresh();
  }

  return (
    <DataView data={teachers} isLoading={isLoading} error={error} onRetry={refresh}>
      {(teachers) => (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 min-h-[44px]"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Añadir
            </button>
          </div>
          <div className="space-y-3">
            {teachers.map((t) => (
              <Card key={t.id} accent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{t.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{emailFromName(t.name)}</p>
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
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(t)}
                      disabled={loadingEdit}
                      className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant disabled:opacity-50"
                      aria-label="Editar"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: t.id, name: t.name })}
                      className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-error"
                      aria-label="Eliminar"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <CreateTeacherModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSuccess={handleSuccess}
          />

          {editTeacher && (
            <EditTeacherModal
              open={!!editTeacher}
              onClose={() => setEditTeacher(null)}
              onSuccess={handleSuccess}
              teacher={editTeacher}
            />
          )}

          {deleteTarget && (
            <DeleteTeacherModal
              open={!!deleteTarget}
              onClose={() => setDeleteTarget(null)}
              onSuccess={handleSuccess}
              teacherName={deleteTarget.name}
              teacherId={deleteTarget.id}
            />
          )}
        </div>
      )}
    </DataView>
  );
}
