export interface TeacherAvailabilityDto {
  teacherId: string;
  doubleSession: boolean;
  availability: WeeklyAvailabilityDto[];
  overrides: OverrideDto[];
}

export interface WeeklyAvailabilityDto {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface OverrideDto {
  id: string;
  teacherId: string;
  date: string;
  isAvailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

export interface SlotResultDto {
  date: string;
  slots: string[];
  slotDuration: number;
  doubleSession: boolean;
}

export interface SlotRangeDayDto {
  date: string;
  slots: string[];
  slotDuration: number;
}

export interface SlotRangeResultDto {
  teacherId: string;
  vehicleType: string;
  days: SlotRangeDayDto[];
}

export interface VehicleTypeConfigDto {
  id: string;
  type: string;
  duration: number;
}

export interface ValidationResultDto {
  valid: boolean;
  reason: string;
  riskLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface ISchedulingService {
  getTeacherAvailability(teacherId: string): Promise<TeacherAvailabilityDto>;
  setAvailability(teacherId: string, dayOfWeek: number, startTime: string, endTime: string): Promise<void>;
  removeAvailability(teacherId: string, dayOfWeek: number): Promise<void>;
  setOverride(teacherId: string, date: string, isAvailable: boolean, startTime?: string, endTime?: string, reason?: string): Promise<void>;
  removeOverride(teacherId: string, date: string): Promise<void>;
  getSlots(teacherId: string, date: string, vehicleType: string, doubleSession?: boolean): Promise<SlotResultDto>;
  getSlotsRange(teacherId: string, startDate: string, vehicleType: string, days?: number, doubleSession?: boolean): Promise<SlotRangeResultDto>;
  validateSlot(teacherId: string, studentId: string, vehicleType: string, startTime: string, duration: number, doubleSession?: boolean): Promise<ValidationResultDto>;
  getVehicleTypeConfig(): Promise<VehicleTypeConfigDto[]>;
}
