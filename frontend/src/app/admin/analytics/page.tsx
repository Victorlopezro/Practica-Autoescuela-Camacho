'use client';

import { Card } from '@/components/layouts/Card';

/**
 * BACKLOG: Pendiente de endpoint de analíticas del backend.
 * Cuando esté disponible, reemplazar datos mock con:
 *
 *   import { useData } from '@/hooks/useData';
 *   import { services } from '@/services';
 *   const { data, isLoading, error, refresh } = useData(
 *     () => services.reservation.list(),
 *     []
 *   );
 */

const analytics = [
  { label: 'Clases este mes', value: 187, change: '+12%' },
  { label: 'Alumnos nuevos', value: 8, change: '+25%' },
  { label: 'Tasa completados', value: '94%', change: '+2%' },
  { label: 'Ingresos mes', value: '4.250€', change: '+8%' },
];

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {analytics.map(a => (
          <Card key={a.label}>
            <p className="text-body-sm text-on-surface-variant">{a.label}</p>
            <p className="text-headline-md font-bold text-on-surface mt-1">{a.value}</p>
            <p className="text-label-caps text-green-700 mt-1">{a.change}</p>
          </Card>
        ))}
      </div>

      {/* Bar Chart */}
      <Card accent>
        <p className="text-body-sm text-on-surface-variant mb-4">Clases por día (esta semana)</p>
        <div className="flex items-end gap-2 h-32">
          {[12, 18, 15, 22, 20, 0, 0].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80"
                style={{ height: `${(val / 22) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
              />
              <span className="text-label-caps text-on-surface-variant mt-2">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
