import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteVehicleModal } from './delete-vehicle-modal';

vi.mock('@/services', () => ({
  services: {
    vehicle: {
      delete: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { services } from '@/services';

describe('DeleteVehicleModal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders confirmation message with vehicle plate', () => {
    render(
      <DeleteVehicleModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        vehiclePlate="ABC-1234"
        vehicleId="v1"
      />,
    );

    expect(screen.getByText('Eliminar Vehículo')).toBeInTheDocument();
    expect(
      screen.getByText(
        '¿Estás seguro de que deseas eliminar el vehículo "ABC-1234"? Esta acción no se puede deshacer.',
      ),
    ).toBeInTheDocument();
  });

  it('calls delete on confirm', async () => {
    const user = userEvent.setup();
    render(
      <DeleteVehicleModal
        open={true}
        onClose={() => {}}
        onSuccess={() => {}}
        vehiclePlate="ABC-1234"
        vehicleId="v1"
      />,
    );

    await user.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(services.vehicle.delete).toHaveBeenCalledWith('v1');
    });
  });

  it('calls onSuccess after successful deletion', async () => {
    const onSuccess = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteVehicleModal
        open={true}
        onClose={() => {}}
        onSuccess={onSuccess}
        vehiclePlate="ABC-1234"
        vehicleId="v1"
      />,
    );

    await user.click(screen.getByText('Eliminar'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
