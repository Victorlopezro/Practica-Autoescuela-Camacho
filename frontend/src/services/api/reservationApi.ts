import apiClient from './client';
import type { IReservationService, ReservationDto, AvailabilitySlot } from '../interfaces/reservation.service';

export const reservationApi: IReservationService = {
  async list(params = {}): Promise<{ data: ReservationDto[]; total: number }> {
    const { data } = await apiClient.get('/reservations', { params });
    return data;
  },

  async getById(id: string): Promise<ReservationDto> {
    const { data } = await apiClient.get<ReservationDto>(`/reservations/${id}`);
    return data;
  },

  async create(body: { studentId: string; teacherId: string; vehicleType: string; startTime: string; duration: number }): Promise<ReservationDto> {
    const { data } = await apiClient.post<ReservationDto>('/reservations', body);
    return data;
  },

  async confirm(id: string): Promise<ReservationDto> {
    const { data } = await apiClient.patch<ReservationDto>(`/reservations/${id}/confirm`);
    return data;
  },

  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/reservations/${id}`);
  },

  async complete(id: string): Promise<ReservationDto> {
    const { data } = await apiClient.patch<ReservationDto>(`/reservations/${id}/complete`);
    return data;
  },

  async getAvailability(date: string, teacherId: string, duration = 45): Promise<AvailabilitySlot[]> {
    const { data } = await apiClient.get<AvailabilitySlot[]>('/availability', {
      params: { date, teacherId, duration },
    });
    return data;
  },
};
