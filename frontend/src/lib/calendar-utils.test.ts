import { describe, it, expect } from 'vitest';
import {
  formatDate,
  addDays,
  toBackendDayOfWeek,
  getFirstOfMonth,
  getMonthGrid,
  buildDayGrid,
  DAY_LABELS,
  DAY_LABELS_SHORT,
} from './calendar-utils';
import type { TeacherAvailabilityDto } from '@/services/interfaces';

/* ─── Helpers ────────────────────────────────────────────────── */

describe('formatDate', () => {
  it('returns YYYY-MM-DD for a given date', () => {
    const d = new Date(2026, 5, 15); // June 15, 2026
    expect(formatDate(d)).toBe('2026-06-15');
  });

  it('pads single-digit month and day', () => {
    const d = new Date(2026, 0, 5); // Jan 5, 2026
    expect(formatDate(d)).toBe('2026-01-05');
  });

  it('handles December date', () => {
    const d = new Date(2026, 11, 25);
    expect(formatDate(d)).toBe('2026-12-25');
  });
});

/* ─── addDays ────────────────────────────────────────────────── */

describe('addDays', () => {
  it('adds positive days', () => {
    const d = new Date(2026, 5, 15);
    const result = addDays(d, 3);
    expect(formatDate(result)).toBe('2026-06-18');
  });

  it('adds negative days', () => {
    const d = new Date(2026, 5, 15);
    const result = addDays(d, -5);
    expect(formatDate(result)).toBe('2026-06-10');
  });

  it('does not mutate the original date', () => {
    const d = new Date(2026, 5, 15);
    const copy = new Date(d);
    addDays(d, 7);
    expect(d.getTime()).toBe(copy.getTime());
  });

  it('crosses month boundaries', () => {
    const d = new Date(2026, 5, 28);
    const result = addDays(d, 5);
    expect(formatDate(result)).toBe('2026-07-03');
  });
});

/* ─── toBackendDayOfWeek ─────────────────────────────────────── */

describe('toBackendDayOfWeek', () => {
  it('converts Sunday (0) → 7', () => {
    expect(toBackendDayOfWeek(0)).toBe(7);
  });

  it('converts Monday (1) → 1', () => {
    expect(toBackendDayOfWeek(1)).toBe(1);
  });

  it('converts Saturday (6) → 6', () => {
    expect(toBackendDayOfWeek(6)).toBe(6);
  });

  it('converts Wednesday (3) → 3', () => {
    expect(toBackendDayOfWeek(3)).toBe(3);
  });
});

/* ─── getFirstOfMonth ────────────────────────────────────────── */

describe('getFirstOfMonth', () => {
  it('returns the first day of the month', () => {
    const d = new Date(2026, 5, 15);
    const result = getFirstOfMonth(d);
    expect(formatDate(result)).toBe('2026-06-01');
  });

  it('handles December → January', () => {
    const d = new Date(2026, 11, 25);
    const result = getFirstOfMonth(d);
    expect(formatDate(result)).toBe('2026-12-01');
  });
});

/* ─── getMonthGrid ───────────────────────────────────────────── */

