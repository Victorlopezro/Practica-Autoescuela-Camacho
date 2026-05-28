import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TeacherAvailabilityDto, OverrideDto } from '@/services/interfaces';
import { CalendarGrid, mergeOverridesForBatch } from './CalendarGrid';
import type { CalendarGridProps } from './CalendarGrid';
import type { BlockData } from '@/components/scheduling/ScheduleBlockEditor';
import { formatDate, getFirstOfMonth } from '@/lib/calendar-utils';

/* ─── Helpers to get fixed references into the current month ─── */

const now = new Date();
const currYear = now.getFullYear();
const currMonth = now.getMonth(); // 0-indexed
const currMonthStr = now.toLocaleDateString('es-ES', { month: 'long' }); // e.g. "abril"

/** First Monday of the current month, or the 6th if Monday didn't happen */
function getAWeekdayInCurrentMonth(dayOfWeek: number): Date {
  // dayOfWeek: 1=Monday … 5=Friday (backend convention)
  for (let d = 1; d <= 28; d++) {
    const candidate = new Date(currYear, currMonth, d);
    // Convert JS getDay() to backend: Sun=0→7, Mon=1, …, Sat=6
    const backendDOW = candidate.getDay() || 7;
    if (backendDOW === dayOfWeek) return candidate;
  }
  return new Date(currYear, currMonth, 6); // fallback
}

