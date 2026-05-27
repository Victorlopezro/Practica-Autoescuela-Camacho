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

async function renderPageAndGetContainer() {
  const Page = (await import('./page')).default;
  const result = render(<Page />);
  return { container: result.container };
}

describe('TeacherSchedule', () => {
  beforeEach(() => {
    getAvailabilityMock.mockResolvedValue(mockAvailability);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

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

  it('renders day blocks from loaded data', async () => {
    await renderPage();

    // Lunes (index 1) should have 2 blocks and be active
    await waitFor(() => {
      const lunesHeaders = screen.getAllByText('Lunes');
      expect(lunesHeaders.length).toBeGreaterThan(0);
    });

    // Lunes blocks rendered (track General + track Pista)
    expect(screen.getAllByDisplayValue('09:00').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('13:00').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('16:00').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('19:00').length).toBeGreaterThan(0);
  });

  it('shows error message on load failure', async () => {
    getAvailabilityMock.mockRejectedValueOnce(new Error('Network error'));
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Error al cargar disponibilidad')).toBeInTheDocument();
    });
  });

  it('shows overrides from loaded data', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText(/junio/)).toBeInTheDocument();
    });
  });

  it('toggles day on when clicking inactive day', async () => {
    await renderPage();

    // Domingo (index 0) is inactive — click its toggle button
    await waitFor(() => {
      expect(screen.getAllByText('Domingo').length).toBeGreaterThan(0);
    });

    // The toggle buttons are the rounded buttons inside each day row
    const toggleButtons = screen.getAllByRole('button');
    // Find the toggle for Domingo (first day, index 0) by looking for buttons
    // in the Domingo row
    const domingoToggle = toggleButtons.find(
      (btn) => btn.className.includes('rounded-full') && btn.onclick,
    );
    // We'll find it differently — look for the parent container
    const domingos = screen.getAllByText('Domingo');
    const domingoRow = domingos[0].closest('div')?.closest('div');
    expect(domingoRow).toBeTruthy();

    if (domingoRow) {
      const toggle = domingoRow.querySelector('button');
      if (toggle) await userEvent.setup().click(toggle);
    }

    // Should now show a default block
    await waitFor(() => {
      expect(screen.getByDisplayValue('08:00')).toBeInTheDocument();
    });
  });

  it('toggles day off and removes saved blocks', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    // Find Lunes toggle button
    const lunesHeaders = screen.getAllByText('Lunes');
    const lunesRow = lunesHeaders[0].closest('div')?.closest('div');
    expect(lunesRow).toBeTruthy();

    if (lunesRow) {
      const toggle = lunesRow.querySelector('button');
      if (toggle) await userEvent.setup().click(toggle);
    }

    // Should call removeAvailability for saved blocks
    await waitFor(() => {
      expect(removeAvailabilityMock).toHaveBeenCalledTimes(2);
      expect(removeAvailabilityMock).toHaveBeenCalledWith('t1', 1, undefined);
      expect(removeAvailabilityMock).toHaveBeenCalledWith('t1', 1, 'pista');
    });

    // Blocks should be gone
    expect(screen.queryByDisplayValue('09:00')).not.toBeInTheDocument();
  });

  it('saves a block via button', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      // Saved blocks show "Actualizar"; unsaved blocks show "Guardar"
      const buttons = screen.getAllByRole('button', { name: /actualizar|guardar/i });
      expect(buttons.length).toBeGreaterThan(0);
    });

    // Click first save button (Actualizar for pre-saved blocks)
    const saveButtons = screen.getAllByRole('button', { name: /actualizar|guardar/i });
    await user.click(saveButtons[0]);

    await waitFor(() => {
      expect(setAvailabilityMock).toHaveBeenCalled();
    });

    // Should be called with teacherId, dayOfWeek, start, end, track
    const call = setAvailabilityMock.mock.calls[0];
    expect(call[0]).toBe('t1');
  });

  it('shows error when start >= end on save', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    // Modify a block time to invalid (same start/end)
    const timeInputs = screen.getAllByDisplayValue('09:00');
    if (timeInputs.length > 0) {
      await user.clear(timeInputs[0]);
      await user.type(timeInputs[0], '14:00');
    }

    // Click save button
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

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    // Find remove buttons (✕ or title="Eliminar bloque")
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

    await waitFor(() => {
      expect(screen.getAllByText('Lunes').length).toBeGreaterThan(0);
    });

    // Lunes has 2 blocks already from mockAvailability (General + Pista)
    // Should not show "+ Añadir bloque" for Lunes
    // Click "+ Añadir bloque" for Miércoles (has 1 block, can add second)
    const addButtons = screen.getAllByText('+ Añadir bloque');
    expect(addButtons.length).toBeGreaterThan(0);

    await user.click(addButtons[0]);

    // Should now see a Circulación (45 min) option somewhere
    await waitFor(() => {
      const circulacionOptions = screen.getAllByText('Circulación (45 min)');
      expect(circulacionOptions.length).toBeGreaterThan(0);
    });
  });

  it('does not show add block button when day has 2 blocks', async () => {
    // Give Lunes 2 blocks from data and check no "Añadir bloque" for it
    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('+ Añadir bloque').length).toBeLessThan(7); // Only days with <2 blocks
    });

    // Lunes has 2 blocks already, should not have "+ Añadir bloque"
    // Miércoles has 1 block, should have it
    // Other days have 0 blocks, should have it
  });

  it('adds override date on button click', async () => {
    const user = userEvent.setup();
    const { container } = await renderPageAndGetContainer();

    await waitFor(() => {
      expect(screen.getByText('Marcar no disponible')).toBeInTheDocument();
    });

    // Find date input by type attribute (no role="textbox" in jsdom for type="date")
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).toBeInTheDocument();

    await user.clear(dateInput);
    await user.type(dateInput, '2026-06-15');

    // Click the button
    await user.click(screen.getByText('Marcar no disponible'));

    await waitFor(() => {
      expect(setOverrideMock).toHaveBeenCalledWith('t1', '2026-06-15', false);
    });
  });

  it('toggles double session', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Doble sesión')).toBeInTheDocument();
    });

    // Find double session toggle by accessible name (button inside a label)
    const doubleSessionToggle = screen.getByRole('button', { name: /desactivado/i });
    await user.click(doubleSessionToggle);

    await waitFor(() => {
      expect(updateTeacherMock).toHaveBeenCalledWith('t1', { doubleSession: true });
    });
  });

  it('loads and shows all day labels', async () => {
    await renderPage();

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

  it('renders overrides section with header', async () => {
    await renderPage();

    await waitFor(() => {
      expect(screen.getByText('Excepciones')).toBeInTheDocument();
      expect(screen.getByText(/Días específicos sin disponibilidad/)).toBeInTheDocument();
    });
  });

  it('removes an override via Eliminar button', async () => {
    const user = userEvent.setup();
    await renderPage();

    await waitFor(() => {
      expect(screen.getAllByText('Eliminar').length).toBeGreaterThan(0);
    });

    await user.click(screen.getAllByText('Eliminar')[0]);

    await waitFor(() => {
      expect(removeOverrideMock).toHaveBeenCalledWith('t1', '2026-06-01');
    });
  });
});
