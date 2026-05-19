'use client';

import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { VehicleIncidentDto } from '@/services/interfaces';

/**
 * Incidencias de vehículos.
 *
 * Actualmente obtiene todas las incidencias del primer vehículo.
 * BACKLOG: Cuando el backend soporte listar incidencias por profesor
 * o centro, reemplazar el vehicleId fijo.
 */

export default function TeacherIncidents() {
  const { data: incidents, isLoading, error, refresh } = useData<VehicleIncidentDto[]>(
    // El mock ignora el vehicleId, la API real requiere un vehicleId válido
    () => services.vehicle.getIncidents('vehicle-1'),
    []
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface-container-low rounded-xl p-4 text-body-sm text-on-surface-variant border border-outline-variant/20">
        <span className="material-symbols-outlined text-[18px] align-text-bottom mr-1">info</span>
        Incidencias registradas en vehículos. Requiere seleccionar vehículo.
      </div>

      <DataView
        data={incidents}
        isLoading={isLoading}
        error={error}
        onRetry={refresh}
        emptyComponent={
          <Card accent>
            <CardHeader title="Registradas" subtitle="Últimas incidencias" />
            <div className="flex items-center justify-center p-8 text-on-surface-variant">
              No hay incidencias registradas
            </div>
          </Card>
        }
      >
        {(incidents) => (
          <Card accent>
            <CardHeader title="Registradas" subtitle="Últimas incidencias" />
            {incidents.map(i => (
              <div key={i.id} className="flex items-center justify-between py-3 border-b border-outline-variant/20 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tertiary">
                    error_outline
                  </span>
                  <div>
                    <p className="text-sm font-medium text-on-surface">{i.description}</p>
                    <p className="text-xs text-on-surface-variant">Vehículo {i.vehicleId} · {i.date}</p>
                  </div>
                </div>
                <span className="text-label-caps px-2 py-1 rounded-full bg-tertiary-fixed text-tertiary">
                  Pendiente
                </span>
              </div>
            ))}
          </Card>
        )}
      </DataView>

      <button className="w-full bg-primary text-white py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors">
        <span className="material-symbols-outlined text-[18px]">add</span>
        Nueva incidencia
      </button>
    </div>
  );
}
