import apiClient from './client';
import type {
  SchedulingRuleDto,
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
  PaginatedRulesDto,
} from '../interfaces/scheduling-rule.service';

export const schedulingRuleApi = {
  async findAll(query: SchedulingRuleQueryDto): Promise<PaginatedRulesDto> {
    const { data } = await apiClient.get('/v1/scheduling/rules', { params: query });
    return data;
  },
  async findOne(id: string): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.get(`/v1/scheduling/rules/${id}`);
    return data;
  },
  async create(dto: CreateSchedulingRuleDto): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.post('/v1/scheduling/rules', dto);
    return data;
  },
  async update(id: string, dto: UpdateSchedulingRuleDto): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.patch(`/v1/scheduling/rules/${id}`, dto);
    return data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/v1/scheduling/rules/${id}`);
  },
  async translate(id: string): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.post(`/v1/scheduling/rules/${id}/translate`, {});
    return data;
  },
  async toggle(id: string, enabled: boolean): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.patch(`/v1/scheduling/rules/${id}`, { enabled });
    return data;
  },
};
