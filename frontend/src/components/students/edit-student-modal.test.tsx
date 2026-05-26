import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditStudentModal } from './edit-student-modal';
import type { StudentWithUserDto } from '@/services/interfaces';

const baseStudent: StudentWithUserDto = {
  id: 's1',
  userId: 'u1',
  teacherId: null,
  remainingClasses: 5,
  balanceHistory: [],
  licenseType: '',
  licenseSubType: '',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  user: {
    id: 'u1',
    name: 'John',
    lastName: 'Doe',
    username: 'john123',
    email: 'john@example.com',
    phone: '612345678',
  },
};

const mockStudentA1: StudentWithUserDto = {
  ...baseStudent,
  licenseType: 'A1',
  licenseSubType: 'pista',
};

vi.mock('@/services', () => ({
  services: {
    teacher: {
      list: vi.fn().mockResolvedValue([
        { id: 't1', name: 'Teacher One' },
        { id: 't2', name: 'Teacher Two' },
      ]),
    },
    student: {
      updateStudent: vi.fn().mockResolvedValue({ id: 's1' }),
    },
  },
}));

import { services } from '@/services';

describe('EditStudentModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders form with student name', () => {
    render(
      <EditStudentModal open={true} onClose={() => {}} onSuccess={() => {}} student={baseStudent} />,
    );

    expect(screen.getByText('Editar Alumno')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('john123')).toBeInTheDocument();
  });

  it('shows sub-type selector when student has A1 license', async () => {
    const { container } = render(
      <EditStudentModal open={true} onClose={() => {}} onSuccess={() => {}} student={mockStudentA1} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    expect(screen.getByText('Sub-tipo (A1/A2)')).toBeInTheDocument();

    // Verify sub-type select exists with pista option
    const selects = container.querySelectorAll('select');
    const subTypeSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === 'pista'),
    )!;
    expect(subTypeSelect).toBeInTheDocument();
    expect(subTypeSelect.value).toBe('pista');
  });

  it('hides sub-type selector when license type is not A1/A2', async () => {
    render(
      <EditStudentModal open={true} onClose={() => {}} onSuccess={() => {}} student={baseStudent} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    expect(screen.queryByText('Sub-tipo (A1/A2)')).not.toBeInTheDocument();
  });

  it('shows sub-type selector after changing license type to A1', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <EditStudentModal open={true} onClose={() => {}} onSuccess={() => {}} student={baseStudent} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    expect(screen.queryByText('Sub-tipo (A1/A2)')).not.toBeInTheDocument();

    // Find the license type select by its options
    const selects = container.querySelectorAll('select');
    const licenseSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === 'A1'),
    )!;
    await user.selectOptions(licenseSelect, 'A2');

    expect(screen.getByText('Sub-tipo (A1/A2)')).toBeInTheDocument();
  });

  it('calls updateStudent with licenseSubType on submit', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const { container } = render(
      <EditStudentModal open={true} onClose={() => {}} onSuccess={onSuccess} student={baseStudent} />,
    );

    await waitFor(() => {
      expect(services.teacher.list).toHaveBeenCalled();
    });

    // Find license type select
    const selects = container.querySelectorAll('select');
    const licenseSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === 'A1'),
    )!;
    await user.selectOptions(licenseSelect, 'A1');

    // Sub-type select should now be visible
    const subTypeSelect = Array.from(container.querySelectorAll('select')).find(
      (s) => Array.from(s.options).some((o) => o.value === 'pista'),
    )!;
    await user.selectOptions(subTypeSelect, 'pista');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(services.student.updateStudent).toHaveBeenCalledWith('s1', expect.objectContaining({
        licenseType: 'A1',
        licenseSubType: 'pista',
      }));
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows existing licenseSubType value when editing A1 student', () => {
    const { container } = render(
      <EditStudentModal open={true} onClose={() => {}} onSuccess={() => {}} student={mockStudentA1} />,
    );

    const selects = container.querySelectorAll('select');
    const licenseSelect = Array.from(selects).find((s) =>
      Array.from(s.options).some((o) => o.value === 'A1'),
    )!;
    expect(licenseSelect.value).toBe('A1');

    // Find sub-type select and verify value
    const subTypeSelect = Array.from(container.querySelectorAll('select')).find(
      (s) => s !== licenseSelect && Array.from(s.options).some((o) => o.value === 'pista'),
    )!;
    expect(subTypeSelect.value).toBe('pista');
  });
});
