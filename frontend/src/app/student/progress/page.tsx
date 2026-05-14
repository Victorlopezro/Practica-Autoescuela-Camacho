'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const skills = [
  { label: 'Circulación', percent: 45 },
  { label: 'Estacionamiento', percent: 70 },
  { label: 'Intersecciones', percent: 55 },
  { label: 'Autopista', percent: 30 },
  { label: 'Maniobras', percent: 60 },
];

export default function StudentProgress() {
  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <p className="text-display-lg-mobile font-bold text-primary">65%</p>
          <p className="text-label-caps text-on-surface-variant mt-1">Teoría</p>
        </Card>
        <Card className="text-center">
          <p className="text-display-lg-mobile font-bold text-secondary">40%</p>
          <p className="text-label-caps text-on-surface-variant mt-1">Práctica</p>
        </Card>
      </div>

      {/* Skill Breakdown */}
      <Card accent>
        <CardHeader title="Detalle prácticas" subtitle="Desglose por habilidad" />
        {skills.map(s => (
          <div key={s.label} className="mb-4 last:mb-0">
            <div className="flex justify-between text-body-sm mb-1">
              <span className="text-on-surface">{s.label}</span>
              <span className="font-medium text-secondary">{s.percent}%</span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full transition-all duration-1000" style={{ width: `${s.percent}%` }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
