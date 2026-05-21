import type { AdminPlanningDto } from '@/lib/dto/admin-planning.dto';

export interface IAdminService {
  getPlanning(from: string, to: string): Promise<AdminPlanningDto>;
}
