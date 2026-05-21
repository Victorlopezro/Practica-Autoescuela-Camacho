'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { services } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentName: string;
  studentId: string;
}

export function DeleteStudentModal({ open, onClose, onSuccess, studentName, studentId }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await services.student.deleteStudent(studentId);
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
      title="Eliminar Alumno"
      message={`¿Estás seguro de que deseas eliminar a "${studentName}"? Esta acción no se puede deshacer.`}
      loading={deleting}
    />
  );
}
