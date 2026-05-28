/* ─── Calendar Constants ─────────────────────────────────────── */

export const DAY_LABELS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
] as const;

export const DAY_LABELS_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'] as const;

/* ─── Pure Helpers ─────────────────────────────────────────────── */

/**
 * Format a Date as YYYY-MM-DD string.
 */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Return a new Date offset by `days` (preserves time, does not mutate input).
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Convert JS getDay() (0=Sunday, 6=Saturday) to backend day-of-week
 * (1=Monday … 7=Sunday).
 */
export function toBackendDayOfWeek(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

/**
 * Return the first day of the month for a given date.
 */
export function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Return the first Monday <= startDate (walk backwards).
 */
export function getMondayBefore(date: Date): Date {
  const d = new Date(date);
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Build a 30-day calendar grid as flat array of Date objects.
 *
 * Monday‑based weeks; padded with leading/trailing dates from adjacent
 * months so the grid always starts on Monday and ends on Sunday.
 *
 * @param year  Full year (e.g. 2026)
 * @param month 0‑indexed month (0 = January)
 */
export function getMonthGrid(year: number, month: number): Date[] {
  const grid: Date[] = [];
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  // JS getDay(): Sunday=0 → convert to Monday=1 … Sunday=7
  const startDow = first.getDay() || 7;
  const padBefore = startDow - 1; // how many days to prepend from prev month

  for (let i = padBefore; i > 0; i--) {
    grid.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    grid.push(new Date(year, month, d));
  }
  // Pad at end so the last row is a full week (multiple of 7)
  const overflow = grid.length % 7;
  if (overflow !== 0) {
    for (let i = 1; i <= 7 - overflow; i++) {
      grid.push(new Date(year, month + 1, i));
    }
  }
  return grid;
}

/* ─── Build-Day-Grid Types ─────────────────────────────────────── */

export interface DayTrackInfo {
  track: string;
  startTime: string;
  endTime: string;
}

/**
 * Lightweight block shape used inside DayState.
 * Structurally compatible with ScheduleBlockEditor's BlockData.
 */
export interface DayOverrideBlock {
  id: string;
  start: string;
  end: string;
  track: string;
  saved: boolean;
}

export interface DayState {
  /** YYYY-MM-DD */
  date: string;
  /** 1‑31 */
  monthDay: number;
  /** Lunes, Martes, … */
  dayLabel: string;
  /** Whether this day lies in the currently displayed month */
  isCurrentMonth: boolean;
  /** Whether this day is today */
  isToday: boolean;
  /** Whether the day has availability (template + override) */
  isAvailable: boolean;
  /** Whether there are any overrides (blocks or general unavailable) */
  hasOverride: boolean;
  /** Optional reason from a general unavailability override */
  reason?: string;
  /** Base weekly‑template tracks for this day-of-week */
  tracks: DayTrackInfo[];
  /** Track‑specific override blocks saved via API */
  overrideBlocks: DayOverrideBlock[];
}

/* ─── Build-Day-Grid Function ──────────────────────────────────── */

/**
 * Merge weekly template + overrides from a TeacherAvailabilityDto into
 * a flat array of DayState objects for a full month grid.
 *
 * @param availability  Raw API availability data
 * @param year          Full year (e.g. 2026)
 * @param month         0‑indexed month (0 = January)
 */
export function buildDayGrid(
  availability: TeacherAvailabilityDto,
  year: number,
  month: number,
): DayState[] {
  const todayISO = formatDate(new Date());
  const gridDates = getMonthGrid(year, month);

  return gridDates.map((date) => {
    const dateStr = formatDate(date);
    const jsDayOfWeek = date.getDay();
    const backendDayOfWeek = toBackendDayOfWeek(jsDayOfWeek);
    const isCurrentMonth =
      date.getFullYear() === year && date.getMonth() === month;

    // ── Overrides matching this exact date ─────────────────────
    const dateOverrides = availability.overrides.filter((o) => {
      const oDate =
        typeof o.date === 'string'
          ? o.date.split('T')[0]
          : formatDate(new Date(o.date));
      return oDate === dateStr;
    });

    const generalOverride = dateOverrides.find((o) => o.track == null);
    const isAvailable =
      dateOverrides.length === 0 ||
      (generalOverride?.isAvailable ?? true);

    // Track‑specific overrides → override blocks
    const overrideBlocks: DayOverrideBlock[] = dateOverrides
      .filter((o) => o.track != null)
      .map((o) => ({
        id: `${dateStr}-o-${o.id}`,
        start: o.startTime ?? '08:00',
        end: o.endTime ?? '14:00',
        track: o.track ?? '',
        saved: true,
      }));

    // General override with custom hours → also a block
    if (generalOverride && generalOverride.isAvailable && generalOverride.startTime) {
      overrideBlocks.push({
        id: `${dateStr}-o-${generalOverride.id}-g`,
        start: generalOverride.startTime,
        end: generalOverride.endTime ?? '14:00',
        track: '',
        saved: true,
      });
    }

    // ── Weekly template matching this day-of-week ───────────
    const dayAvail = availability.availability.filter(
      (a) => a.dayOfWeek === backendDayOfWeek,
    );

    const tracks: DayTrackInfo[] = dayAvail.map((a) => ({
      track: a.track ?? 'default',
      startTime: a.startTime,
      endTime: a.endTime,
    }));

    return {
      date: dateStr,
      monthDay: date.getDate(),
      dayLabel: DAY_LABELS[jsDayOfWeek === 0 ? 6 : jsDayOfWeek - 1],
      isCurrentMonth,
      isToday: dateStr === todayISO,
      isAvailable,
      hasOverride: dateOverrides.length > 0,
      reason: generalOverride?.reason ?? undefined,
      tracks,
      overrideBlocks,
    };
  });
}

/* ─── Type import (kept separate to avoid cycle) ───────────────── */

import type { TeacherAvailabilityDto } from '@/services/interfaces';
