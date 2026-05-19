/**
 * Service Adapter Switch
 *
 * Controlled by NEXT_PUBLIC_USE_MOCKS env var:
 *   'true' (default) → all services use mock implementations
 *   anything else    → all services use real API adapters
 */
import type {
  IAuthService,
  AuthUserDto,
  IStudentService,
  StudentDto,
  ITeacherService,
  TeacherDto,
  TeacherStatsDto,
  IVehicleService,
  VehicleDto,
  VehicleIncidentDto,
  IReservationService,
  ReservationDto,
  AvailabilitySlot,
  IPaymentService,
} from './interfaces';

/* ─── Helpers ─────────────────────────────────────────────────── */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ─── Mock Implementations ────────────────────────────────────── */

const mockAuthService: IAuthService = {
  async login(data) {
    await delay(300);
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: getMockUser(data.username),
    };
  },
  async refresh() {
    await delay(300);
    return {
      accessToken: 'mock-refreshed-access-token',
      refreshToken: 'mock-refreshed-refresh-token',
      user: getMockUser('student'),
    };
  },
  async logout() {
    await delay(200);
  },
  async getMe() {
    await delay(200);
    return getMockUser('student');
  },
};

function getMockUser(username?: string): AuthUserDto {
  const role = username === 'admin' ? 'admin' : username === 'teacher' ? 'teacher' : 'student';
  return {
    id: `${role}-1`,
    username: username ?? 'student',
    name: role === 'admin' ? 'Admin' : role === 'teacher' ? 'Carlos' : 'Juan',
    lastName: role === 'admin' ? 'Principal' : role === 'teacher' ? 'Martínez' : 'Pérez',
    email: `${username ?? 'student'}@example.com`,
    phone: '612345678',
    role,
    teacherId: role === 'teacher' ? 'teacher-1' : null,
    studentId: role === 'student' ? 'student-1' : null,
  };
}

