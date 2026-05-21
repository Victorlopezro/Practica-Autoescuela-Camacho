'use client';

import { useState } from 'react';
import { Modal } from '@/components/shared/Modal';
import { FormField } from '@/components/shared/FormField';
import { Button } from '@/components/ui/button';
import { services } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
  studentName: string;
  currentBalance: number;
}

export function AdjustBalanceModal({ open, onClose, onSuccess, studentId, studentName, currentBalance }: Props) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const amountNum = parseInt(amount, 10);
  const isValidAmount = !isNaN(amountNum) && amountNum !== 0;
  const isValidReason = reason.trim().length >= 3;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidAmount || !isValidReason) return;
    setSaving(true);
    setError('');
    try {
      await services.student.adjustBalance(studentId, amountNum, reason.trim());
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar clases');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setAmount('');
    setReason('');
    setError('');
    onClose();
  }

  const newBalance = isValidAmount ? currentBalance + amountNum : currentBalance;

  return (
    <Modal open={open} onClose={handleClose} title="Ajustar clases">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-on-surface-variant">
          Ajustando clases de <span className="font-semibold text-on-surface">{studentName}</span>
        </p>
        <p className="text-sm text-on-surface-variant">
          Balance actual: <span className="font-semibold text-primary">{currentBalance} clases</span>
          {isValidAmount && (
            <> → <span className={`font-semibold ${newBalance < 0 ? 'text-error' : 'text-primary'}`}>{newBalance} clases</span></>
          )}
        </p>

        {error && (
          <div className="text-sm text-error bg-error-container/20 rounded-lg px-3 py-2">{error}</div>
        )}

        <FormField
          label="Cantidad"
          required
          error={amount && !isValidAmount ? 'Introduce un número distinto de 0' : undefined}
        >
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
            placeholder="Ej: 5 para añadir, -3 para quitar"
          />
        </FormField>

        <FormField
          label="Motivo"
          required
          error={reason && reason.trim().length < 3 ? 'Mínimo 3 caracteres' : undefined}
        >
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-outline-variant/50 rounded-lg bg-white text-on-surface"
            placeholder="Ej: Pago de 5 clases, Ajuste administrativo"
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !isValidAmount || !isValidReason}>
            {saving ? 'Guardando...' : `Ajustar a ${isValidAmount ? newBalance : currentBalance} clases`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
