'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { services } from '@/services';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teacherName: string;
  teacherId: string;
}

export function DeleteTeacherModal({ open, onClose, onSuccess, teacherName, teacherId }: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    setDeleting(true);
    try {
      await services.teacher.deleteTeacher(teacherId);
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
      title="Eliminar Profesor"
      message={`¿Estás seguro de que deseas eliminar a "${teacherName}"? Esta acción no se puede deshacer.`}
      loading={deleting}
    />
  );
}
