import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteStudentModal } from './delete-student-modal';

vi.mock('@/services', () => ({
  services: {
    student: {
      deleteStudent: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { services } from '@/services';

describe('DeleteStudentModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders confirmation message with student name', () => {
    render(
      <DeleteStudentModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        studentName="John Doe"
        studentId="s1"
      />,
    );

    expect(screen.getByText('Eliminar Alumno')).toBeInTheDocument();
    expect(
      screen.getByText(
        '¿Estás seguro de que deseas eliminar a "John Doe"? Esta acción no se puede deshacer.',
      ),
    ).toBeInTheDocument();
  });

  it('calls deleteStudent on confirm', async () => {
    const user = userEvent.setup();
    render(
      <DeleteStudentModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        studentName="John Doe"
        studentId="s1"
      />,
    );

    await user.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(services.student.deleteStudent).toHaveBeenCalledWith('s1');
    });
  });

  it('calls onSuccess after successful deletion', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteStudentModal
        open={true}
        onClose={() => {}}
        onSuccess={onSuccess}
        studentName="John Doe"
        studentId="s1"
      />,
    );

    await user.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
