export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthUserDto {
  id: string;
  username: string;
  name: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  teacherId: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

export interface IAuthService {
  login(data: LoginRequest): Promise<AuthResponse>;
  refresh(refreshToken: string): Promise<AuthResponse>;
  logout(refreshToken: string): Promise<void>;
  getMe(): Promise<AuthUserDto>;
}
