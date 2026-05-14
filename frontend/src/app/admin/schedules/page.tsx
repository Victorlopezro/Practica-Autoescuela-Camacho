'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const slots = [
  { time: '09:00', m: 'Carlos', t: '', w: '', th: '', f: 'Laura', s: '', su: '' },
  { time: '10:00', m: 'Carlos', t: 'Carlos', w: 'Carlos', th: 'Carlos', f: 'Carlos', s: '', su: '' },
  { time: '11:00', m: 'Carlos', t: 'Carlos', w: 'Carlos', th: 'Carlos', f: 'Carlos', s: '', su: '' },
  { time: '12:00', m: 'Carlos', t: '', w: 'Carlos', th: 'Carlos', f: '', s: '', su: '' },
  { time: '17:00', m: '', t: '', w: 'Laura', th: '', f: '', s: '', su: '' },
  { time: '18:00', m: '', t: '', w: 'Laura', th: '', f: '', s: '', su: '' },
];

const days = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi'];
const dayKeys = ['m', 't', 'w', 'th', 'f'] as const;

export default function AdminSchedules() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Centro de Horarios" subtitle="Semana del 12 - 18 de mayo" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30">
                <th className="text-left py-3 pr-4 text-label-caps text-on-surface-variant"></th>
                {days.map(d => (
                  <th key={d} className="py-3 px-2 text-center text-label-caps text-on-surface-variant">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.time} className="border-b border-outline-variant/20 last:border-0">
                  <td className="py-3 pr-4 font-medium text-on-surface text-body-sm">{s.time}</td>
                  {dayKeys.map(dk => {
                    const val = s[dk];
                    return (
                      <td key={dk} className="py-2 px-2 text-center">
                        {val ? (
                          <span className="inline-block bg-surface-container-high text-primary font-medium text-xs px-2 py-1 rounded-lg w-full">
                            {val}
                          </span>
                        ) : (
                          <span className="text-outline">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
