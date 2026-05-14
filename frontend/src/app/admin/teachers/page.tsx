'use client';

import { Card } from '@/components/layouts/Card';

const teachers = [
  { name: 'Carlos Martínez', email: 'carlos@example.com', students: 12, rating: 4.8, classes: 156 },
  { name: 'Laura Sánchez', email: 'laura@example.com', students: 8, rating: 4.9, classes: 98 },
  { name: 'Javier Ruiz', email: 'javier@example.com', students: 10, rating: 4.5, classes: 120 },
];

export default function AdminTeachers() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Añadir
        </button>
      </div>
      <div className="space-y-3">
        {teachers.map(t => (
          <Card key={t.email} accent>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary">
                {t.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">{t.name}</p>
                <p className="text-xs text-on-surface-variant">{t.email}</p>
                <div className="flex gap-4 mt-1.5">
                  <span className="text-label-caps text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">group</span>
                    {t.students} alumnos
                  </span>
                  <span className="text-label-caps text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {t.rating}
                  </span>
                  <span className="text-label-caps text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    {t.classes} clases
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
