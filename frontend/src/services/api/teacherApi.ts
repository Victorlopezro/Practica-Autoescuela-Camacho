import apiClient from './client';
import type { ITeacherService, TeacherDto, TeacherStatsDto } from '../interfaces/teacher.service';

export const teacherApi: ITeacherService = {
  async list(): Promise<TeacherDto[]> {
    const { data } = await apiClient.get<{ data: TeacherDto[] }>('/teachers');
    return data.data;
  },

  async getStats(teacherId: string): Promise<TeacherStatsDto> {
    const { data } = await apiClient.get<TeacherStatsDto>(`/teachers/${teacherId}/stats`);
    return data;
  },
};
