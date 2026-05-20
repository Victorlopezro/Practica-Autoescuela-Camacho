'use client';

import { useState } from 'react';
import { Card, CardHeader } from '@/components/layouts/Card';
import { DataView } from '@/components/DataView';
import { useData } from '@/hooks/useData';
import { services } from '@/services';
import type { VehicleDto } from '@/services/interfaces';

const typeLabel: Record<string, string> = {
  'coche-manual': 'Coche Manual',
  'coche-automatico': 'Coche Auto.',
  'moto-pista': 'Moto Pista',
  'moto-circulacion': 'Moto Circu.',
};

const typeIcon: Record<string, string> = {
  'coche-manual': 'directions_car',
  'coche-automatico': 'directions_car',
  'moto-pista': 'motorcycle',
  'moto-circulacion': 'motorcycle',
};

const statusStyles: Record<string, string> = {
  green: 'bg-primary-container text-primary',
  yellow: 'bg-tertiary-fixed text-tertiary',
  red: 'bg-error-container text-on-error-container',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function AdminVehicles() {
  const { data: result, isLoading, error, refresh } = useData(
    () => services.vehicle.list({ limit: 100 }),
    [],
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function toggleAvailability(v: VehicleDto) {
    setSavingId(v.id);
    try {
      await services.vehicle.update(v.id, {
        status: v.available ? 'maintenance' : 'available',
      });
      await refresh();
    } catch { /* handled by UI state */ }
    setSavingId(null);
  }

  async function handleItvSave(v: VehicleDto, newDate: string) {
    setSavingId(v.id);
    try {
      await services.vehicle.update(v.id, {
        itvExpiry: newDate ? `${newDate}T00:00:00.000Z` : undefined,
      });
      await refresh();
    } catch { /* handled */ }
    setSavingId(null);
  }

  const vehicles = result?.data ?? [];

  return (
    <DataView
      data={vehicles}
      isLoading={isLoading}
      error={error}
      onRetry={refresh}
      emptyComponent={
        <Card accent>
          <CardHeader title="Vehículos" subtitle="No hay vehículos registrados" />
        </Card>
      }
    >
      {(items) => (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Añadir
            </button>
          </div>
          <div className="space-y-3">
            {items.map((v: VehicleDto) => {
              const label = typeLabel[v.type] ?? v.type;
              const icon = typeIcon[v.type] ?? 'directions_car';

              return (
                <VehicleCard
                  key={v.id}
                  vehicle={v}
                  icon={icon}
                  label={label}
                  isExpanded={expandedId === v.id}
                  saving={savingId === v.id}
                  onToggle={() => setExpandedId(expandedId === v.id ? null : v.id)}
                  onToggleAvailability={() => toggleAvailability(v)}
                  onItvSave={(date) => handleItvSave(v, date)}
                />
              );
            })}
          </div>
        </div>
      )}
    </DataView>
  );
}

function VehicleCard({
  vehicle: v, icon, label, isExpanded, saving, onToggle, onToggleAvailability, onItvSave,
}: {
  vehicle: VehicleDto;
  icon: string;
  label: string;
  isExpanded: boolean;
  saving: boolean;
  onToggle: () => void;
  onToggleAvailability: () => void;
  onItvSave: (date: string) => void;
}) {
  const [editingItv, setEditingItv] = useState(false);
  const [itvDraft, setItvDraft] = useState(toDateInputValue(v.itvExpiry));

  const statusColor = v.available ? 'green' : v.status === 'maintenance' ? 'red' : 'yellow';
  const statusLabel = v.available ? 'Disponible' : v.status === 'maintenance' ? 'Mantenimiento' : v.status === 'in-use' ? 'En uso' : 'Retirado';

  return (
    <Card accent>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-surface-container-high rounded-xl flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface">{v.plate}</p>
          <p className="text-xs text-on-surface-variant">{label}</p>
        </div>

        {/* ITV badges */}
        {v.itvCritical && (
          <span className="text-label-caps px-2 py-1 rounded-full bg-error-container text-on-error-container shrink-0">
            ITV CRÍTICA
          </span>
        )}
        {v.itvWarning && !v.itvCritical && (
          <span className="text-label-caps px-2 py-1 rounded-full bg-tertiary-fixed text-tertiary shrink-0">
            ITV próxima
          </span>
        )}

        {/* Availability toggle */}
        <button
          onClick={onToggleAvailability}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            v.available ? 'bg-primary' : 'bg-outline-variant'
          } ${saving ? 'opacity-50' : ''}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
              v.available ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
        <span className={`text-label-caps px-2 py-1 rounded-full shrink-0 ${statusStyles[statusColor]}`}>
          {statusLabel}
        </span>
      </div>

      {/* ITV row */}
      <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
        <span className="mr-1">ITV:</span>
        {editingItv ? (
          <>
            <input
              type="date"
              value={itvDraft}
              onChange={(e) => setItvDraft(e.target.value)}
              className="bg-surface-container-high rounded px-2 py-1 text-sm text-on-surface border border-outline-variant"
            />
            <button
              onClick={() => { onItvSave(itvDraft); setEditingItv(false); }}
              className="text-primary text-sm font-medium"
            >
              Guardar
            </button>
            <button
              onClick={() => { setEditingItv(false); setItvDraft(toDateInputValue(v.itvExpiry)); }}
              className="text-on-surface-variant text-sm"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <span>{formatDate(v.itvExpiry)}</span>
            <button
              onClick={() => setEditingItv(true)}
              className="material-symbols-outlined text-[16px] text-primary ml-1"
            >
              edit
            </button>
          </>
        )}
      </div>

      {/* Expand incidents */}
      <button
        onClick={onToggle}
        className="mt-2 flex items-center gap-1 text-xs text-primary font-medium"
      >
        <span className="material-symbols-outlined text-[16px]">
          {isExpanded ? 'expand_less' : 'expand_more'}
        </span>
        {isExpanded ? 'Ocultar incidencias' : 'Ver incidencias'}
      </button>

      {isExpanded && <AdminIncidentsSection vehicleId={v.id} />}
    </Card>
  );
}

function AdminIncidentsSection({ vehicleId }: { vehicleId: string }) {
  const { data: incidents, isLoading, error, refresh } = useData(
    () => services.vehicle.getIncidents(vehicleId),
    [vehicleId],
  );

  const [showForm, setShowForm] = useState(false);
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function handleSubmit() {
    if (!desc.trim() || !date) return;
    try {
      await services.vehicle.createIncident(vehicleId, { description: desc.trim(), date });
      setDesc('');
      setDate(new Date().toISOString().slice(0, 10));
      setShowForm(false);
      await refresh();
    } catch { /* handled */ }
  }

  if (isLoading) return <div className="mt-3 text-xs text-on-surface-variant">Cargando incidencias...</div>;
  if (error) return <div className="mt-3 text-xs text-error">Error al cargar incidencias</div>;

  return (
    <div className="mt-3 space-y-2 border-t border-outline-variant/20 pt-3">
      {(incidents?.length ?? 0) === 0 && !showForm && (
        <p className="text-xs text-on-surface-variant">No hay incidencias registradas</p>
      )}

      {incidents?.map((inc) => (
        <div key={inc.id} className="flex items-start gap-2 text-sm">
          <span className="material-symbols-outlined text-[16px] text-tertiary mt-0.5">error_outline</span>
          <div className="flex-1">
            <p className="text-xs text-on-surface">{inc.description}</p>
            <p className="text-[11px] text-on-surface-variant">{formatDate(inc.date)}</p>
          </div>
          <span className="text-label-caps px-2 py-0.5 rounded-full bg-tertiary-fixed text-tertiary text-[11px] shrink-0">
            Pendiente
          </span>
        </div>
      ))}

      {showForm ? (
        <div className="space-y-2 bg-surface-container-low rounded-xl p-3">
          <textarea
            placeholder="Describe la incidencia..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm text-on-surface border border-outline-variant resize-none"
            rows={2}
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-surface-container-high rounded px-2 py-1 text-sm text-on-surface border border-outline-variant"
            />
            <button
              onClick={handleSubmit}
              className="bg-primary text-white px-3 py-1 rounded-lg text-xs font-medium"
            >
              Guardar
            </button>
            <button
              onClick={() => { setShowForm(false); setDesc(''); }}
              className="text-xs text-on-surface-variant"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-xs text-primary font-medium"
        >
          <span className="material-symbols-outlined text-[14px]">add</span>
          Nueva incidencia
        </button>
      )}
    </div>
  );
}
