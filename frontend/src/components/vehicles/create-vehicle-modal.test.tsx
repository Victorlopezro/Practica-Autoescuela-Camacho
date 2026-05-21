import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateVehicleModal } from './create-vehicle-modal';

vi.mock('@/services', () => ({
  services: {
    vehicle: {
      create: vi.fn().mockResolvedValue({ id: 'v1', plate: 'ABC-1234' }),
    },
  },
}));

import { services } from '@/services';

describe('CreateVehicleModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders form title', () => {
    render(
      <CreateVehicleModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    expect(screen.getByText('Añadir Vehículo')).toBeInTheDocument();
  });

  it('renders form fields', () => {
    render(
      <CreateVehicleModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    expect(screen.getByPlaceholderText('ABC-1234')).toBeInTheDocument();
    expect(screen.getByText('Matrícula')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Fecha ITV')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(
      <CreateVehicleModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await user.click(screen.getByText('Guardar'));

    expect(screen.getByText('La matrícula es obligatoria')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un tipo de vehículo')).toBeInTheDocument();
  });

  it('submits with correct data', async () => {
    const user = userEvent.setup();
    render(
      <CreateVehicleModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await user.type(screen.getByPlaceholderText('ABC-1234'), 'abc-1234');
    await user.selectOptions(
      screen.getByRole('combobox'),
      'coche-manual',
    );

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(services.vehicle.create).toHaveBeenCalledWith({
        plate: 'ABC-1234',
        type: 'coche-manual',
      });
    });
  });

  it('includes ITV date when provided', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CreateVehicleModal open={true} onClose={() => {}} onSuccess={() => {}} />,
    );

    await user.type(screen.getByPlaceholderText('ABC-1234'), 'abc-1234');
    await user.selectOptions(
      screen.getByRole('combobox'),
      'coche-manual',
    );

    const dateInput = container.querySelector<HTMLInputElement>('input[type="date"]')!;
    await user.type(dateInput, '2027-06-15');

    await user.click(screen.getByText('Guardar'));

    await waitFor(() => {
      expect(services.vehicle.create).toHaveBeenCalledWith({
        plate: 'ABC-1234',
        type: 'coche-manual',
        itvExpiry: '2027-06-15T00:00:00.000Z',
      });
    });
  });
});
