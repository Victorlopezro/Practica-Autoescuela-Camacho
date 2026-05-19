export interface TeacherUserProfile {
  id: string;
  username: string;
  name: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

export interface TeacherDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherWithUserDto extends TeacherDto {
  user: TeacherUserProfile | null;
}

export interface TeacherStatsDto {
  id: string;
  name: string;
  totalReservations: number;
  upcomingReservations: number;
  completedReservations: number;
}

export interface ITeacherService {
  list(): Promise<TeacherDto[]>;
  getById(id: string): Promise<TeacherWithUserDto>;
  getStats(teacherId: string): Promise<TeacherStatsDto>;
}
