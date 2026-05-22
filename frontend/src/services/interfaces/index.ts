export type { IAuthService, LoginRequest, AuthResponse, AuthUserDto } from './auth.service';
export type { IStudentService, StudentDto, StudentWithUserDto, CreateStudentDTO, UpdateStudentDTO } from './student.service';
export type { ITeacherService, TeacherDto, TeacherWithUserDto, TeacherStatsDto, CreateTeacherDTO, UpdateTeacherDTO } from './teacher.service';
export type { IVehicleService, VehicleDto, VehicleIncidentDto } from './vehicle.service';
export type { IReservationService, ReservationDto, AvailabilitySlot, CalendarReservationDto } from './reservation.service';
export type { IPaymentService } from './payment.service';
export type { ISchedulingService, TeacherAvailabilityDto, WeeklyAvailabilityDto, OverrideDto, SlotResultDto, SlotRangeDayDto, SlotRangeResultDto, VehicleTypeConfigDto, ValidationResultDto } from './scheduling.service';
export type { IAdminService } from './admin.service';
export type {
  ISchedulingRuleService,
  SchedulingRuleDto,
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
  PaginatedRulesDto,
  RuleType,
  RULE_TYPES,
} from './scheduling-rule.service';
