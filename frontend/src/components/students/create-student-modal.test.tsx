import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateStudentModal } from './create-student-modal';

vi.mock('@/services', () => ({
  services: {
    teacher: {
      list: vi.fn().mockResolvedValue([
        { id: 't1', name: 'Teacher One' },
        { id: 't2', name: 'Teacher Two' },
      ]),
    },
    student: {
      createStudent: vi.fn().mockResolvedValue({ id: 'new-id' }),
    },
  },
}));

import { services } from '@/services';

describe('CreateStudentModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders form title', () => {
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    expect(screen.getByText('Añadir Alumno')).toBeInTheDocument();
  });

  it('shows all form fields', () => {
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    expect(screen.getByPlaceholderText('Nombre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Apellidos')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Usuario')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Contraseña')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('email@ejemplo.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('612345678')).toBeInTheDocument();
    expect(screen.getByText('Tipo de Permiso')).toBeInTheDocument();
    expect(screen.getByText('Profesor Asignado')).toBeInTheDocument();
  });

  it('shows validation errors when submitting with empty required fields', async () => {
    const user = userEvent.setup();
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await user.click(screen.getByText('Guardar'));

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('El usuario es obligatorio')).toBeInTheDocument();
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument();
  });

  it('calls createStudent on valid submit', async () => {
    const user = userEvent.setup();
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText('Nombre'), 'John');
    await user.type(screen.getByPlaceholderText('Usuario'), 'john123');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(services.student.createStudent).toHaveBeenCalledWith({
        name: 'John',
        lastName: undefined,
        username: 'john123',
        password: 'password123',
        email: undefined,
        phone: undefined,
        licenseType: undefined,
        teacherId: undefined,
      });
    });
  });

  it('calls onSuccess after successful creation', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={onSuccess} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText('Nombre'), 'John');
    await user.type(screen.getByPlaceholderText('Usuario'), 'john123');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('loads teachers list when opened', async () => {
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });
  });

  it('shows error message when createStudent fails', async () => {
    (services.student.createStudent as vi.Mock).mockRejectedValueOnce(
      new Error('Server error'),
    );
    const user = userEvent.setup();
    render(
      <CreateStudentModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    await user.type(screen.getByPlaceholderText('Nombre'), 'John');
    await user.type(screen.getByPlaceholderText('Usuario'), 'john123');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});
