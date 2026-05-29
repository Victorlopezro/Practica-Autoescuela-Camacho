export type { IAuthService, LoginRequest, AuthResponse, AuthUserDto } from './auth.service';
export type { IStudentService, StudentDto, StudentWithUserDto, CreateStudentDTO, UpdateStudentDTO, PaginatedStudents, ChangeSubTypeResponse } from './student.service';
export type { ITeacherService, TeacherDto, TeacherWithUserDto, TeacherStatsDto, CreateTeacherDTO, UpdateTeacherDTO } from './teacher.service';
export type { IVehicleService, VehicleDto, VehicleIncidentDto } from './vehicle.service';
export type { IReservationService, ReservationDto, AvailabilitySlot, CalendarReservationDto } from './reservation.service';
export type { IPaymentService } from './payment.service';
export type { ISchedulingService, TeacherAvailabilityDto, WeeklyAvailabilityDto, OverrideDto, SlotResultDto, SlotRangeDayDto, SlotRangeResultDto, VehicleTypeConfigDto, ValidationResultDto, BatchOverrideEntry, BatchOverrideResult, CopyWeekOverridesDto, CopyWeekResult } from './scheduling.service';
export type { IAdminService } from './admin.service';
export type {
  ISchedulingRuleService,
  SchedulingRuleDto,
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  CreateSchedulingRuleResponse,
  UpdateSchedulingRuleResponse,
  GenerationResult,
  SchedulingRuleQueryDto,
  PaginatedRulesDto,
  RuleType,
  RuleAction,
  RuleCategory,
  AppliesTo,
  GenerationAction,
} from './scheduling-rule.service';
export {
  RULE_TYPES,
  RULE_ACTIONS,
  RULE_CATEGORIES,
  GENERATION_ACTIONS,
} from './scheduling-rule.service';
