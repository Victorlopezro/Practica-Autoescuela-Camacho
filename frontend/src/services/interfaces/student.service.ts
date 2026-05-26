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
  licenseType?: string;
  licenseSubType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChangeSubTypeResponse {
  id: string;
  previousSubType: string;
  newSubType: string;
  futureReservationsCancelled: number;
  classesRefunded: number;
}

export interface StudentWithUserDto extends StudentDto {
  user: StudentUserProfile | null;
}

export interface CreateStudentDTO {
  username: string;
  password: string;
  name: string;
  lastName?: string;
  email?: string;
  phone?: string;
  licenseType?: string;
  licenseSubType?: string;
  teacherId?: string;
}

export interface UpdateStudentDTO {
  username?: string;
  password?: string;
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  licenseType?: string;
  licenseSubType?: string;
  teacherId?: string;
}

export interface PaginatedStudents {
  data: StudentWithUserDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IStudentService {
  list(page?: number, limit?: number, search?: string): Promise<PaginatedStudents>;
  getProfile(studentId: string): Promise<StudentDto>;
  getBalance(studentId: string): Promise<Pick<StudentDto, 'remainingClasses' | 'balanceHistory'>>;
  deductClass(studentId: string, duration: number): Promise<StudentDto>;
  refillClass(studentId: string, amount: number): Promise<StudentDto>;
  adjustBalance(studentId: string, amount: number, reason: string): Promise<StudentDto>;
  createStudent(data: CreateStudentDTO): Promise<StudentDto>;
  updateStudent(id: string, data: UpdateStudentDTO): Promise<StudentDto>;
  deleteStudent(id: string): Promise<void>;
  changeSubType(studentId: string): Promise<ChangeSubTypeResponse>;
}
