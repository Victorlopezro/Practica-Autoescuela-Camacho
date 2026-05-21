import apiClient from './client';
import type { ITeacherService, TeacherDto, TeacherWithUserDto, TeacherStatsDto, CreateTeacherDTO, UpdateTeacherDTO } from '../interfaces/teacher.service';

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

  async createTeacher(data: CreateTeacherDTO): Promise<TeacherDto> {
    const { data: result } = await apiClient.post<TeacherDto>('/teachers', data);
    return result;
  },

  async updateTeacher(id: string, data: UpdateTeacherDTO): Promise<TeacherDto> {
    const { data: result } = await apiClient.patch<TeacherDto>(`/teachers/${id}`, data);
    return result;
  },

  async deleteTeacher(id: string): Promise<void> {
    await apiClient.delete(`/teachers/${id}`);
  },
};
