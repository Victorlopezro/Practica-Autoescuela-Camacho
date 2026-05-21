import apiClient from './client';
import type {
  ISchedulingService,
  TeacherAvailabilityDto,
  SlotResultDto,
  SlotRangeResultDto,
  VehicleTypeConfigDto,
  ValidationResultDto,
} from '../interfaces/scheduling.service';

export const schedulingApi: ISchedulingService = {
  async getTeacherAvailability(teacherId: string): Promise<TeacherAvailabilityDto> {
    const { data } = await apiClient.get<TeacherAvailabilityDto>(`/scheduling/teachers/${teacherId}/availability`);
    return data;
  },

  async setAvailability(teacherId: string, dayOfWeek: number, startTime: string, endTime: string): Promise<void> {
    await apiClient.post(`/scheduling/teachers/${teacherId}/availability`, { dayOfWeek, startTime, endTime });
  },

  async removeAvailability(teacherId: string, dayOfWeek: number): Promise<void> {
    await apiClient.delete(`/scheduling/teachers/${teacherId}/availability/${dayOfWeek}`);
  },

  async setOverride(teacherId: string, date: string, isAvailable: boolean, startTime?: string, endTime?: string, reason?: string): Promise<void> {
    await apiClient.post(`/scheduling/teachers/${teacherId}/overrides`, { date, isAvailable, startTime, endTime, reason });
  },

  async removeOverride(teacherId: string, date: string): Promise<void> {
    await apiClient.delete(`/scheduling/teachers/${teacherId}/overrides/${date}`);
  },

  async getSlotsRange(teacherId: string, startDate: string, vehicleType: string, days = 30, doubleSession?: boolean): Promise<SlotRangeResultDto> {
    const { data } = await apiClient.get<SlotRangeResultDto>('/scheduling/slots/range', {
      params: { teacherId, startDate, vehicleType, days, doubleSession: doubleSession ? 'true' : undefined },
    });
    return data;
  },

  async getSlots(teacherId: string, date: string, vehicleType: string, doubleSession?: boolean): Promise<SlotResultDto> {
    const { data } = await apiClient.get<SlotResultDto>('/scheduling/slots', {
      params: { teacherId, date, vehicleType, doubleSession: doubleSession ? 'true' : undefined },
    });
    return data;
  },

  async validateSlot(teacherId: string, studentId: string, vehicleType: string, startTime: string, duration: number, doubleSession?: boolean): Promise<ValidationResultDto> {
    const { data } = await apiClient.post<ValidationResultDto>('/scheduling/validate', {
      teacherId, studentId, vehicleType, startTime, duration, doubleSession: doubleSession ? 'true' : 'false',
    });
    return data;
  },

  async getVehicleTypeConfig(): Promise<VehicleTypeConfigDto[]> {
    const { data } = await apiClient.get<VehicleTypeConfigDto[]>('/scheduling/config/vehicle-types');
    return data;
  },
};
