'use client';

import { Card } from '@/components/layouts/Card';

const vehicles = [
  { plate: 'ABC-1234', brand: 'Toyota Corolla', year: 2022, type: 'Coche', status: 'Disponible', color: 'green' },
  { plate: 'DEF-5678', brand: 'Citroën C3', year: 2021, type: 'Coche', status: 'En uso', color: 'yellow' },
  { plate: 'GHI-9012', brand: 'Yamaha MT-07', year: 2023, type: 'Moto', status: 'Mantenimiento', color: 'red' },
];

const statusStyles: Record<string, string> = {
  green: 'bg-primary-container text-primary',
  yellow: 'bg-tertiary-fixed text-tertiary',
  red: 'bg-error-container text-on-error-container',
};

export default function AdminVehicles() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Añadir
        </button>
      </div>
      <div className="space-y-3">
        {vehicles.map(v => (
          <Card key={v.plate} accent>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">directions_car</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">{v.brand}</p>
                <p className="text-xs text-on-surface-variant">{v.plate} · {v.year} · {v.type}</p>
              </div>
              <span className={`text-label-caps px-2 py-1 rounded-full ${statusStyles[v.color]}`}>{v.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
