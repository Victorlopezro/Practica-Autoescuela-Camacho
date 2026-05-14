'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

const allPayments = [
  { student: 'Juan Pérez', concept: 'Paquete 10 cls', amount: 150, date: '01 may', status: 'Pagado' },
  { student: 'María García', concept: 'Paquete 15 cls', amount: 200, date: '15 abr', status: 'Pendiente' },
  { student: 'Pedro López', concept: 'Tasas DGT', amount: 94, date: '10 abr', status: 'Vencido' },
  { student: 'Ana Martínez', concept: 'Paquete 10 cls', amount: 150, date: '05 may', status: 'Pagado' },
];

const statusStyles: Record<string, string> = {
  Pagado: 'bg-primary-container text-primary',
  Pendiente: 'bg-tertiary-fixed text-tertiary',
  Vencido: 'bg-error-container text-on-error-container',
};

export default function AdminPayments() {
  const pending = allPayments.filter(p => p.status !== 'Pagado').reduce((a, p) => a + p.amount, 0);
  return (
    <div className="space-y-6">
      {/* Pending Balance */}
      <div className="bg-primary rounded-xl p-6 text-white shadow-md">
        <p className="text-body-sm opacity-80">Pendiente total</p>
        <p className="text-display-lg-mobile font-bold">{pending},00 €</p>
      </div>

      {/* History */}
      <Card accent>
        <CardHeader title="Historial" subtitle="Todos los movimientos" />
        {allPayments.map(p => (
          <div key={p.student + p.concept} className="flex justify-between items-center py-3 border-b border-outline-variant/20 last:border-0">
            <div>
              <p className="text-sm font-medium text-on-surface">{p.student}</p>
              <p className="text-xs text-on-surface-variant">{p.concept} · {p.date}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-on-surface">{p.amount},00 €</p>
              <span className={`text-label-caps px-2 py-0.5 rounded-full ${statusStyles[p.status]}`}>{p.status}</span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