describe('getMonthGrid', () => {
  it('returns an array of Date objects', () => {
    const grid = getMonthGrid(2026, 5); // June 2026
    expect(Array.isArray(grid)).toBe(true);
    expect(grid.length).toBeGreaterThan(27);
    expect(grid.length % 7).toBe(0); // full weeks
  });

  it('starts on Monday', () => {
    const grid = getMonthGrid(2026, 5); // June 2026
    // June 1, 2026 is a Monday
    expect(grid[0].getDay()).toBe(1); // Monday
    expect(formatDate(grid[0])).toBe('2026-06-01');
  });

  it('ends on Sunday', () => {
    const grid = getMonthGrid(2026, 5); // June 2026
    const last = grid[grid.length - 1];
    expect(last.getDay()).toBe(0); // Sunday
  });

  it('pads leading days from previous month when month does not start on Monday', () => {
    // July 2026 starts on Wednesday (getDay = 3)
    // Should pad Monday (July 1 - 2) and Tuesday (July 1 - 1) from June
    const grid = getMonthGrid(2026, 6); // July 2026
    expect(grid[0].getDay()).toBe(1); // Monday
    expect(grid[0].getMonth()).toBe(5); // June
    expect(grid[1].getDay()).toBe(2); // Tuesday
    expect(grid[1].getMonth()).toBe(5); // June
    expect(grid[2].getDay()).toBe(3); // Wednesday
    expect(grid[2].getMonth()).toBe(6); // July
  });

  it('pads trailing days from next month to complete the last week', () => {
    // February 2026 has 28 days, starts on Sunday
    // Grid should be 5 weeks = 35 days
    const grid = getMonthGrid(2026, 1); // February 2026
    expect(grid.length).toBe(35);
    // First day should be Monday (Jan 26)
    expect(grid[0].getDay()).toBe(1);
    expect(grid[0].getMonth()).toBe(0); // January
    // Last day should be Sunday (Mar 1)
    const last = grid[grid.length - 1];
    expect(last.getDay()).toBe(0);
    expect(last.getMonth()).toBe(2); // March
  });

  it('returns exactly 35 days for June 2026 (5 weeks)', () => {
    const grid = getMonthGrid(2026, 5); // June 2026 — 5 weeks
    expect(grid.length).toBe(35);
  });

  it('returns exactly 35 days for May 2026 (starts Fri, ends Sun)', () => {
    // May 2026 starts on Friday → 4 padded days (Mon-Thu Apr)
    // plus 31 days, ends on Sunday → exactly 5 weeks = 35 days
    const grid = getMonthGrid(2026, 4); // May 2026
    expect(grid.length).toBe(35);
  });
});

/* ─── Constants ──────────────────────────────────────────────── */

describe('DAY_LABELS', () => {
  it('starts with Lunes and ends with Domingo', () => {
    expect(DAY_LABELS[0]).toBe('Lunes');
    expect(DAY_LABELS[6]).toBe('Domingo');
  });
});

describe('DAY_LABELS_SHORT', () => {
  it('starts with Lu and ends with Do', () => {
    expect(DAY_LABELS_SHORT[0]).toBe('Lu');
    expect(DAY_LABELS_SHORT[6]).toBe('Do');
  });
});

/* ─── buildDayGrid ───────────────────────────────────────────── */

const mockDate = new Date(2026, 5, 15); // June 15, 2026 (Monday-start month)

