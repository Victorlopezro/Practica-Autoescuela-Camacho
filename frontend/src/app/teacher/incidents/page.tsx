'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const incidents = [
  { id: 1, student: 'Juan P.', type: 'Retraso', date: '14 may', resolved: true },
  { id: 2, student: 'María G.', type: 'Incidencias vehículo', date: '12 may', resolved: false },
];

export default function TeacherIncidents() {
  return (
    <div className="space-y-6">
      <Card accent>
        <CardHeader title="Registradas" subtitle="Últimas incidencias" />
        {incidents.map(i => (
          <div key={i.id} className="flex items-center justify-between py-3 border-b border-outline-variant/20 last:border-0">
            <div className="flex items-center gap-3">
              <span className={`material-symbols-outlined ${i.resolved ? 'text-green-600' : 'text-tertiary'}`}>
                {i.resolved ? 'check_circle' : 'error_outline'}
              </span>
              <div>
                <p className="text-sm font-medium text-on-surface">{i.type}</p>
                <p className="text-xs text-on-surface-variant">{i.student} · {i.date}</p>
              </div>
            </div>
            <span className={`text-label-caps px-2 py-1 rounded-full ${
              i.resolved ? 'bg-primary-container text-primary' : 'bg-tertiary-fixed text-tertiary'
            }`}>
              {i.resolved ? 'Resuelta' : 'Pendiente'}
            </span>
          </div>
        ))}
      </Card>

      <button className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors">
        <span className="material-symbols-outlined text-[18px]">add</span>
        Nueva incidencia
      </button>
    </div>
  );
}
