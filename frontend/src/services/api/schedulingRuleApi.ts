import apiClient from './client';
import type {
  SchedulingRuleDto,
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
  PaginatedRulesDto,
  CreateSchedulingRuleResponse,
  UpdateSchedulingRuleResponse,
} from '../interfaces/scheduling-rule.service';

export const schedulingRuleApi = {
  async findAll(query: SchedulingRuleQueryDto): Promise<PaginatedRulesDto> {
    const { data } = await apiClient.get('/scheduling/rules', { params: query });
    return data;
  },
  async findOne(id: string): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.get(`/scheduling/rules/${id}`);
    return data;
  },
  async create(dto: CreateSchedulingRuleDto): Promise<CreateSchedulingRuleResponse> {
    const { data } = await apiClient.post('/scheduling/rules', dto);
    return data;
  },
  async update(id: string, dto: UpdateSchedulingRuleDto): Promise<UpdateSchedulingRuleResponse> {
    const { data } = await apiClient.patch(`/scheduling/rules/${id}`, dto);
    return data;
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/scheduling/rules/${id}`);
  },
  async translate(id: string): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.post(`/scheduling/rules/${id}/translate`, {});
    return data;
  },
  async toggle(id: string, enabled: boolean): Promise<SchedulingRuleDto> {
    const { data } = await apiClient.patch(`/scheduling/rules/${id}`, { enabled });
    return data;
  },
};
