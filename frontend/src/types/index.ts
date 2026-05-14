export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt: Date;
}

export interface Student extends User {
  role: 'student';
  licenseType: LicenseType;
  remainingClasses: number;
  totalClasses: number;
  progress: StudentProgress;
  enrolledAt: Date;
}

export interface Teacher extends User {
  role: 'teacher';
  licenseTypes: LicenseType[];
  availability: TeacherAvailability[];
  rating: number;
}

export interface Admin extends User {
  role: 'admin';
  permissions: AdminPermission[];
}

export type LicenseType = 'B' | 'A' | 'C' | 'D' | 'AM';

export interface StudentProgress {
  theory: number;
  practical: number;
  examDate?: Date;
}

export interface TeacherAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export type AdminPermission =
  | 'manage_students'
  | 'manage_teachers'
  | 'manage_vehicles'
  | 'manage_schedules'
  | 'view_analytics'
  | 'manage_payments';

export interface Booking {
  id: string;
  studentId: string;
  teacherId: string;
  vehicleId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  type: 'theory' | 'practice';
  notes?: string;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  type: VehicleType;
  status: VehicleStatus;
}

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'bus';

export type VehicleStatus = 'available' | 'in_use' | 'maintenance';

export interface Schedule {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export interface Incident {
  id: string;
  bookingId: string;
  teacherId: string;
  type: IncidentType;
  description: string;
  createdAt: Date;
  resolved: boolean;
}

export type IncidentType = 'delay' | 'absence' | 'vehicle_issue' | 'weather' | 'other';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  concept: string;
  status: PaymentStatus;
  createdAt: Date;
  dueDate: Date;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';