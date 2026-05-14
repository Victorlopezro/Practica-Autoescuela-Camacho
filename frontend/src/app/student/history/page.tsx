'use client';

import { Card } from '@/components/layouts/Card';

const history = [
  { date: '14 may', time: '10:00', teacher: 'Carlos M.', type: 'Práctica B', duration: '1h' },
  { date: '12 may', time: '11:00', teacher: 'Carlos M.', type: 'Práctica B', duration: '1h' },
  { date: '10 may', time: '09:00', teacher: 'Carlos M.', type: 'Práctica B', duration: '1h' },
  { date: '08 may', time: '10:00', teacher: 'Carlos M.', type: 'Teoría', duration: '45min' },
];

export default function StudentHistory() {
  return (
    <div className="space-y-4">
      {history.map(h => (
        <Card key={h.date + h.time}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-surface-container rounded-xl flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-on-surface-variant">{h.date.split(' ')[0]}</span>
              <span className="text-[10px] text-on-surface-variant/60">{h.date.split(' ')[1]}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-on-surface">{h.time} · {h.teacher}</p>
              <p className="text-xs text-on-surface-variant">{h.type} · {h.duration}</p>
            </div>
            <div className="flex items-center gap-1 text-green-700">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span className="text-label-caps">Completada</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
