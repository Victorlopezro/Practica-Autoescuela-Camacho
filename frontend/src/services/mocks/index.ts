import type { Student, Teacher, Admin, Booking, Vehicle, Payment } from '@/types';

export const mockStudents: Student[] = [
  {
    id: 'student-1',
    email: 'juan@example.com',
    name: 'Juan',
    lastName: 'Pérez',
    role: 'student',
    phone: '612345678',
    licenseType: 'B',
    remainingClasses: 15,
    totalClasses: 30,
    progress: { theory: 65, practical: 40 },
    enrolledAt: new Date('2025-01-15'),
    createdAt: new Date('2025-01-15'),
  },
  {
    id: 'student-2',
    email: 'maria@example.com',
    name: 'María',
    lastName: 'García',
    role: 'student',
    phone: '612345679',
    licenseType: 'B',
    remainingClasses: 8,
    totalClasses: 30,
    progress: { theory: 85, practical: 70 },
    enrolledAt: new Date('2024-11-01'),
    createdAt: new Date('2024-11-01'),
  },
];

export const mockTeachers: Teacher[] = [
  {
    id: 'teacher-1',
    email: 'carlos@example.com',
    name: 'Carlos',
    lastName: 'Martínez',
    role: 'teacher',
    phone: '612345680',
    licenseTypes: ['B', 'A'],
    availability: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '14:00' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' },
    ],
    rating: 4.8,
    createdAt: new Date('2023-01-01'),
  },
  {
    id: 'teacher-2',
    email: 'laura@example.com',
    name: 'Laura',
    lastName: 'Sánchez',
    role: 'teacher',
    phone: '612345681',
    licenseTypes: ['B'],
    availability: [
      { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
      { dayOfWeek: 5, startTime: '16:00', endTime: '20:00' },
    ],
    rating: 4.9,
    createdAt: new Date('2023-06-15'),
  },
];

export const mockAdmin: Admin = {
  id: 'admin-1',
  email: 'admin@autoescuela.com',
  name: 'Admin',
  lastName: 'Principal',
  role: 'admin',
  phone: '612345682',
  permissions: [
    'manage_students',
    'manage_teachers',
    'manage_vehicles',
    'manage_schedules',
    'view_analytics',
    'manage_payments',
  ],
  createdAt: new Date('2023-01-01'),
};

export const mockVehicles: Vehicle[] = [
  {
    id: 'vehicle-1',
    plate: 'ABC-1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    type: 'car',
    status: 'available',
  },
  {
    id: 'vehicle-2',
    plate: 'DEF-5678',
    brand: 'Citroën',
    model: 'C3',
    year: 2021,
    type: 'car',
    status: 'in_use',
  },
  {
    id: 'vehicle-3',
    plate: 'GHI-9012',
    brand: 'Yamaha',
    model: 'MT-07',
    year: 2023,
    type: 'motorcycle',
    status: 'available',
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'booking-1',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleId: 'vehicle-1',
    date: new Date('2026-05-15'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'confirmed',
    type: 'practice',
    notes: 'Ejercicio de roundabout',
  },
  {
    id: 'booking-2',
    studentId: 'student-1',
    teacherId: 'teacher-1',
    vehicleId: 'vehicle-1',
    date: new Date('2026-05-17'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'pending',
    type: 'practice',
  },
  {
    id: 'booking-3',
    studentId: 'student-2',
    teacherId: 'teacher-2',
    vehicleId: 'vehicle-2',
    date: new Date('2026-05-14'),
    startTime: '17:00',
    endTime: '18:00',
    status: 'completed',
    type: 'practice',
  },
];

export const mockPayments: Payment[] = [
  {
    id: 'payment-1',
    studentId: 'student-1',
    amount: 150,
    concept: 'Paquete 10 clases',
    status: 'paid',
    createdAt: new Date('2025-01-15'),
    dueDate: new Date('2025-01-20'),
  },
  {
    id: 'payment-2',
    studentId: 'student-1',
    amount: 150,
    concept: 'Paquete 10 clases',
    status: 'pending',
    createdAt: new Date('2025-03-01'),
    dueDate: new Date('2025-03-05'),
  },
  {
    id: 'payment-3',
    studentId: 'student-2',
    amount: 200,
    concept: 'Paquete 15 clases',
    status: 'overdue',
    createdAt: new Date('2025-02-01'),
    dueDate: new Date('2025-02-05'),
  },
];

export const getCurrentUser = (role: 'student' | 'teacher' | 'admin') => {
  switch (role) {
    case 'student':
      return mockStudents[0];
    case 'teacher':
      return mockTeachers[0];
    case 'admin':
      return mockAdmin;
  }
};