const baseAvailability: TeacherAvailabilityDto = {
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

describe('buildDayGrid', () => {
  it('returns an array of DayState for the full month grid', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5); // June 2026
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length % 7).toBe(0);
  });

  it('sets isCurrentMonth correctly for each day', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5);
    const currentMonthDays = result.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays.length).toBe(30); // June has 30 days
  });

  it('marks days with template availability as available', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5);
    // June 1, 2026 is Monday → dayOfWeek 1 → has template availability
    const monday = result.find((d) => d.date === '2026-06-01');
    expect(monday).toBeDefined();
    expect(monday!.isAvailable).toBe(true);
    expect(monday!.tracks.length).toBe(2); // pista + circulacion
  });

  it('marks days without template as available (no overrides = available)', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5);
    // June 7, 2026 is Sunday → no template → available by default
    const sunday = result.find((d) => d.date === '2026-06-07');
    expect(sunday).toBeDefined();
    expect(sunday!.isAvailable).toBe(true);
    expect(sunday!.tracks.length).toBe(0);
  });

  it('sets dayLabel correctly', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5);
    const monday = result.find((d) => d.date === '2026-06-01');
    expect(monday!.dayLabel).toBe('Lunes');
    const sunday = result.find((d) => d.date === '2026-06-07');
    expect(sunday!.dayLabel).toBe('Domingo');
  });

  it('handles empty availability (no template, no overrides)', () => {
    const empty: TeacherAvailabilityDto = {
      teacherId: 't1',
      doubleSession: false,
      availability: [],
      overrides: [],
    };
    const result = buildDayGrid(empty, 2026, 5);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((d) => {
      expect(d.isAvailable).toBe(true);
      expect(d.tracks).toEqual([]);
      expect(d.overrideBlocks).toEqual([]);
    });
  });

  it('applies unavailability override', () => {
    const withOverride: TeacherAvailabilityDto = {
      ...baseAvailability,
      overrides: [
        {
          id: 'o1',
          teacherId: 't1',
          date: '2026-06-01T00:00:00.000Z',
          isAvailable: false,
          startTime: null,
          endTime: null,
          reason: 'Festivo',
        },
      ],
    };
    const result = buildDayGrid(withOverride, 2026, 5);
    const june1 = result.find((d) => d.date === '2026-06-01');
    expect(june1!.isAvailable).toBe(false);
    expect(june1!.reason).toBe('Festivo');
    expect(june1!.hasOverride).toBe(true);
  });

  it('applies override with custom hours as a block', () => {
    const withOverride: TeacherAvailabilityDto = {
      ...baseAvailability,
      overrides: [
        {
          id: 'o2',
          teacherId: 't1',
          date: '2026-06-03T00:00:00.000Z', // Wednesday
          isAvailable: true,
          startTime: '14:00',
          endTime: '18:00',
          reason: null,
        },
      ],
    };
    const result = buildDayGrid(withOverride, 2026, 5);
    const june3 = result.find((d) => d.date === '2026-06-03');
    expect(june3!.isAvailable).toBe(true);
    expect(june3!.overrideBlocks.length).toBe(1);
    expect(june3!.overrideBlocks[0].start).toBe('14:00');
    expect(june3!.overrideBlocks[0].end).toBe('18:00');
    expect(june3!.hasOverride).toBe(true);
  });

  it('applies track-specific override blocks', () => {
    const withOverride: TeacherAvailabilityDto = {
      ...baseAvailability,
      overrides: [
        {
          id: 'o3',
          teacherId: 't1',
          date: '2026-06-01T00:00:00.000Z',
          isAvailable: true,
          startTime: '10:00',
          endTime: '13:00',
          reason: null,
          track: 'pista',
        },
      ],
    };
    const result = buildDayGrid(withOverride, 2026, 5);
    const june1 = result.find((d) => d.date === '2026-06-01');
    expect(june1!.overrideBlocks.length).toBe(1);
    expect(june1!.overrideBlocks[0].track).toBe('pista');
    expect(june1!.overrideBlocks[0].start).toBe('10:00');
    expect(june1!.overrideBlocks[0].end).toBe('13:00');
    expect(june1!.hasOverride).toBe(true);
  });

  it('prioritizes general unavailability over template', () => {
    const withOverride: TeacherAvailabilityDto = {
      ...baseAvailability,
      overrides: [
        {
          id: 'o4',
          teacherId: 't1',
          date: '2026-06-01T00:00:00.000Z',
          isAvailable: false,
          startTime: null,
          endTime: null,
          reason: 'Puente',
        },
      ],
    };
    const result = buildDayGrid(withOverride, 2026, 5);
    const june1 = result.find((d) => d.date === '2026-06-01');
    // Monday has template availability, but override marks it unavailable
    expect(june1!.isAvailable).toBe(false);
    expect(june1!.reason).toBe('Puente');
  });

  it('handles adjacent month days with correct isCurrentMonth flag', () => {
    // May 2026: check trailing days of April (prev month padding)
    const result = buildDayGrid(baseAvailability, 2026, 4); // May 2026
    const leadingDays = result.filter((d) => !d.isCurrentMonth);
    expect(leadingDays.length).toBeGreaterThan(0);
    leadingDays.forEach((d) => {
      expect(d.isCurrentMonth).toBe(false);
    });
  });

  it('has no overriding days in empty overrides', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5);
    const daysWithOverride = result.filter((d) => d.hasOverride);
    expect(daysWithOverride.length).toBe(0);
  });

  it('sets monthDay to the correct day number', () => {
    const result = buildDayGrid(baseAvailability, 2026, 5);
    const june1 = result.find((d) => d.date === '2026-06-01');
    expect(june1!.monthDay).toBe(1);
    const june15 = result.find((d) => d.date === '2026-06-15');
    expect(june15!.monthDay).toBe(15);
  });
});
