import apiClient from './client';
import type { IAdminService } from '../interfaces/admin.service';
import type { AdminPlanningDto } from '@/lib/dto/admin-planning.dto';

export const adminApi: IAdminService = {
  async getPlanning(from: string, to: string): Promise<AdminPlanningDto> {
    const { data } = await apiClient.get<AdminPlanningDto>('/admin/planning', {
      params: { from, to },
    });
    return data;
  },
};
