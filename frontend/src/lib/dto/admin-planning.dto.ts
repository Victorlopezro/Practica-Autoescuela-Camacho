/* ─── Admin Planning DTOs ───────────────────────────────────────── */

export interface AdminPlanningDto {
  from: string;
  to: string;
  teachers: TeacherPlanningDto[];
}

export interface TeacherPlanningDto {
  id: string;
  name: string;
  doubleSession: boolean;
  days: DayPlanningDto[];
}

export interface DayPlanningDto {
  date: string;
  dayOfWeek: number;
  isAvailable: boolean;
  reason?: string;
  totalSlots: number;
  bookedSlots: number;
  freeSlots: number;
  reservations: PlanningReservationDto[];
}

export interface PlanningReservationDto {
  id: string;
  startTime: string;
  duration: number;
  status: string;
  vehicleType: string;
  student: { name: string | null; lastName: string | null } | null;
}
