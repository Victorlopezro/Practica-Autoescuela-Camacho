export interface VehicleDto {
  id: string;
  plate: string;
  type: string;
  status: string;
  itvExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleIncidentDto {
  id: string;
  vehicleId: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface IVehicleService {
  list(params?: { type?: string; status?: string; page?: number; limit?: number }): Promise<{ data: VehicleDto[]; total: number }>;
  getById(id: string): Promise<VehicleDto>;
  create(data: { plate: string; type: string; itvExpiry?: string }): Promise<VehicleDto>;
  update(id: string, data: { plate?: string; type?: string; status?: string; itvExpiry?: string }): Promise<VehicleDto>;
  delete(id: string): Promise<void>;
  getIncidents(vehicleId: string): Promise<VehicleIncidentDto[]>;
  createIncident(vehicleId: string, data: { description: string; date: string }): Promise<VehicleIncidentDto>;
}
