import type { Teacher, Booking, Student, Incident } from '@/types';
import { mockTeachers, mockBookings, mockStudents, mockVehicles } from './index';

export const teacherService = {
  getProfile: async (teacherId: string): Promise<Teacher | null> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockTeachers.find(t => t.id === teacherId) || null;
  },

  getDailySchedule: async (teacherId: string, date: Date): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const dateStr = date.toISOString().split('T')[0];
    return mockBookings.filter(
      b => b.teacherId === teacherId && b.date.toISOString().split('T')[0] === dateStr
    );
  },

  getWeeklySchedule: async (teacherId: string, startDate: Date): Promise<Booking[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const weekStart = startDate.getTime();
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
    return mockBookings.filter(
      b => b.teacherId === teacherId && b.date.getTime() >= weekStart && b.date.getTime() < weekEnd
    );
  },

  getStudents: async (teacherId: string): Promise<Student[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const studentIds = mockBookings.filter(b => b.teacherId === teacherId).map(b => b.studentId);
    return mockStudents.filter(s => studentIds.includes(s.id));
  },

  createIncident: async (incident: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      ...incident,
      id: `incident-${Date.now()}`,
      createdAt: new Date(),
    };
  },

  updateAvailability: async (teacherId: string, availability: Teacher['availability']): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Teacher ${teacherId} availability updated`);
  },
};