/** Format as YYYY-MM-DDT00:00:00.000Z (like real API returns) */
function apiDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}T00:00:00.000Z`;
}

const prevMonthStr = new Date(currYear, currMonth - 1, 1).toLocaleDateString('es-ES', {
  month: 'long',
});
const nextMonthStr = new Date(currYear, currMonth + 1, 1).toLocaleDateString('es-ES', {
  month: 'long',
});

/* ─── Mock data ──────────────────────────────────────────────── */

const mockAvailability: TeacherAvailabilityDto = {
  teacherId: 't1',
  doubleSession: false,
  availability: [
    { id: 'a1', teacherId: 't1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: 'pista' },
    { id: 'a2', teacherId: 't1', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', track: 'circulacion' },
    { id: 'a3', teacherId: 't1', dayOfWeek: 3, startTime: '10:00', endTime: '14:00', track: '' },
    { id: 'a4', teacherId: 't1', dayOfWeek: 5, startTime: '08:00', endTime: '13:00', track: null as unknown as undefined },
  ],
  overrides: [],
};

/* ─── Default props ──────────────────────────────────────────── */

const defaultProps: CalendarGridProps = {
  teacherId: 't1',
  availability: mockAvailability,
  onToggleDay: vi.fn().mockResolvedValue(undefined),
  onSaveBlock: vi.fn().mockResolvedValue(undefined),
  onRemoveBlock: vi.fn().mockResolvedValue(undefined),
};

function renderGrid(props: Partial<CalendarGridProps> = {}) {
  return render(<CalendarGrid {...defaultProps} {...props} />);
}

/* ─── Tests ──────────────────────────────────────────────────── */

describe('CalendarGrid', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  /* ── Loading state ────────────────────────────────────────── */

  it('shows loading spinner when loading is true', () => {
    renderGrid({ loading: true });
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  /* ── Empty teacherId state ────────────────────────────────── */

  it('shows empty state when teacherId is empty', () => {
    renderGrid({ teacherId: '' });
    expect(screen.getByText(/Selecciona un profesor/)).toBeInTheDocument();
  });

  /* ── No data state ────────────────────────────────────────── */

  it('shows no data message when availability is null', () => {
    renderGrid({ availability: null });
    expect(screen.getByText(/No hay datos/)).toBeInTheDocument();
  });

  /* ── Renders with data ────────────────────────────────────── */

  it('renders month navigation controls', async () => {
    renderGrid();
    expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument();
  });

  it('shows the current month label', () => {
    renderGrid();
    const labels = screen.getAllByText(new RegExp(currMonthStr, 'i'));
    expect(labels.length).toBeGreaterThan(0);
  });

  it('renders day-of-week headers', () => {
    renderGrid();
    // Day headers appear in both desktop + mobile views
    expect(screen.getAllByText('Lu').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ma').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Mi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Ju').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Vi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sá').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Do').length).toBeGreaterThanOrEqual(1);
  });

  it('renders availability Sí toggles', () => {
    renderGrid();
    const siButtons = screen.getAllByText('Sí');
    expect(siButtons.length).toBeGreaterThan(0);
  });

  /* ── Month navigation ─────────────────────────────────────── */

  it('navigates to previous month when clicking left arrow', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(screen.getByLabelText('Mes anterior'));
    const labels = screen.getAllByText(new RegExp(prevMonthStr, 'i'));
    expect(labels.length).toBeGreaterThan(0);
  });

  it('navigates to next month when clicking right arrow', async () => {
    const user = userEvent.setup();
    renderGrid();
    await user.click(screen.getByLabelText('Mes siguiente'));
    const labels = screen.getAllByText(new RegExp(nextMonthStr, 'i'));
    expect(labels.length).toBeGreaterThan(0);
  });

  it('resets to current month on ESTE MES click', async () => {
    const user = userEvent.setup();
    renderGrid();

    // Navigate away
    await user.click(screen.getByLabelText('Mes anterior'));
    const oldLabels = screen.getAllByText(new RegExp(prevMonthStr, 'i'));
    expect(oldLabels.length).toBeGreaterThan(0);

    // Click ESTE MES (appears in desktop + mobile nav)
    const esteMesButtons = screen.getAllByText('ESTE MES');
    await user.click(esteMesButtons[0]);

    // Should show current month
    const currentLabels = screen.getAllByText(new RegExp(currMonthStr, 'i'));
    expect(currentLabels.length).toBeGreaterThan(0);
  });

  /* ── Track labels ──────────────────────────────────────────── */

  it('renders track labels for days with template availability', () => {
    renderGrid();
    // Monday template (P 09:00-12:00) appears on all Mondays including padded
    const pistaLabels = screen.getAllByText(/P\s+09:00-12:00/);
    expect(pistaLabels.length).toBeGreaterThanOrEqual(1);
  });

  /* ── Day selection ─────────────────────────────────────────── */

  it('shows detail panel when a day cell is clicked', async () => {
    const user = userEvent.setup();
    renderGrid();

    // Click on a calendar cell (not the toggle) — pick a day number
    const dayNumbers = screen.getAllByText(/^\d+$/).filter(
      (el) => el.tagName === 'SPAN',
    );
    await user.click(dayNumbers[0]);

    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument();
    });
  });

  it('shows day toggle button in detail panel', async () => {
    const user = userEvent.setup();
    renderGrid();

    const dayNumbers = screen.getAllByText(/^\d+$/).filter(
      (el) => el.tagName === 'SPAN',
    );
    await user.click(dayNumbers[0]);

    await waitFor(() => {
      expect(screen.getByText('Desactivar día')).toBeInTheDocument();
    });
  });

  it('calls onToggleDay when clicking Sí/No toggle in grid', async () => {
    const user = userEvent.setup();
    const onToggleDay = vi.fn().mockResolvedValue(undefined);
    renderGrid({ onToggleDay });

    // Click the first current-month Sí button (padded days are disabled)
    const siButtons = screen
      .getAllByText('Sí')
      .filter((b) => !(b as HTMLButtonElement).disabled);
    await user.click(siButtons[0]);

    expect(onToggleDay).toHaveBeenCalled();
    const dateArg = onToggleDay.mock.calls[0][0];
    expect(dateArg).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  /* ── Error and feedback states ─────────────────────────────── */

  it('shows error message when error prop is set', () => {
    renderGrid({ error: 'Error de red' });
    expect(screen.getByText('Error de red')).toBeInTheDocument();
  });

  it('shows success message when successMsg prop is set', () => {
    renderGrid({ successMsg: 'Guardado correctamente' });
    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();
  });

  it('calls onDismissFeedback when clicking dismiss on error', async () => {
    const user = userEvent.setup();
    const onDismissFeedback = vi.fn();
    renderGrid({ error: 'Error', onDismissFeedback });

    await user.click(screen.getByText('✕'));

    expect(onDismissFeedback).toHaveBeenCalled();
  });

  /* ── Desktop vs Mobile ─────────────────────────────────────── */

  it('renders both desktop and mobile grid wrappers', () => {
    renderGrid();
    // Just verify Sí buttons are rendered (present in both grids)
    expect(screen.getAllByText('Sí').length).toBeGreaterThan(0);
  });

  /* ── Overrides ─────────────────────────────────────────────── */

  it('shows override blocks in grid cells', () => {
    const monday = getAWeekdayInCurrentMonth(1); // Monday
    const mondayApi = apiDate(monday);

    const withOverrides: TeacherAvailabilityDto = {
      ...mockAvailability,
      overrides: [
        {
          id: 'o1',
          teacherId: 't1',
          date: mondayApi,
          isAvailable: true,
          startTime: '10:00',
          endTime: '13:00',
          reason: null,
          track: 'pista',
        },
      ],
    };

    renderGrid({ availability: withOverrides });
    const blocks = screen.getAllByText(/P\s+10:00-13:00/);
    expect(blocks.length).toBeGreaterThanOrEqual(1);
  });

  it('shows No text for unavailable days', () => {
    const monday = getAWeekdayInCurrentMonth(1);
    const mondayApi = apiDate(monday);

    const withOverride: TeacherAvailabilityDto = {
      ...mockAvailability,
      overrides: [
        {
          id: 'o2',
          teacherId: 't1',
          date: mondayApi,
          isAvailable: false,
          startTime: null,
          endTime: null,
          reason: 'Festivo',
        },
      ],
    };

    renderGrid({ availability: withOverride });
    // Current-month monday shows "No" instead of "Sí"
    const noButtons = screen.getAllByText('No');
    expect(noButtons.length).toBeGreaterThan(0);
  });

  /* ── Teacher name ──────────────────────────────────────────── */

  it('accepts teacherName prop without rendering issues', () => {
    renderGrid({ teacherName: 'Carlos Martínez' });
    const esteMesButtons = screen.getAllByText('ESTE MES');
    expect(esteMesButtons.length).toBeGreaterThan(0);
  });

  /* ── Batch Save UI (badge + button) ──────────────────────────── */

  it('shows no batch badge when no unsaved blocks', () => {
    renderGrid();
    expect(screen.queryByText(/pendiente/)).not.toBeInTheDocument();
    expect(screen.queryByText('Guardar Todo')).not.toBeInTheDocument();
  });

  it('shows batch badge and Guardar Todo after adding an unsaved block', async () => {
    const user = userEvent.setup();
    renderGrid({ onBatchSave: vi.fn().mockResolvedValue(undefined) });

    // Open a day detail panel
    const dayNumbers = screen.getAllByText(/^\d+$/).filter(
      (el) => el.tagName === 'SPAN' && !el.closest('.opacity-20'),
    );
    await user.click(dayNumbers[0]);
    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument();
    });

    // Add an unsaved block
    const addBtn = screen.queryByText('+ Añadir bloque');
    if (addBtn) await user.click(addBtn);

    // Badge + button should appear
    await waitFor(() => {
      expect(screen.getByText(/1 pendiente/)).toBeInTheDocument();
      expect(screen.getByText('Guardar Todo')).toBeInTheDocument();
    });
  });

  it('hides batch badge after successful batch save', async () => {
    const user = userEvent.setup();
    const onBatchSave = vi.fn().mockResolvedValue(undefined);
    renderGrid({ onBatchSave });

    const dayNumbers = screen.getAllByText(/^\d+$/).filter(
      (el) => el.tagName === 'SPAN' && !el.closest('.opacity-20'),
    );
    await user.click(dayNumbers[0]);
    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument();
    });

    const addBtn = screen.queryByText('+ Añadir bloque');
    if (addBtn) await user.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Guardar Todo')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Guardar Todo'));

    await waitFor(() => {
      expect(onBatchSave).toHaveBeenCalled();
      expect(screen.queryByText(/pendiente/)).not.toBeInTheDocument();
      expect(screen.queryByText('Guardar Todo')).not.toBeInTheDocument();
    });
  });

  it('keeps batch badge after failed batch save', async () => {
    const user = userEvent.setup();
    const onBatchSave = vi.fn().mockRejectedValue(new Error('Network error'));
    renderGrid({ onBatchSave });

    const dayNumbers = screen.getAllByText(/^\d+$/).filter(
      (el) => el.tagName === 'SPAN' && !el.closest('.opacity-20'),
    );
    await user.click(dayNumbers[0]);
    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument();
    });

    const addBtn = screen.queryByText('+ Añadir bloque');
    if (addBtn) await user.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Guardar Todo')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Guardar Todo'));

    await waitFor(() => {
      expect(onBatchSave).toHaveBeenCalled();
      // Badge and button should still be visible after failure
      expect(screen.getByText(/1 pendiente/)).toBeInTheDocument();
      expect(screen.getByText('Guardar Todo')).toBeInTheDocument();
    });
  });

  /* ── Unsaved block removal (404 fix) ─────────────────────────── */

  it('removes unsaved block locally without calling onRemoveBlock', async () => {
    const user = userEvent.setup();
    const onRemoveBlock = vi.fn().mockResolvedValue(undefined);
    renderGrid({ onRemoveBlock });

    const dayNumbers = screen.getAllByText(/^\d+$/).filter(
      (el) => el.tagName === 'SPAN' && !el.closest('.opacity-20'),
    );
    await user.click(dayNumbers[0]);
    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeInTheDocument();
    });

    const addBtn = screen.queryByText('+ Añadir bloque');
    if (addBtn) await user.click(addBtn);

    // Wait for block editor to render with remove button
    await waitFor(() => {
      expect(screen.getByTitle('Eliminar bloque')).toBeInTheDocument();
    });

    // Click remove
    await user.click(screen.getByTitle('Eliminar bloque'));

    // Block should be removed locally
    await waitFor(() => {
      expect(screen.queryByTitle('Eliminar bloque')).not.toBeInTheDocument();
      expect(screen.queryByText(/pendiente/)).not.toBeInTheDocument();
    });

    // Parent's onRemoveBlock should NOT have been called
    expect(onRemoveBlock).not.toHaveBeenCalled();
  });
});

/* ─── mergeOverridesForBatch unit tests ─────────────────────── */

describe('mergeOverridesForBatch', () => {
  const baseOverrides: OverrideDto[] = [
    {
      id: 'o1',
      teacherId: 't1',
      date: '2026-06-01T00:00:00.000Z',
      isAvailable: true,
      startTime: '09:00',
      endTime: '12:00',
      reason: null,
      track: 'pista',
    },
    {
      id: 'o2',
      teacherId: 't1',
      date: '2026-06-01T00:00:00.000Z',
      isAvailable: true,
      startTime: '14:00',
      endTime: '16:00',
      reason: null,
      track: 'circulacion',
    },
    {
      id: 'o3',
      teacherId: 't1',
      date: '2026-06-02T00:00:00.000Z',
      isAvailable: true,
      startTime: '08:00',
      endTime: '12:00',
      reason: null,
      track: 'pista',
    },
  ];

  it('merges existing overrides with unsaved blocks for the same date', () => {
    const unsaved: BlockData[] = [
      { id: 'l1', start: '10:00', end: '11:00', track: 'circulacion', saved: false },
    ];
    const result = mergeOverridesForBatch(baseOverrides, '2026-06-01', unsaved);

    // Should include existing pista override (track not in unsaved)
    expect(result).toContainEqual(
      expect.objectContaining({ date: '2026-06-01', track: 'pista', startTime: '09:00', endTime: '12:00' }),
    );
    // Should include the new circulacion block (overrides old circulacion)
    expect(result).toContainEqual(
      expect.objectContaining({ date: '2026-06-01', track: 'circulacion', startTime: '10:00', endTime: '11:00' }),
    );
    expect(result).toHaveLength(2);
  });

  it('preserves existing overrides with different tracks', () => {
    const unsaved: BlockData[] = [
      { id: 'l1', start: '11:00', end: '14:00', track: 'pista', saved: false },
    ];
    const result = mergeOverridesForBatch(baseOverrides, '2026-06-01', unsaved);

    // circulacion (different track) should be preserved
    expect(result).toContainEqual(
      expect.objectContaining({ date: '2026-06-01', track: 'circulacion', startTime: '14:00', endTime: '16:00' }),
    );
    // pista should be the new unsaved version
    expect(result).toContainEqual(
      expect.objectContaining({ date: '2026-06-01', track: 'pista', startTime: '11:00', endTime: '14:00' }),
    );
    expect(result).toHaveLength(2);
  });

  it('only affects overrides for the matching date', () => {
    const unsaved: BlockData[] = [
      { id: 'l1', start: '08:00', end: '14:00', track: 'pista', saved: false },
    ];
    const result = mergeOverridesForBatch(baseOverrides, '2026-06-01', unsaved);

    // All results should only be for '2026-06-01' — the 2026-06-02 override must NOT appear
    const hasOtherDate = result.some((r) => r.date !== '2026-06-01');
    expect(hasOtherDate).toBe(false);
  });

  it('unsaved blocks override existing overrides with the same track', () => {
    const unsaved: BlockData[] = [
      { id: 'l1', start: '11:00', end: '14:00', track: 'pista', saved: false },
    ];
    const result = mergeOverridesForBatch(baseOverrides, '2026-06-01', unsaved);

    // pista should be replaced by unsaved version
    expect(result).toContainEqual(
      expect.objectContaining({ date: '2026-06-01', track: 'pista', startTime: '11:00', endTime: '14:00' }),
    );
    // circulacion (different track) should be preserved unchanged
    expect(result).toContainEqual(
      expect.objectContaining({ date: '2026-06-01', track: 'circulacion', startTime: '14:00', endTime: '16:00' }),
    );
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no existing overrides and no unsaved blocks', () => {
    const result = mergeOverridesForBatch([], '2026-06-01', []);
    expect(result).toHaveLength(0);
  });

  it('returns only unsaved blocks when no existing overrides for the date', () => {
    const unsaved: BlockData[] = [
      { id: 'l1', start: '08:00', end: '14:00', track: 'pista', saved: false },
    ];
    const result = mergeOverridesForBatch([], '2026-06-01', unsaved);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ date: '2026-06-01', track: 'pista', startTime: '08:00', endTime: '14:00' });
  });
});
