import type { Student, Booking, Payment } from '@/types';
import { mockStudents, mockBookings, mockPayments } from './index';

export const studentService = {
  getProfile: async (studentId: string): Promise<Student | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStudents.find(s => s.id === studentId) || null;
  },

  getBookings: async (studentId: string): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockBookings.filter(b => b.studentId === studentId);
  },

  getUpcomingBookings: async (studentId: string): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const now = new Date();
    return mockBookings.filter(
      b => b.studentId === studentId && new Date(b.date) >= now && b.status !== 'cancelled'
    );
  },

  getPayments: async (studentId: string): Promise<Payment[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockPayments.filter(p => p.studentId === studentId);
  },

  createBooking: async (booking: Omit<Booking, 'id'>): Promise<Booking> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { ...booking, id: `booking-${Date.now()}` };
  },

  cancelBooking: async (bookingId: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Booking ${bookingId} cancelled`);
  },
};