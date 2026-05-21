'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { services } from '@/services';
import type { VehicleDto, TeacherWithUserDto } from '@/services/interfaces';

interface FormData {
  name: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  vehicleIds: string[];
}

interface FormErrors {
  name?: string;
  username?: string;
  email?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacher: TeacherWithUserDto;
}

export function EditTeacherModal({ open, onClose, onSuccess, teacher }: Props) {
  const [vehicles, setVehicles] = useState<VehicleDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    name: teacher.user?.name ?? '',
    lastName: teacher.user?.lastName ?? '',
    username: teacher.user?.username ?? '',
    password: '',
    email: teacher.user?.email ?? '',
    phone: teacher.user?.phone ?? '',
    vehicleIds: [],
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      services.vehicle.list({ limit: 100 }).then((res) => setVehicles(res.data)).catch(() => {});
      setForm({
        name: teacher.user?.name ?? '',
        lastName: teacher.user?.lastName ?? '',
        username: teacher.user?.username ?? '',
        password: '',
        email: teacher.user?.email ?? '',
        phone: teacher.user?.phone ?? '',
        vehicleIds: [],
      });
    }
  }, [open, teacher]);

  function updateField(key: keyof Omit<FormData, 'vehicleIds'>, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleVehicle(id: string) {
    setForm((prev) => ({
      ...prev,
      vehicleIds: prev.vehicleIds.includes(id)
        ? prev.vehicleIds.filter((v) => v !== id)
        : [...prev.vehicleIds, id],
    }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.username.trim()) errors.username = 'El usuario es obligatorio';
    else if (form.username.trim().length < 3) errors.username = 'Mínimo 3 caracteres';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email inválido';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setError('');
    try {
      const payload: Record<string, string | string[] | undefined> = {
        name: form.name.trim(),
        lastName: form.lastName.trim() || undefined,
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        vehicleIds: form.vehicleIds.length > 0 ? form.vehicleIds : undefined,
      };
      if (form.password) payload.password = form.password;
      await services.teacher.updateTeacher(teacher.id, payload);
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar profesor');
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

  return (
    <Modal open={open} onClose={handleClose} title="Editar Profesor">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">{error}</div>
        )}

        <FormField label="Nombre" required error={fieldErrors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={inputClass}
            placeholder="Nombre"
          />
        </FormField>

        <FormField label="Apellidos">
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            className={inputClass}
            placeholder="Apellidos"
          />
        </FormField>

        <FormField label="Nombre de usuario" required error={fieldErrors.username}>
          <input
            type="text"
            value={form.username}
            onChange={(e) => updateField('username', e.target.value)}
            className={inputClass}
            placeholder="Usuario"
          />
        </FormField>

        <FormField label="Contraseña">
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            className={inputClass}
            placeholder="••••••••"
          />
        </FormField>

        <FormField label="Email" error={fieldErrors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={inputClass}
            placeholder="email@ejemplo.com"
          />
        </FormField>

        <FormField label="Teléfono">
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={inputClass}
            placeholder="612345678"
          />
        </FormField>

        <FormField label="Vehículos Asignados">
          <div className="max-h-40 overflow-y-auto space-y-1.5 border border-outline-variant/50 rounded-lg p-2">
            {vehicles.length === 0 && (
              <p className="text-xs text-on-surface-variant">No hay vehículos disponibles</p>
            )}
            {vehicles.map((v) => (
              <label
                key={v.id}
                className="flex items-center gap-2 text-sm text-on-surface cursor-pointer hover:bg-surface-container-low rounded px-1 py-0.5"
              >
                <input
                  type="checkbox"
                  checked={form.vehicleIds.includes(v.id)}
                  onChange={() => toggleVehicle(v.id)}
                  className="rounded border-outline-variant"
                />
                {v.plate}
              </label>
            ))}
          </div>
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
