'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { services } from '@/services';
import type { VehicleDto } from '@/services/interfaces';

const VEHICLE_TYPES = ['coche-manual', 'coche-automatico', 'moto-pista', 'moto-circulacion'] as const;

const typeLabels: Record<string, string> = {
  'coche-manual': 'Coche Manual',
  'coche-automatico': 'Coche Automático',
  'moto-pista': 'Moto Pista',
  'moto-circulacion': 'Moto Circulación',
};

interface FormData {
  plate: string;
  type: string;
  itvExpiry: string;
}

interface FormErrors {
  plate?: string;
  type?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehicle: VehicleDto;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function EditVehicleModal({ open, onClose, onSuccess, vehicle }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    plate: vehicle.plate,
    type: vehicle.type,
    itvExpiry: toDateInputValue(vehicle.itvExpiry),
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setForm({
        plate: vehicle.plate,
        type: vehicle.type,
        itvExpiry: toDateInputValue(vehicle.itvExpiry),
      });
    }
  }, [open, vehicle]);

  function updateField(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.plate.trim()) errors.plate = 'La matrícula es obligatoria';
    else if (!/^[A-Z0-9-]+$/.test(form.plate.toUpperCase())) errors.plate = 'Formato inválido (ej: ABC-1234)';
    if (!form.type) errors.type = 'Selecciona un tipo de vehículo';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError('');
    try {
      await services.vehicle.update(vehicle.id, {
        plate: form.plate.toUpperCase().trim(),
        type: form.type,
        itvExpiry: form.itvExpiry ? `${form.itvExpiry}T00:00:00.000Z` : undefined,
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar vehículo');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setFieldErrors({});
    setError('');
    onClose();
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface';
  const selectClass = 'w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface';

  return (
    <Modal open={open} onClose={handleClose} title="Editar Vehículo">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">{error}</div>
        )}

        <FormField label="Matrícula" required error={fieldErrors.plate}>
          <input
            type="text"
            value={form.plate}
            onChange={(e) => updateField('plate', e.target.value)}
            className={inputClass}
            placeholder="ABC-1234"
          />
        </FormField>

        <FormField label="Tipo" required error={fieldErrors.type}>
          <select
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar tipo</option>
            {VEHICLE_TYPES.map((vt) => (
              <option key={vt} value={vt}>{typeLabels[vt]}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Fecha ITV">
          <input
            type="date"
            value={form.itvExpiry}
            onChange={(e) => updateField('itvExpiry', e.target.value)}
            className={inputClass}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
