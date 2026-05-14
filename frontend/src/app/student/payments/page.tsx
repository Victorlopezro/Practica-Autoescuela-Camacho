'use client';

import { Card } from '@/components/layouts/Card';

const payments = [
  { concept: 'Paquete 10 clases', amount: 150, date: '15 ene 2025', status: 'Pagado' },
  { concept: 'Paquete 10 clases', amount: 150, date: '01 mar 2025', status: 'Pendiente' },
  { concept: 'Tasas DGT', amount: 94, date: '10 feb 2025', status: 'Pagado' },
];

export default function StudentPayments() {
  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-primary rounded-xl p-6 text-white shadow-md">
        <p className="text-body-sm opacity-80">Saldo pendiente</p>
        <p className="text-display-lg-mobile font-bold">150,00 €</p>
      </div>

      {/* Payments List */}
      <div className="space-y-3">
        {payments.map(p => (
          <Card key={p.concept + p.date}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-on-surface">{p.concept}</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{p.date}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-on-surface">{p.amount},00 €</p>
                <span className={`text-label-caps px-2 py-0.5 rounded-full ${
                  p.status === 'Pagado' 
                    ? 'bg-primary-container text-primary' 
                    : 'bg-tertiary-fixed text-tertiary'
                }`}>{p.status}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
