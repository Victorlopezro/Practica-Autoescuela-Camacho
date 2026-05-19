import apiClient from './client';
import type { IStudentService, StudentDto } from '../interfaces/student.service';

export const studentApi: IStudentService = {
  async getProfile(studentId: string): Promise<StudentDto> {
    const { data } = await apiClient.get<StudentDto>(`/students/${studentId}`);
    return data;
  },

  async getBalance(studentId: string): Promise<Pick<StudentDto, 'remainingClasses' | 'balanceHistory'>> {
    const profile = await this.getProfile(studentId);
    return { remainingClasses: profile.remainingClasses, balanceHistory: profile.balanceHistory };
  },

  async deductClass(studentId: string, duration: number): Promise<StudentDto> {
    const { data } = await apiClient.post<StudentDto>(`/students/${studentId}/deduct-class`, { duration });
    return data;
  },

  async refillClass(studentId: string, amount: number): Promise<StudentDto> {
    const { data } = await apiClient.post<StudentDto>(`/students/${studentId}/refill-class`, { amount });
    return data;
  },
};
