import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdminPlanningDto } from '@/lib/dto/admin-planning.dto';

const mockPlanningData: AdminPlanningDto = {
  from: '2026-05-21',
  to: '2026-06-19',
  teachers: [
    {
      id: 't1',
      name: 'Carlos Martínez',
      doubleSession: false,
      days: [
        {
          date: '2026-05-21',
          dayOfWeek: 4,
          isAvailable: true,
          totalSlots: 8,
          bookedSlots: 3,
          freeSlots: 5,
          reservations: [
            {
              id: 'r1',
              startTime: '2026-05-21T09:00:00.000Z',
              duration: 45,
              status: 'confirmed',
              vehicleType: 'coche-manual',
              student: { name: 'Juan', lastName: 'Pérez' },
            },
          ],
        },
        {
          date: '2026-05-22',
          dayOfWeek: 5,
          isAvailable: true,
          totalSlots: 8,
          bookedSlots: 0,
          freeSlots: 8,
          reservations: [],
        },
        {
          date: '2026-05-23',
          dayOfWeek: 6,
          isAvailable: false,
          reason: 'Festivo local',
          totalSlots: 0,
          bookedSlots: 0,
          freeSlots: 0,
          reservations: [],
        },
      ],
    },
    {
      id: 't2',
      name: 'Laura Sánchez',
      doubleSession: true,
      days: [
        {
          date: '2026-05-21',
          dayOfWeek: 4,
          isAvailable: true,
          totalSlots: 6,
          bookedSlots: 6,
          freeSlots: 0,
          reservations: [
            { id: 'r2', startTime: '2026-05-21T10:00:00.000Z', duration: 45, status: 'confirmed', vehicleType: 'moto', student: { name: 'Ana', lastName: 'García' } },
            { id: 'r3', startTime: '2026-05-21T11:00:00.000Z', duration: 90, status: 'confirmed', vehicleType: 'moto', student: { name: 'Luis', lastName: 'Martín' } },
          ],
        },
        {
          date: '2026-05-22',
          dayOfWeek: 5,
          isAvailable: false,
          totalSlots: 0,
          bookedSlots: 0,
          freeSlots: 0,
          reservations: [],
        },
      ],
    },
  ],
};

vi.mock('@/services', () => ({
  services: {
    admin: {
      getPlanning: vi.fn(),
    },
  },
}));

const getPlanningMock = vi.mocked(
  (await import('@/services')).services.admin.getPlanning,
);

async function renderPage() {
  const Page = (await import('./page')).default;
  return render(<Page />);
}

describe('AdminSchedulesPage', () => {
  beforeEach(() => {
    getPlanningMock.mockResolvedValue(mockPlanningData);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should show loading state initially', async () => {
    // Keep loading by not resolving the mock
    getPlanningMock.mockImplementationOnce(() => new Promise(() => {}));
    await renderPage();
    // Navigation is always visible; skeleton replaces content when loading
    expect(screen.getByLabelText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('HOY')).toBeInTheDocument();
  });

  it('should show error state when request fails', async () => {
    getPlanningMock.mockRejectedValueOnce(new Error('Network error'));
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    getPlanningMock.mockRejectedValueOnce(new Error('Network error'));
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });

  it('should render Hoy button', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('HOY')).toBeInTheDocument();
    });
  });

  it('should render teacher names', async () => {
    await renderPage();
    await waitFor(() => {
      // Names appear in both desktop (sticky column) and mobile (cards)
      const carlos = screen.getAllByText('Carlos Martínez');
      expect(carlos.length).toBeGreaterThanOrEqual(1);
      const laura = screen.getAllByText('Laura Sánchez');
      expect(laura.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should render slot occupancy in cells', async () => {
    await renderPage();
    await waitFor(() => {
      // Carlos: 3/8 on first day
      expect(screen.getByText('3/8')).toBeInTheDocument();
      // Laura: 6/6 on first day (fully booked)
      expect(screen.getByText('6/6')).toBeInTheDocument();
    });
  });

  it('should show unavailable day with —', async () => {
    await renderPage();
    await waitFor(() => {
      // Carlos has a non-available day
      const dashCells = screen.getAllByText('—');
      expect(dashCells.length).toBeGreaterThan(0);
    });
  });

  it('should open detail modal on cell click', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Carlos Martínez').length).toBeGreaterThanOrEqual(1);
    });

    // Click on the 3/8 cell (Carlos, first day)
    const cell = screen.getByText('3/8');
    await user.click(cell);

    await waitFor(() => {
      const matches = screen.getAllByText(/Juan Pérez/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should navigate ranges with prev/next buttons', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Anterior')).toBeInTheDocument();
      expect(screen.getByLabelText('Siguiente')).toBeInTheDocument();
    });

    const prev = screen.getByLabelText('Anterior');
    await user.click(prev);

    // After clicking prev, a new fetch should be made
    expect(getPlanningMock).toHaveBeenCalledTimes(2);
  });

  it('should show legend with all 4 states', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('Libre')).toBeInTheDocument();
      expect(screen.getByText('Parcial')).toBeInTheDocument();
      expect(screen.getByText('Completo')).toBeInTheDocument();
      expect(screen.getByText('No disponible')).toBeInTheDocument();
    });
  });

  it('should show empty state when no availability', async () => {
    const emptyData: AdminPlanningDto = {
      from: '2026-05-21',
      to: '2026-06-19',
      teachers: [
        {
          id: 't3',
          name: 'Test Teacher',
          doubleSession: false,
          days: [
            {
              date: '2026-05-21',
              dayOfWeek: 4,
              isAvailable: false,
              totalSlots: 0,
              bookedSlots: 0,
              freeSlots: 0,
              reservations: [],
            },
          ],
        },
      ],
    };
    getPlanningMock.mockResolvedValueOnce(emptyData);
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Ningún profesor tiene disponibilidad en este rango')).toBeInTheDocument();
    });
  });
});
