export interface ReservationDto {
  id: string;
  studentId: string;
  teacherId: string;
  vehicleType: string;
  startTime: string;
  duration: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface IReservationService {
  list(params?: { status?: string; teacherId?: string; studentId?: string; page?: number; limit?: number }): Promise<{ data: ReservationDto[]; total: number }>;
  getById(id: string): Promise<ReservationDto>;
  create(data: { studentId: string; teacherId: string; vehicleType: string; startTime: string; duration: number }): Promise<ReservationDto>;
  confirm(id: string): Promise<ReservationDto>;
  cancel(id: string): Promise<void>;
  complete(id: string): Promise<ReservationDto>;
  getAvailability(date: string, teacherId: string, duration?: number): Promise<AvailabilitySlot[]>;
}
