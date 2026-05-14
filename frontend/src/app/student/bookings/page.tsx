'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const bookings = [
  { id: 1, date: '15 may', time: '10:00', teacher: 'Carlos M.', type: 'Práctica', status: 'Confirmada', color: 'green' },
  { id: 2, date: '17 may', time: '10:00', teacher: 'Carlos M.', type: 'Práctica', status: 'Pendiente', color: 'yellow' },
  { id: 3, date: '10 may', time: '09:00', teacher: 'Carlos M.', type: 'Práctica', status: 'Completada', color: 'gray' },
];

const statusStyles: Record<string, string> = {
  green: 'bg-green-50 text-green-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  gray: 'bg-surface-container text-on-surface-variant',
};

export default function StudentBookings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Reservar
        </button>
      </div>

      <Card accent>
        <CardHeader title="Próximas" subtitle="Clases programadas" />
        {bookings.filter(b => b.status !== 'Completada').map(b => (
          <div key={b.id} className="flex items-center justify-between py-3 border-b border-outline-variant/20 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-container-high rounded-xl flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-primary">{b.date.split(' ')[0]}</span>
                <span className="text-[10px] text-secondary">{b.date.split(' ')[1]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{b.time}</p>
                <p className="text-xs text-on-surface-variant">{b.teacher} · {b.type}</p>
              </div>
            </div>
            <span className={`text-label-caps px-2 py-1 rounded-full ${statusStyles[b.color]}`}>{b.status}</span>
          </div>
        ))}
      </Card>

      <Card>
        <CardHeader title="Historial" subtitle="Clases completadas" />
        {bookings.filter(b => b.status === 'Completada').map(b => (
          <div key={b.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-container rounded-xl flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-on-surface-variant">{b.date.split(' ')[0]}</span>
                <span className="text-[10px] text-on-surface-variant/60">{b.date.split(' ')[1]}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-on-surface">{b.time}</p>
                <p className="text-xs text-on-surface-variant">{b.teacher}</p>
              </div>
            </div>
            <span className={`text-label-caps px-2 py-1 rounded-full ${statusStyles[b.color]}`}>{b.status}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
