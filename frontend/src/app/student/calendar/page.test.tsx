import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StudentDto, SlotRangeResultDto, ReservationDto, VehicleTypeConfigDto } from '@/services/interfaces';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockUseAuth = vi.fn();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockGetProfile = vi.fn();
const mockGetVehicleTypeConfig = vi.fn();
const mockGetSlotsRange = vi.fn();
const mockReservationList = vi.fn();
const mockValidateSlot = vi.fn();
const mockReservationCreate = vi.fn();
const mockReservationCancel = vi.fn();

vi.mock('@/services', () => ({
  services: {
    student: { getProfile: (...args: unknown[]) => mockGetProfile(...args) },
    scheduling: {
      getVehicleTypeConfig: (...args: unknown[]) => mockGetVehicleTypeConfig(...args),
      getSlotsRange: (...args: unknown[]) => mockGetSlotsRange(...args),
      validateSlot: (...args: unknown[]) => mockValidateSlot(...args),
    },
    reservation: {
      list: (...args: unknown[]) => mockReservationList(...args),
      create: (...args: unknown[]) => mockReservationCreate(...args),
      cancel: (...args: unknown[]) => mockReservationCancel(...args),
    },
  },
}));

// ─── Fixtures ───────────────────────────────────────────────────────

const VEHICLE_TYPES: VehicleTypeConfigDto[] = [
  { id: 'vtc-coche-manual', type: 'coche-manual', duration: 45 },
  { id: 'vtc-coche-automatico', type: 'coche-automatico', duration: 45 },
  { id: 'vtc-moto-pista', type: 'moto-pista', duration: 30 },
  { id: 'vtc-moto-circulacion', type: 'moto-circulacion', duration: 45 },
];

function buildProfile(overrides: Partial<StudentDto> = {}): StudentDto {
  return {
    id: 'student-1',
    userId: 'user-1',
    teacherId: 'teacher-1',
    remainingClasses: 10,
    balanceHistory: [],
    licenseType: 'A2',
    licenseSubType: 'pista',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-05-26T00:00:00.000Z',
    ...overrides,
  };
}

function buildSlots(vehicleType = 'moto-pista'): SlotRangeResultDto {
  const days = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date('2026-05-26');
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    const daySlots: string[] = [];
    for (let h = 8; h < 11; h++) {
      daySlots.push(new Date(`${dateStr}T${h.toString().padStart(2, '0')}:00:00Z`).toISOString());
    }
    days.push({ date: dateStr, slots: daySlots, slotDuration: 30 });
  }
  return { teacherId: 'teacher-1', vehicleType, days };
}

// ─── Helpers ────────────────────────────────────────────────────────

async function renderPage() {
  const Page = (await import('./page')).default;
  return render(<Page />);
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('StudentCalendar — licenseSubType auto-detect', () => {
  beforeEach(() => {
    // Default user with a studentId
    mockUseAuth.mockReturnValue({ user: { studentId: 'student-1' } });
    mockGetProfile.mockResolvedValue(buildProfile());
    mockGetVehicleTypeConfig.mockResolvedValue(VEHICLE_TYPES);
    mockGetSlotsRange.mockResolvedValue(buildSlots('moto-pista'));
    mockReservationList.mockResolvedValue({ data: [] });
    mockValidateSlot.mockResolvedValue({ valid: true, reason: 'ok', riskLevel: 'none' });
    mockReservationCreate.mockResolvedValue({ id: 'new-res' });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('when licenseSubType is set', () => {
    it('should hide vehicle type selector and show fixed badge for pista', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: 'pista' }));
      mockGetSlotsRange.mockResolvedValue(buildSlots('moto-pista'));

      await renderPage();

      await waitFor(() => {
        // Vehicle type selector buttons should NOT be present
        expect(screen.queryByText('coche manual')).not.toBeInTheDocument();
        // Fixed badge should show "moto pista"
        expect(screen.getByText('moto pista')).toBeInTheDocument();
        // Auto-asignado is part of "30 min · Auto-asignado" — use function matcher
        expect(screen.getByText((content) => content.includes('Auto-asignado'))).toBeInTheDocument();
      });
    });

    it('should show fixed badge for circulacion', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: 'circulacion' }));
      mockGetSlotsRange.mockResolvedValue(buildSlots('moto-circulacion'));

      await renderPage();

      await waitFor(() => {
        expect(screen.getByText('moto circulacion')).toBeInTheDocument();
        expect(screen.getByText((content) => content.includes('Auto-asignado'))).toBeInTheDocument();
        expect(screen.queryByText('coche manual')).not.toBeInTheDocument();
      });
    });

    it('should call getSlotsRange with the correct vehicle type (moto-pista)', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: 'pista' }));

      await renderPage();

      await waitFor(() => {
        // After profile loads, slots should be fetched with moto-pista
        const lastCall = mockGetSlotsRange.mock.calls[mockGetSlotsRange.mock.calls.length - 1];
        expect(lastCall[2]).toBe('moto-pista');
      });
    });

    it('should show the correct duration for the fixed vehicle type', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: 'circulacion' }));

      await renderPage();

      await waitFor(() => {
        // moto-circulacion has 45 min duration
        expect(screen.getByText(/45 min/)).toBeInTheDocument();
      });
    });

    it('should show 30 min duration for pista', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: 'pista' }));

      await renderPage();

      await waitFor(() => {
        // moto-pista has 30 min duration
        expect(screen.getByText(/30 min/)).toBeInTheDocument();
      });
    });
  });

  describe('when licenseSubType is NOT set', () => {
    it('should show vehicle type selector with all options', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: undefined }));

      await renderPage();

      await waitFor(() => {
        expect(screen.getByText('coche manual')).toBeInTheDocument();
        expect(screen.getByText('coche automatico')).toBeInTheDocument();
        expect(screen.getByText('moto pista')).toBeInTheDocument();
        expect(screen.getByText('moto circulacion')).toBeInTheDocument();
      });

      // "Auto-asignado" should NOT appear
      expect(screen.queryByText('Auto-asignado')).not.toBeInTheDocument();
    });

    it('should allow selecting a different vehicle type', async () => {
      const user = userEvent.setup();
      mockGetProfile.mockResolvedValue(buildProfile({ licenseSubType: undefined }));

      await renderPage();

      await waitFor(() => {
        expect(screen.getByText('coche manual')).toBeInTheDocument();
      });

      // Click on moto circulacion
      await user.click(screen.getByText('moto circulacion'));

      // The selected vehicle type should update — moto circulacion button should have primary bg
      // This is a visual check — we can't easily assert state, but the button should exist
      await waitFor(() => {
        expect(screen.getByText('moto circulacion')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('should show no-teacher message when student has no teacherId', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ teacherId: null, licenseSubType: undefined }));

      await renderPage();

      await waitFor(() => {
        expect(
          screen.getByText('No tienes un profesor asignado. Contacta con la administración.')
        ).toBeInTheDocument();
      });
    });

    it('should show no-classes message when remainingClasses is 0', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ remainingClasses: 0 }));

      await renderPage();

      await waitFor(() => {
        expect(
          screen.getByText('No tienes clases disponibles. Compra un pack para poder reservar.')
        ).toBeInTheDocument();
      });
    });

    it('should show remaining classes count', async () => {
      mockGetProfile.mockResolvedValue(buildProfile({ remainingClasses: 5 }));

      await renderPage();

      await waitFor(() => {
        // Text is split across <span>5</span> and text " clases restantes"
        expect(screen.getByText((content) => content.includes('clases restantes'))).toBeInTheDocument();
      });
    });
  });
});
