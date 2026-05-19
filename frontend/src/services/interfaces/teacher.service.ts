export interface TeacherDto {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherStatsDto {
  totalReservations?: number;
  completedReservations?: number;
  // Add fields based on actual backend response
}

export interface ITeacherService {
  list(): Promise<TeacherDto[]>;
  getStats(teacherId: string): Promise<TeacherStatsDto>;
}
