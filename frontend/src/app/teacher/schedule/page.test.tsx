import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockAvailability = {
  teacherId: 't1',
  doubleSession: false,
  availability: [
    { id: 'a1', teacherId: 't1', dayOfWeek: 1, startTime: '09:00', endTime: '13:00', track: '' },
    { id: 'a2', teacherId: 't1', dayOfWeek: 1, startTime: '16:00', endTime: '19:00', track: 'pista' },
    { id: 'a3', teacherId: 't1', dayOfWeek: 3, startTime: '10:00', endTime: '14:00', track: '' },
  ],
  overrides: [
    { id: 'o1', teacherId: 't1', date: '2026-06-01', isAvailable: false, startTime: null, endTime: null, reason: null },
  ],
};

const mockUser = {
  id: 't1',
  teacherId: 't1',
  role: 'teacher' as const,
  username: 'teacher1',
  name: 'Test',
  lastName: 'Teacher',
};

vi.mock('@/services', () => ({
  services: {
    scheduling: {
      getTeacherAvailability: vi.fn(),
      setAvailability: vi.fn().mockResolvedValue(undefined),
      removeAvailability: vi.fn().mockResolvedValue(undefined),
      setOverride: vi.fn().mockResolvedValue(undefined),
      removeOverride: vi.fn().mockResolvedValue(undefined),
    },
    teacher: {
      updateTeacher: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

const getAvailabilityMock = vi.mocked(
  (await import('@/services')).services.scheduling.getTeacherAvailability,
);
const setAvailabilityMock = vi.mocked(
  (await import('@/services')).services.scheduling.setAvailability,
);
const removeAvailabilityMock = vi.mocked(
  (await import('@/services')).services.scheduling.removeAvailability,
);
const setOverrideMock = vi.mocked(
  (await import('@/services')).services.scheduling.setOverride,
);
const removeOverrideMock = vi.mocked(
  (await import('@/services')).services.scheduling.removeOverride,
);
const updateTeacherMock = vi.mocked(
  (await import('@/services')).services.teacher.updateTeacher,
);

async function renderPage() {
  const Page = (await import('./page')).default;
  return render(<Page />);
}

/** Expand the collapsible weekly template section (collapsed by default). */
async function expandWeeklyTemplate() {
  const header = await screen.findByText('Horario semanal base');
  await userEvent.setup().click(header);
}

describe('TeacherSchedule', () => {
  beforeEach(() => {
    getAvailabilityMock.mockResolvedValue(mockAvailability);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  /* ─── Loading ────────────────────────────────────────────────── */

  it('shows loading state initially', async () => {
    getAvailabilityMock.mockImplementationOnce(() => new Promise(() => {}));
    await renderPage();
    expect(screen.getByText('Cargando disponibilidad...')).toBeInTheDocument();
  });

  it('loads availability on mount', async () => {
    await renderPage();
    await waitFor(() => {
      expect(getAvailabilityMock).toHaveBeenCalledWith('t1');
    });
  });

  it('shows error message on load failure', async () => {
    getAvailabilityMock.mockRejectedValueOnce(new Error('Network error'));
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Error al cargar disponibilidad')).toBeInTheDocument();
    });
  });

  /* ─── CalendarGrid ──────────────────────────────────────────── */

  it('renders CalendarGrid as primary view with month navigation', async () => {
    await renderPage();

    await waitFor(() => {
      // CalendarGrid renders "ESTE MES" twice (desktop + mobile)
      expect(screen.getAllByText('ESTE MES').length).toBeGreaterThan(0);
    });

    // Month navigation arrows should be present
    expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument();
  });

  /* ─── Weekly Template (collapsible) ─────────────────────────── */

  it('weekly template is collapsed by default', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Horario semanal base')).toBeInTheDocument();
    });

    // Collapsed: full day labels should NOT be visible
    expect(screen.queryByText('Domingo')).not.toBeInTheDocument();
  });

  it('expands weekly template on click', async () => {
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getByText('Domingo')).toBeInTheDocument();
      expect(screen.getByText('Lunes')).toBeInTheDocument();
      expect(screen.getByText('Sábado')).toBeInTheDocument();
    });
  });

  /* ─── Day blocks (within expanded weekly template) ──────────── */

  it('renders day blocks from loaded data after expanding weekly template', async () => {
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('13:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('16:00')).toBeInTheDocument();
      expect(screen.getByDisplayValue('19:00')).toBeInTheDocument();
    });
  });

  it('toggles day on when clicking inactive day', async () => {
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getAllByText('Domingo').length).toBeGreaterThan(0);
    });

    // Find the toggle inside Domingo's row
    const domingos = screen.getAllByText('Domingo');
    const domingoRow = domingos[0].closest('div')?.closest('div');
    expect(domingoRow).toBeTruthy();

    if (domingoRow) {
      const toggle = domingoRow.querySelector('button');
      if (toggle) await userEvent.setup().click(toggle);
    }

    await waitFor(() => {
      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    });
  });

  it('toggles day off and removes saved blocks', async () => {
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    const lunesHeaders = screen.getAllByText('Lunes');
    const lunesRow = lunesHeaders[0].closest('div')?.closest('div');
    expect(lunesRow).toBeTruthy();

    if (lunesRow) {
      const toggle = lunesRow.querySelector('button');
      if (toggle) await userEvent.setup().click(toggle);
    }

    await waitFor(() => {
      expect(removeAvailabilityMock).toHaveBeenCalledTimes(2);
      expect(removeAvailabilityMock).toHaveBeenCalledWith('t1', 1, undefined);
      expect(removeAvailabilityMock).toHaveBeenCalledWith('t1', 1, 'pista');
    });

    expect(screen.queryByDisplayValue('09:00')).not.toBeInTheDocument();
  });

  it('saves a block via button', async () => {
    const user = userEvent.setup();
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      const buttons = screen.getAllByRole('button', { name: /actualizar|guardar/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    const saveButtons = screen.getAllByRole('button', { name: /actualizar|guardar/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(setAvailabilityMock).toHaveBeenCalled();
    });

    const call = setAvailabilityMock.mock.calls[0];
    expect(call[0]).toBe('t1');
  });

  it('shows error when start >= end on save', async () => {
    const user = userEvent.setup();
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    const timeInputs = screen.getAllByDisplayValue('09:00');
    if (timeInputs.length > 0) {
      await user.clear(timeInputs[0]);
      await user.type(timeInputs[0], '14:00');
    }

    const saveButton = screen.getAllByRole('button', { name: /actualizar|guardar/i })[0];
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/inicio debe ser anterior/)).toBeInTheDocument();
    });

    expect(setAvailabilityMock).not.toHaveBeenCalled();
  });

  it('removes a saved block with API call', async () => {
    const user = userEvent.setup();
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    const removeButtons = screen.getAllByTitle('Eliminar bloque');
    expect(removeButtons.length).toBeGreaterThan(0);

    await user.click(removeButtons[0]);

    await waitFor(() => {
      expect(removeAvailabilityMock).toHaveBeenCalled();
    });
  });

  it('adds a second block for a day', async () => {
    const user = userEvent.setup();
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    const addButtons = screen.getAllByText('+ Añadir bloque');
    expect(addButtons.length).toBeGreaterThan(0);

    await user.click(addButtons[0]);

    await waitFor(() => {
      const circulacionOptions = screen.getAllByText('Circulación (45 min)');
      expect(circulacionOptions.length).toBeGreaterThan(0);
    });
  });

  it('does not show add block button when day has 2 blocks', async () => {
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getAllByText('+ Añadir bloque').length).toBeLessThan(7);
    });
  });

  /* ─── Day labels ────────────────────────────────────────────── */

  it('loads and shows all day labels after expanding weekly template', async () => {
    await renderPage();
    await expandWeeklyTemplate();

    await waitFor(() => {
      expect(screen.getByText('Domingo')).toBeInTheDocument();
      expect(screen.getByText('Lunes')).toBeInTheDocument();
      expect(screen.getByText('Martes')).toBeInTheDocument();
      expect(screen.getByText('Miércoles')).toBeInTheDocument();
      expect(screen.getByText('Jueves')).toBeInTheDocument();
      expect(screen.getByText('Viernes')).toBeInTheDocument();
      expect(screen.getByText('Sábado')).toBeInTheDocument();
    });
  });

  /* ─── Double Session ────────────────────────────────────────── */

  it('toggles double session', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Doble sesión')).toBeInTheDocument();
    });

    const doubleSessionToggle = screen.getByRole('button', { name: /desactivado/i });
    await user.click(doubleSessionToggle);

    await waitFor(() => {
      expect(updateTeacherMock).toHaveBeenCalledWith('t1', { doubleSession: true });
    });
  });
});
