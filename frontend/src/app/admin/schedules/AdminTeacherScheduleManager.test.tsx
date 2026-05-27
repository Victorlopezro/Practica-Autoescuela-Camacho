import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TeacherAvailabilityDto } from '@/services/interfaces';

const mockTeachers = [
  { id: 't1', name: 'Carlos Martínez' },
  { id: 't2', name: 'Laura Sánchez' },
];

const mockAvailability: TeacherAvailabilityDto = {
  teacherId: 't1',
  teacherName: 'Carlos Martínez',
  availability: [
    { id: 'a1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: 'pista' },
    { id: 'a2', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', track: 'circulacion' },
    { id: 'a3', dayOfWeek: 2, startTime: '08:00', endTime: '14:00', track: null },
  ],
  overrides: [],
};

// Mock the scheduling service
vi.mock('@/services', () => ({
  services: {
    scheduling: {
      getTeacherAvailability: vi.fn(),
      setOverride: vi.fn(),
      removeOverride: vi.fn(),
    },
  },
}));

const getAvailabilityMock = vi.mocked(
  (await import('@/services')).services.scheduling.getTeacherAvailability,
);

async function renderManager() {
  const { AdminTeacherScheduleManager } = await import('./AdminTeacherScheduleManager');
  return render(
    <AdminTeacherScheduleManager
      teachers={mockTeachers}
      initialTeacherId="t1"
    />,
  );
}

describe('AdminTeacherScheduleManager', () => {
  beforeEach(() => {
    getAvailabilityMock.mockResolvedValue(mockAvailability);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render teacher selector with correct teacher names', async () => {
    await renderManager();

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('t1');
    });

    expect(screen.getByText('Carlos Martínez')).toBeInTheDocument();
    expect(screen.getByText('Laura Sánchez')).toBeInTheDocument();
  });

  it('should render week navigation with current week label', async () => {
    await renderManager();

    await waitFor(() => {
      expect(screen.getByText('ESTA SEMANA')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Semana anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Semana siguiente')).toBeInTheDocument();
  });

  it('should render day columns with labels', async () => {
    await renderManager();

    await waitFor(() => {
      expect(screen.getByText('Lunes')).toBeInTheDocument();
      expect(screen.getByText('Martes')).toBeInTheDocument();
      expect(screen.getByText('Miércoles')).toBeInTheDocument();
      expect(screen.getByText('Jueves')).toBeInTheDocument();
      expect(screen.getByText('Viernes')).toBeInTheDocument();
    });
  });

  it('should show availability toggles for each day', async () => {
    await renderManager();

    await waitFor(() => {
      // Each day has a Sí/No availability toggle button
      const siButtons = screen.getAllByText('Sí');
      expect(siButtons.length).toBeGreaterThanOrEqual(7);
    });
  });

  it('should show copy week button', async () => {
    await renderManager();

    await waitFor(() => {
      expect(screen.getByText('Copiar semana')).toBeInTheDocument();
    });
  });

  it('should change teacher when selecting from dropdown', async () => {
    const user = userEvent.setup();
    await renderManager();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 't2');

    // Changing teacher should trigger a new availability fetch
    expect(getAvailabilityMock).toHaveBeenCalledWith('t2');
  });

  it('should render base track blocks info', async () => {
    await renderManager();

    await waitFor(() => {
      // Lunes should show track info: P for pista and C for circulacion
      const trackInfo = screen.getAllByText(/P\s+09:00-12:00/);
      expect(trackInfo.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should show loading state initially', async () => {
    getAvailabilityMock.mockImplementationOnce(() => new Promise(() => {}));
    await renderManager();

    await waitFor(() => {
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});
