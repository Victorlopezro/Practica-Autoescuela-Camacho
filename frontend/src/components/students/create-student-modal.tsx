'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { services } from '@/services';
import type { TeacherDto } from '@/services/interfaces';

const LICENSE_TYPES = ['B', 'A1', 'A2', 'AM', 'C1', 'C', 'D'] as const;

interface FormData {
  name: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
  phone: string;
  licenseType: string;
  teacherId: string;
}

interface FormErrors {
  name?: string;
  username?: string;
  password?: string;
  email?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStudentModal({ open, onClose, onSuccess }: Props) {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    name: '',
    lastName: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    licenseType: '',
    teacherId: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      services.teacher.list().then((list) => setTeachers(list)).catch(() => {});
    }
  }, [open]);

  function updateField(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!form.username.trim()) errors.username = 'El usuario es obligatorio';
    else if (form.username.trim().length < 3) errors.username = 'Mínimo 3 caracteres';
    if (!form.password) errors.password = 'La contraseña es obligatoria';
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
      await services.student.createStudent({
        name: form.name.trim(),
        lastName: form.lastName.trim() || undefined,
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        licenseType: form.licenseType || undefined,
        teacherId: form.teacherId || undefined,
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear alumno');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setForm({ name: '', lastName: '', username: '', password: '', email: '', phone: '', licenseType: '', teacherId: '' });
    setFieldErrors({});
    setError('');
    onClose();
  }

  const inputClass = 'w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface';
  const selectClass = 'w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface';

  return (
    <Modal open={open} onClose={handleClose} title="Añadir Alumno">
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

        <FormField label="Contraseña" required error={fieldErrors.password}>
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            className={inputClass}
            placeholder="Contraseña"
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

        <FormField label="Tipo de Permiso">
          <select
            value={form.licenseType}
            onChange={(e) => updateField('licenseType', e.target.value)}
            className={selectClass}
          >
            <option value="">Sin seleccionar</option>
            {LICENSE_TYPES.map((lt) => (
              <option key={lt} value={lt}>{lt}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Profesor Asignado">
          <select
            value={form.teacherId}
            onChange={(e) => updateField('teacherId', e.target.value)}
            className={selectClass}
          >
            <option value="">Sin asignar</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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