const mockStudentService: IStudentService = {
  async list() {
    await delay(300);
    return {
      data: [
        {
          id: 'student-1',
          userId: 'user-1',
          remainingClasses: 15,
          balanceHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { id: 'user-1', username: 'student', name: 'Juan', lastName: 'Pérez', email: 'juan@example.com', phone: '612345678' },
        },
        {
          id: 'student-2',
          userId: 'user-2',
          remainingClasses: 0,
          balanceHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: { id: 'user-2', username: 'maria', name: 'María', lastName: 'García', email: 'maria@example.com', phone: '698765432' },
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
  },
  async getProfile() {
    await delay(300);
    return {
      id: 'student-1',
      userId: 'user-1',
      remainingClasses: 15,
      balanceHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  async getBalance() {
    await delay(300);
    return { remainingClasses: 15, balanceHistory: [] };
  },
  async deductClass(_, duration) {
    await delay(400);
    return {
      id: 'student-1',
      userId: 'user-1',
      remainingClasses: 14,
      balanceHistory: [{ action: 'deduct', duration, date: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
  async refillClass(_, amount) {
    await delay(400);
    return {
      id: 'student-1',
      userId: 'user-1',
      remainingClasses: 25,
      balanceHistory: [{ action: 'refill', amount, date: new Date().toISOString() }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },
};

const mockTeacherService: ITeacherService = {
  async list() {
    await delay(300);
    return [
      { id: 'teacher-1', name: 'Carlos Martínez', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      { id: 'teacher-2', name: 'Laura Sánchez', createdAt: '2025-06-15T00:00:00Z', updatedAt: '2025-06-15T00:00:00Z' },
    ];
  },
  async getById(id) {
    await delay(300);
    return {
      id,
      name: id === 'teacher-2' ? 'Laura Sánchez' : 'Carlos Martínez',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      user: { id: `${id}-user`, username: id, name: id === 'teacher-2' ? 'Laura' : 'Carlos', lastName: id === 'teacher-2' ? 'Sánchez' : 'Martínez', email: `${id}@example.com`, phone: '612345678' },
    };
  },
  async getStats() {
    await delay(300);
    return { id: 'teacher-1', name: 'Carlos Martínez', totalReservations: 45, upcomingReservations: 3, completedReservations: 38 };
  },
};

const mockVehicleService: IVehicleService = {
  async list() {
    await delay(300);
    return {
      data: [
        { id: 'vehicle-1', plate: 'ABC-1234', type: 'car', status: 'available', itvExpiry: '2026-12-31', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'vehicle-2', plate: 'DEF-5678', type: 'car', status: 'in_use', itvExpiry: '2026-06-30', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
        { id: 'vehicle-3', plate: 'GHI-9012', type: 'motorcycle', status: 'available', itvExpiry: null, createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      ],
      total: 3,
    };
  },
  async getById(id) {
    await delay(200);
    return { id, plate: 'ABC-1234', type: 'car', status: 'available', itvExpiry: '2026-12-31', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' };
  },
  async create(data) {
    await delay(400);
    return { id: makeId(), ...data, status: 'available', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), itvExpiry: data.itvExpiry ?? null };
  },
  async update(id, data) {
    await delay(400);
    return { id, plate: 'ABC-1234', type: 'car', status: 'available', itvExpiry: '2026-12-31', createdAt: '2025-01-01T00:00:00Z', updatedAt: new Date().toISOString(), ...data };
  },
  async delete() {
    await delay(300);
  },
  async getIncidents() {
    await delay(300);
    return [
      { id: 'incident-1', vehicleId: 'vehicle-1', description: 'Rayón en puerta trasera derecha', date: '2026-05-10', createdAt: '2026-05-10T10:00:00Z' },
    ];
  },
  async createIncident(vehicleId, data) {
    await delay(400);
    return { id: makeId(), vehicleId, description: data.description, date: data.date, createdAt: new Date().toISOString() };
  },
};

const mockReservationService: IReservationService = {
  async list() {
    await delay(300);
    return {
      data: [
        { id: 'res-1', studentId: 'student-1', teacherId: 'teacher-1', vehicleType: 'car', startTime: '2026-05-20T10:00:00Z', duration: 60, status: 'confirmed', createdAt: '2026-05-15T00:00:00Z', updatedAt: '2026-05-15T00:00:00Z' },
        { id: 'res-2', studentId: 'student-1', teacherId: 'teacher-1', vehicleType: 'car', startTime: '2026-05-22T10:00:00Z', duration: 60, status: 'pending', createdAt: '2026-05-16T00:00:00Z', updatedAt: '2026-05-16T00:00:00Z' },
        { id: 'res-3', studentId: 'student-2', teacherId: 'teacher-2', vehicleType: 'car', startTime: '2026-05-19T17:00:00Z', duration: 60, status: 'completed', createdAt: '2026-05-14T00:00:00Z', updatedAt: '2026-05-15T00:00:00Z' },
      ],
      total: 3,
    };
  },
  async getById(id) {
    await delay(200);
    return { id, studentId: 'student-1', teacherId: 'teacher-1', vehicleType: 'car', startTime: '2026-05-20T10:00:00Z', duration: 60, status: 'confirmed', createdAt: '2026-05-15T00:00:00Z', updatedAt: '2026-05-15T00:00:00Z' };
  },
  async create(data) {
    await delay(400);
    return { id: makeId(), ...data, status: 'pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  },
  async confirm(id) {
    await delay(300);
    return { id, studentId: 'student-1', teacherId: 'teacher-1', vehicleType: 'car', startTime: '2026-05-20T10:00:00Z', duration: 60, status: 'confirmed', createdAt: '2026-05-15T00:00:00Z', updatedAt: new Date().toISOString() };
  },
  async cancel() {
    await delay(300);
  },
  async complete(id) {
    await delay(300);
    return { id, studentId: 'student-1', teacherId: 'teacher-1', vehicleType: 'car', startTime: '2026-05-20T10:00:00Z', duration: 60, status: 'completed', createdAt: '2026-05-15T00:00:00Z', updatedAt: new Date().toISOString() };
  },
  async getAvailability() {
    await delay(300);
    return [
      { startTime: '2026-05-20T09:00:00Z', endTime: '2026-05-20T10:00:00Z' },
      { startTime: '2026-05-20T10:00:00Z', endTime: '2026-05-20T11:00:00Z' },
      { startTime: '2026-05-20T11:00:00Z', endTime: '2026-05-20T12:00:00Z' },
    ];
  },
};

const mockPaymentService: IPaymentService = {
  async getHistory() {
    await delay(300);
    return [];
  },
};

/* ─── Real API Implementations ────────────────────────────────── */

import {
  authApi,
  studentApi,
  teacherApi,
  vehicleApi,
  reservationApi,
  paymentApi,
} from './api';

/* ─── Adapter Switch ──────────────────────────────────────────── */

const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const services = {
  auth: useMocks ? mockAuthService : authApi,
  student: useMocks ? mockStudentService : studentApi,
  teacher: useMocks ? mockTeacherService : teacherApi,
  vehicle: useMocks ? mockVehicleService : vehicleApi,
  reservation: useMocks ? mockReservationService : reservationApi,
  payment: useMocks ? mockPaymentService : paymentApi,
};
