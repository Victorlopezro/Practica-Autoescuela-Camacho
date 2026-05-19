import apiClient from './client';
import type { IAuthService, LoginRequest, AuthResponse, AuthUserDto } from '../interfaces/auth.service';

export const authApi: IAuthService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { data: response } = await apiClient.post<AuthResponse>('/auth/login', data);
    return response;
  },

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const { data: response } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return response;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async getMe(): Promise<AuthUserDto> {
    const { data } = await apiClient.get<AuthUserDto>('/users/me');
    return data;
  },
};
