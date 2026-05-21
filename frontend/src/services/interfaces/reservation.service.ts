export interface ReservationDto {
  id: string;
  studentId: string;
  teacherId: string;
  vehicleType: string;
  startTime: string;
  duration: number;
  status: string;
  cancelledAt?: string;
  cancelledById?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface CalendarReservationDto extends ReservationDto {
  student?: { id: string; name: string | null; lastName: string | null; username: string } | null;
  teacher?: { id: string; name: string } | null;
}

export interface IReservationService {
  list(params?: { status?: string; teacherId?: string; studentId?: string; page?: number; limit?: number }): Promise<{ data: ReservationDto[]; total: number }>;
  getById(id: string): Promise<ReservationDto>;
  create(data: { studentId: string; teacherId: string; vehicleType: string; startTime: string; duration: number }): Promise<ReservationDto>;
  confirm(id: string): Promise<ReservationDto>;
  cancel(id: string): Promise<void>;
  cancelAsAdmin(id: string, reason: string): Promise<ReservationDto>;
  complete(id: string): Promise<ReservationDto>;
  getAvailability(date: string, teacherId: string, duration?: number): Promise<AvailabilitySlot[]>;
  getCalendar(params?: { teacherId?: string; studentId?: string; from?: string; to?: string }): Promise<CalendarReservationDto[]>;
}
