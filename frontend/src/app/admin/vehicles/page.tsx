'use client';

import { Card } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { VehicleDto } from '@/services/interfaces';

const typeMap: Record<string, string> = {
  car: 'Coche',
  motorcycle: 'Moto',
};

const statusMap: Record<string, string> = {
  available: 'Disponible',
  in_use: 'En uso',
  maintenance: 'Mantenimiento',
};

const statusColorMap: Record<string, string> = {
  available: 'green',
  in_use: 'yellow',
  maintenance: 'red',
};

const statusStyles: Record<string, string> = {
  green: 'bg-primary-container text-primary',
  yellow: 'bg-tertiary-fixed text-tertiary',
  red: 'bg-error-container text-on-error-container',
};

export default function AdminVehicles() {
  const { data, isLoading, error, refresh } = useData(
    () => services.vehicle.list(),
    [],
  );

  return (
    <DataView data={data} isLoading={isLoading} error={error} onRetry={refresh}>
      {(result) => (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Añadir
            </button>
          </div>
          <div className="space-y-3">
            {result.data.map((v: VehicleDto) => {
              const typeLabel = typeMap[v.type] ?? v.type;
              const statusLabel = statusMap[v.status] ?? v.status;
              const color = statusColorMap[v.status] ?? 'yellow';
              return (
                <Card key={v.id} accent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">directions_car</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-on-surface">{v.plate}</p>
                      <p className="text-xs text-on-surface-variant">{v.plate} · {typeLabel}</p>
                    </div>
                    <span className={`text-label-caps px-2 py-1 rounded-full ${statusStyles[color]}`}>
                      {statusLabel}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </DataView>
  );
}
