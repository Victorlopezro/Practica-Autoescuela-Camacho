import apiClient from './client';
import type { IStudentService, StudentDto, PaginatedStudents, CreateStudentDTO, UpdateStudentDTO } from '../interfaces/student.service';

export const studentApi: IStudentService = {
  async list(page = 1, limit = 20): Promise<PaginatedStudents> {
    const { data } = await apiClient.get<PaginatedStudents>('/students', {
      params: { page, limit },
    });
    return data;
  },

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

  async createStudent(data: CreateStudentDTO): Promise<StudentDto> {
    const { data: result } = await apiClient.post<StudentDto>('/students', data);
    return result;
  },

  async updateStudent(id: string, data: UpdateStudentDTO): Promise<StudentDto> {
    const { data: result } = await apiClient.patch<StudentDto>(`/students/${id}`, data);
    return result;
  },

  async deleteStudent(id: string): Promise<void> {
    await apiClient.delete(`/students/${id}`);
  },
};
