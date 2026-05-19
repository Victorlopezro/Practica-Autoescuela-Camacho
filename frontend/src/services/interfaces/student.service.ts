// Based on backend GET /v1/students/:id response
export interface StudentDto {
  id: string;
  userId: string;
  remainingClasses: number;
  balanceHistory: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface IStudentService {
  getProfile(studentId: string): Promise<StudentDto>;
  getBalance(studentId: string): Promise<Pick<StudentDto, 'remainingClasses' | 'balanceHistory'>>;
  deductClass(studentId: string, duration: number): Promise<StudentDto>;
  refillClass(studentId: string, amount: number): Promise<StudentDto>;
}
