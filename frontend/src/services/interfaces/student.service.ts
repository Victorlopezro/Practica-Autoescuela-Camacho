export interface StudentUserProfile {
  id: string;
  username: string;
  name: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
}

export interface StudentDto {
  id: string;
  userId: string;
  teacherId: string | null;
  remainingClasses: number;
  balanceHistory: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface StudentWithUserDto extends StudentDto {
  user: StudentUserProfile | null;
}

export interface PaginatedStudents {
  data: StudentWithUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IStudentService {
  list(page?: number, limit?: number): Promise<PaginatedStudents>;
  getProfile(studentId: string): Promise<StudentDto>;
  getBalance(studentId: string): Promise<Pick<StudentDto, 'remainingClasses' | 'balanceHistory'>>;
  deductClass(studentId: string, duration: number): Promise<StudentDto>;
  refillClass(studentId: string, amount: number): Promise<StudentDto>;
}
