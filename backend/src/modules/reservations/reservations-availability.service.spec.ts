import { calculateFreeSlots } from './reservations-availability.service';

describe('calculateFreeSlots', () => {
  const date = '2026-06-01';
  const emptyReservations: Array<{ startTime: Date; duration: number; status: string }> = [];

  it('should return all slots when no reservations exist', () => {
    const slots = calculateFreeSlots(emptyReservations, date, 45);

    // Business hours 8:00-20:00 = 12 hours = 720 minutes
    // 720 / 45 = 16 slots (at 45-min increments starting from 8:00)
    expect(slots).toHaveLength(16);
    expect(slots[0]).toBe('2026-06-01T08:00:00.000Z');
    expect(slots[slots.length - 1]).toBe('2026-06-01T19:15:00.000Z');
  });

  it('should return all 90-minute slots when no reservations exist', () => {
    const slots = calculateFreeSlots(emptyReservations, date, 90);

    // 720 / 45 = 16 possible grid positions
    // 90-min slots at 8:00, 8:45, 9:30, 10:15, 11:00, ... as long as within business hours
    // The last 90-min slot starting before 20:00 would be at 18:30 (ends at 20:00)
    // Grid: 8:00, 8:45, 9:30, 10:15, 11:00, 11:45, 12:30, 13:15, 14:00, 14:45, 15:30, 16:15, 17:00, 17:45, 18:30
    // That's 15 slots
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]).toBe('2026-06-01T08:00:00.000Z');
  });

  it('should exclude slots overlapping with existing reservation', () => {
    const reservations = [
      {
        startTime: new Date('2026-06-01T10:00:00.000Z'),
        duration: 45,
        status: 'confirmed',
      },
    ];

    const slots = calculateFreeSlots(reservations, date, 45);

    // 45-min grid positions: 8:00, 8:45, 9:30, 10:15, 11:00, 11:45, ...
    // Reservation at 10:00-10:45 overlaps with:
    //   9:30-10:15 (9:30 < 10:45 AND 10:00 < 10:15) ✓ excluded
    //   10:15-11:00 (10:15 < 10:45 AND 10:00 < 11:00) ✓ excluded
    // Slot at 11:00-11:45 is after the reservation ends → should be available
    expect(slots).not.toContain('2026-06-01T09:30:00.000Z');
    expect(slots).not.toContain('2026-06-01T10:15:00.000Z');
    expect(slots).toContain('2026-06-01T11:00:00.000Z');
  });

  it('should handle 90-minute slot overlap correctly', () => {
    const reservations = [
      {
        startTime: new Date('2026-06-01T10:00:00.000Z'),
        duration: 90,
        status: 'confirmed',
      },
    ];

    const slots = calculateFreeSlots(reservations, date, 90);

    // 45-min grid increments: 8:00, 8:45, 9:30, 10:15, 11:00, 11:45, 12:30, ...
    // Reservation is 10:00-11:30
    // Slot 9:30 is 9:30-11:00 — 9:30 < 11:30 AND 10:00 < 11:00 → overlaps ✓ excluded
    // Slot 10:15 is 10:15-11:45 — 10:15 < 11:30 AND 10:00 < 11:45 → overlaps ✓ excluded
    // Slot 11:00 is 11:00-12:30 — 11:00 < 11:30 AND 10:00 < 12:30 → overlaps ✓ excluded
    // Slot 11:45 is 11:45-13:15 — 11:45 < 11:30? No → no overlap ✓ available
    expect(slots).not.toContain('2026-06-01T09:30:00.000Z');
    expect(slots).not.toContain('2026-06-01T10:15:00.000Z');
    expect(slots).not.toContain('2026-06-01T11:00:00.000Z');
    expect(slots).toContain('2026-06-01T11:45:00.000Z');
  });

  it('should not exclude cancelled reservations', () => {
    const reservations = [
      {
        startTime: new Date('2026-06-01T10:00:00.000Z'),
        duration: 45,
        status: 'cancelled',
      },
    ];

    const slots = calculateFreeSlots(reservations, date, 45);

    // Cancelled reservations should be ignored, so grid slots that would overlap
    // if the reservation were active (9:30-10:15 and 10:15-11:00) should still be available
    expect(slots).toContain('2026-06-01T09:30:00.000Z');
    expect(slots).toContain('2026-06-01T10:15:00.000Z');
  });

  it('should return empty array when fully booked', () => {
    // Book every slot in 45-min grid
    const reservations = [];
    for (let hour = 8; hour < 20; hour++) {
      for (let min = 0; min < 60; min += 45) {
        const start = new Date(Date.UTC(2026, 5, 1, hour, min, 0));
        if (start.getTime() + 45 * 60 * 1000 <= new Date(Date.UTC(2026, 5, 1, 20, 0, 0)).getTime()) {
          reservations.push({ startTime: start, duration: 45, status: 'confirmed' });
        }
      }
    }

    const slots = calculateFreeSlots(reservations, date, 45);
    expect(slots).toHaveLength(0);
  });
});
