'use client';

import { Card } from '@/components/layouts/Card';

const students = [
  { name: 'Juan Pérez', progress: 55, classes: 15, nextClass: '15 may 10:00' },
  { name: 'María García', progress: 70, classes: 22, nextClass: '17 may 11:00' },
  { name: 'Pedro López', progress: 30, classes: 8, nextClass: '16 may 09:00' },
];

export default function TeacherStudents() {
  return (
    <div className="space-y-3">
      {students.map(s => (
        <Card key={s.name} accent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center font-bold text-primary">
              {s.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-on-surface">{s.name}</p>
                  <p className="text-xs text-on-surface-variant">{s.classes} clases · Próxima: {s.nextClass}</p>
                </div>
                <span className="text-label-caps text-on-surface-variant">{s.progress}%</span>
              </div>
              <div className="mt-2 h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
