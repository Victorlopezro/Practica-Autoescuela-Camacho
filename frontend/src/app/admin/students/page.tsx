'use client';

import { useState } from 'react';
import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import { CreateStudentModal, EditStudentModal, DeleteStudentModal } from '@/components/students';
import type { StudentWithUserDto } from '@/services/interfaces';

interface DisplayStudent {
  id: string;
  name: string;
  email: string;
  remainingClasses: number;
  status: string;
  raw: StudentWithUserDto;
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
          raw: s,
        };
      });
    },
    [],
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentWithUserDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  function handleSuccess() {
    refresh();
  }

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {(students) => (
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
            {students.map((s) => (
              <Card key={s.id} accent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium text-on-surface truncate">{s.name}</p>
                      <span
                        className={`text-label-caps px-2 py-0.5 rounded-full shrink-0 ${
                          s.status === 'Activo'
                            ? 'bg-primary-container text-primary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">{s.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-label-caps text-on-surface-variant">
                        {s.remainingClasses} clases restantes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditStudent(s.raw)}
                      className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant"
                      aria-label="Editar"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
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

          <CreateStudentModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSuccess={handleSuccess}
          />

          {editStudent && (
            <EditStudentModal
              open={!!editStudent}
              onClose={() => setEditStudent(null)}
              onSuccess={handleSuccess}
              student={editStudent}
            />
          )}

          {deleteTarget && (
            <DeleteStudentModal
              open={!!deleteTarget}
              onClose={() => setDeleteTarget(null)}
              onSuccess={handleSuccess}
              studentName={deleteTarget.name}
              studentId={deleteTarget.id}
            />
          )}
        </div>
      )}
    </DataView>
  );
}
