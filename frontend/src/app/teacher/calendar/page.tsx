'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

export default function TeacherCalendar() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Mayo 2026" />
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
            <div key={d} className="text-on-surface-variant font-medium py-1">{d}</div>
          ))}
          {Array.from({ length: 31 }).map((_, i) => {
            const day = i + 1;
            const hasClass = [12, 13, 14, 15].includes(day);
            return (
              <div
                key={day}
                className={`py-2 rounded-lg transition-colors ${
                  hasClass
                    ? 'bg-surface-container-high text-primary font-bold'
                    : 'text-on-surface hover:bg-surface-container-low'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
