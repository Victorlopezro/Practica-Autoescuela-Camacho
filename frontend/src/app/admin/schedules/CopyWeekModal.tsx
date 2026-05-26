'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { Button } from '@/components/ui/button';
import { services } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  sourceWeekStart: string;
  onSuccess: () => void;
}

export function CopyWeekModal({ open, onClose, teacherId, sourceWeekStart, onSuccess }: Props) {
  const [targetDate, setTargetDate] = useState('');
  const [overrideExisting, setOverrideExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<number | null>(null);

  async function handleCopy() {
    if (!targetDate) return;
    setSaving(true);
    setError('');
    setResult(null);
    try {
      const res = await services.scheduling.copyWeekOverrides(teacherId, {
        sourceDate: sourceWeekStart,
        targetDate,
        overrideExisting,
      });
      setResult(res.copied);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al copiar semana');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setTargetDate('');
    setOverrideExisting(false);
    setError('');
    setResult(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Copiar Planificación Semanal">
      <div className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Copia las sobreescrituras de la semana actual a otra semana.
        </p>

        {result !== null ? (
          <div className="space-y-4">
            <div
              className={`p-3 rounded-lg border text-sm font-medium ${
                result > 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              {result > 0
                ? `Se copiaron ${result} día(s) correctamente`
                : 'No se copió ningún día — la semana destino ya tenía todos los días configurados'}
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Semana origen
              </label>
              <input
                type="date"
                value={sourceWeekStart}
                disabled
                className="w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-gray-50 text-on-surface-variant"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-on-surface mb-1.5">
                Semana destino <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-on-surface cursor-pointer">
              <input
                type="checkbox"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
                className="rounded border-outline-variant"
              />
              Sobrescribir días que ya tengan sobreescrituras
            </label>

            {error && (
              <div className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={handleClose} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleCopy} disabled={!targetDate || saving}>
                {saving ? 'Copiando...' : 'Copiar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
