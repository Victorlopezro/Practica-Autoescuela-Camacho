/**
 * Calculate free time slots for a given date and slot duration,
 * excluding slots that overlap with existing non-cancelled reservations.
 *
 * Business hours: 8:00 - 20:00 UTC
 */
export function calculateFreeSlots(
  existingReservations: Array<{ startTime: Date; duration: number; status: string }>,
  date: string,
  slotDuration: 45 | 90,
): string[] {
  const slots: string[] = [];

  // Parse the date string (YYYY-MM-DD) as UTC
  const [year, month, day] = date.split('-').map(Number);
  const dayStart = new Date(Date.UTC(year, month - 1, day, 8, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(year, month - 1, day, 20, 0, 0, 0));

  // Filter non-cancelled reservations for overlap calculation
  const activeReservations = existingReservations.filter((r) => r.status !== 'cancelled');

  // Generate slots in 45-minute grid (aligned to :00 or :45)
  // If slotDuration is 45, slots start at 8:00, 8:45, 9:30, ...
  // If slotDuration is 90, slots start at 8:00, 9:30, 11:00, ...
  // We use 45-minute increments for the grid
  const increment = 45; // minutes, the common grid increment
  let currentSlotStart = new Date(dayStart);

  while (currentSlotStart.getTime() + slotDuration * 60 * 1000 <= dayEnd.getTime()) {
    const slotEnd = new Date(currentSlotStart.getTime() + slotDuration * 60 * 1000);

    // Check if this slot overlaps with any active reservation
    const isOverlapping = activeReservations.some((reservation) => {
      const resEnd = new Date(reservation.startTime.getTime() + reservation.duration * 60 * 1000);
      // Two intervals [s1, e1) and [s2, e2) overlap if s1 < e2 AND s2 < e1
      return currentSlotStart < resEnd && reservation.startTime < slotEnd;
    });

    if (!isOverlapping) {
      slots.push(currentSlotStart.toISOString());
    }

    // Advance by increment (45 minutes)
    currentSlotStart = new Date(currentSlotStart.getTime() + increment * 60 * 1000);
  }

  return slots;
}
