import apiClient from './client';
import type { IVehicleService, VehicleDto, VehicleIncidentDto } from '../interfaces/vehicle.service';

export const vehicleApi: IVehicleService = {
  async list(params = {}): Promise<{ data: VehicleDto[]; total: number }> {
    const { data } = await apiClient.get('/vehicles', { params });
    return data;
  },

  async getById(id: string): Promise<VehicleDto> {
    const { data } = await apiClient.get<VehicleDto>(`/vehicles/${id}`);
    return data;
  },

  async create(body: { plate: string; type: string; itvExpiry?: string }): Promise<VehicleDto> {
    const { data } = await apiClient.post<VehicleDto>('/vehicles', body);
    return data;
  },

  async update(id: string, body: Record<string, unknown>): Promise<VehicleDto> {
    const { data } = await apiClient.patch<VehicleDto>(`/vehicles/${id}`, body);
    return data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vehicles/${id}`);
  },

  async getIncidents(vehicleId: string): Promise<VehicleIncidentDto[]> {
    const { data } = await apiClient.get<VehicleIncidentDto[]>(`/vehicles/${vehicleId}/incidents`);
    return data;
  },

  async createIncident(vehicleId: string, body: { description: string; date: string }): Promise<VehicleIncidentDto> {
    const { data } = await apiClient.post<VehicleIncidentDto>(`/vehicles/${vehicleId}/incidents`, body);
    return data;
  },
};
