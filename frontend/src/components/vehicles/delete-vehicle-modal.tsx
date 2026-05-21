'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { services } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehiclePlate: string;
  vehicleId: string;
}

export function DeleteVehicleModal({ open, onClose, onSuccess, vehiclePlate, vehicleId }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await services.vehicle.delete(vehicleId);
      onSuccess();
      onClose();
    } catch {
      /* error handled by UI state */
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Eliminar Vehículo"
      message={`¿Estás seguro de que deseas eliminar el vehículo "${vehiclePlate}"? Esta acción no se puede deshacer.`}
      loading={deleting}
    />
  );
}
