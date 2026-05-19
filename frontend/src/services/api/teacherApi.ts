import apiClient from './client';
import type { ITeacherService, TeacherDto, TeacherWithUserDto, TeacherStatsDto } from '../interfaces/teacher.service';

export const teacherApi: ITeacherService = {
  async list(): Promise<TeacherDto[]> {
    const { data } = await apiClient.get<{ data: TeacherDto[] }>('/teachers');
    return data.data;
  },

  async getById(id: string): Promise<TeacherWithUserDto> {
    const { data } = await apiClient.get<TeacherWithUserDto>(`/teachers/${id}`);
    return data;
  },

  async getStats(teacherId: string): Promise<TeacherStatsDto> {
    const { data } = await apiClient.get<TeacherStatsDto>(`/teachers/${teacherId}/stats`);
    return data;
  },
};
