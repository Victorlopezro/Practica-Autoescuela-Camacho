'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const currentWeek = [
  { day: 'Lun', date: 12, classes: 0 },
  { day: 'Mar', date: 13, classes: 1 },
  { day: 'Mié', date: 14, classes: 2 },
  { day: 'Jue', date: 15, classes: 0 },
  { day: 'Vie', date: 16, classes: 1 },
  { day: 'Sáb', date: 17, classes: 0 },
  { day: 'Dom', date: 18, classes: 0 },
];

const todayClasses = [
  { time: '10:00', teacher: 'Carlos M.', type: 'Práctica', vehicle: 'Toyota Corolla' },
];

export default function StudentCalendar() {
  return (
    <div className="space-y-6">
      {/* Week View */}
      <div className="bg-white rounded-xl p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-outline-variant/30">
        <div className="grid grid-cols-7 gap-1 text-center">
          {currentWeek.map(d => (
            <div key={d.date} className={`p-2 rounded-lg ${d.classes > 0 ? 'bg-surface-container-high' : ''}`}>
              <p className="text-label-caps text-on-surface-variant">{d.day}</p>
              <p className={`text-sm font-bold ${d.classes > 0 ? 'text-primary' : 'text-on-surface'}`}>{d.date}</p>
              {d.classes > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {Array.from({ length: d.classes }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Today's Classes */}
      <Card accent>
        <CardHeader title="Clases de hoy" subtitle="15 de mayo" />
        {todayClasses.map(c => (
          <div key={c.time} className="flex items-center gap-3 py-3">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-sm font-bold text-primary w-12">{c.time}</span>
              <div>
                <p className="text-sm font-medium text-on-surface">{c.teacher}</p>
                <p className="text-xs text-on-surface-variant">{c.type} - {c.vehicle}</p>
              </div>
            </div>
            <span className="text-label-caps bg-primary-container text-primary px-2 py-1 rounded-full font-semibold">Confirmada</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
