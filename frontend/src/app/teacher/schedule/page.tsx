'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const weekSchedule = [
  { day: 'Lunes', hours: '09:00 - 14:00' },
  { day: 'Martes', hours: '09:00 - 14:00' },
  { day: 'Miércoles', hours: '09:00 - 14:00' },
  { day: 'Jueves', hours: '09:00 - 14:00' },
  { day: 'Viernes', hours: '09:00 - 14:00' },
  { day: 'Sábado', hours: '—' },
  { day: 'Domingo', hours: '—' },
];

export default function TeacherSchedule() {
  return (
    <div className="space-y-6">
      <Card accent>
        <CardHeader title="Disponibilidad semanal" />
        {weekSchedule.map(d => (
          <div key={d.day} className="flex justify-between py-3 border-b border-outline-variant/20 last:border-0">
            <span className="text-sm font-medium text-on-surface">{d.day}</span>
            <span className={`text-body-sm ${d.hours === '—' ? 'text-outline' : 'text-on-surface font-medium'}`}>{d.hours}</span>
          </div>
        ))}
      </Card>

      <button className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors">
        <span className="material-symbols-outlined text-[18px]">edit</span>
        Editar disponibilidad
      </button>
    </div>
  );
}
