import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  startOfDay,
  endOfDay,
  parseISO,
  addDays,
  eachDayOfInterval,
  format,
} from 'date-fns';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import {
  RuleEngineService,
  RuleContext,
} from '../scheduling/rule-engine.service';
import type { TeacherAvailability, AvailabilityOverride } from '@prisma/client';
import type {
  AdminPlanningDto,
  TeacherPlanningDto,
  DayPlanningDto,
  PlanningReservationDto,
} from './dto/admin-planning.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller({ path: 'admin/planning', version: '1' })
export class AdminPlanningController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduling: SchedulingService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  @Get()
  @Roles('admin:manage')
  @ApiOperation({
    summary: 'Get planning overview for all teachers in a date range',
  })
  async getPlanning(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AdminPlanningDto> {
    const today = new Date();
    const fromDate = from ? parseISO(from) : addDays(today, -30);
    const toDate = to ? parseISO(to) : today;

    const fromStr = format(fromDate, 'yyyy-MM-dd');
    const toStr = format(toDate, 'yyyy-MM-dd');

    const teachers = await this.prisma.teacher.findMany({
      orderBy: { name: 'asc' },
    });

    const teacherPlannings = await Promise.all(
      teachers.map((t) => this.buildTeacherPlanning(t, fromStr, toStr)),
    );

    return {
      from: fromStr,
      to: toStr,
      teachers: teacherPlannings,
    };
  }

  private async buildTeacherPlanning(
    teacher: { id: string; name: string; doubleSession: boolean },
    from: string,
    to: string,
  ): Promise<TeacherPlanningDto> {
    const fromDate = parseISO(from);
    const toDate = parseISO(to);

    // Get availability data (base schedule + overrides)
    const availabilityData = await this.scheduling.getTeacherAvailability(
      teacher.id,
    );

    // Get all reservations in the date range for this teacher
    const reservations = await this.prisma.reservation.findMany({
      where: {
        teacherId: teacher.id,
        startTime: {
          gte: startOfDay(fromDate),
          lte: endOfDay(toDate),
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Enrich with student names (manual join: Student -> User)
    const studentIds = [...new Set(reservations.map((r) => r.studentId))];
    const students = await this.prisma.student.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, userId: true },
    });
    const userIds = students.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, lastName: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    const studentUserMap = new Map(
      students.map((s) => [s.id, userMap.get(s.userId) ?? null]),
    );

    // Build day-by-day planning
    const days = eachDayOfInterval({ start: fromDate, end: toDate });
    const dayPlannings: DayPlanningDto[] = await Promise.all(
      days.map((date) =>
        this.buildDayPlanning(
          teacher.id,
          date,
          availabilityData.availability,
          availabilityData.overrides,
          reservations,
          studentUserMap,
        ),
      ),
    );

    return {
      id: teacher.id,
      name: teacher.name,
      doubleSession: teacher.doubleSession,
      days: dayPlannings,
    };
  }

  private async buildDayPlanning(
    teacherId: string,
    date: Date,
    availability: TeacherAvailability[],
    overrides: AvailabilityOverride[],
    reservations: Array<{
      id: string;
      startTime: Date;
      duration: number;
      status: string;
      vehicleType: string;
      studentId: string;
    }>,
    studentUserMap: Map<
      string,
      { name: string | null; lastName: string | null } | null
    >,
  ): Promise<DayPlanningDto> {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check overrides for this date (now supports multiple tracks)
    const dateOverrides = overrides.filter((o) => {
      const oDate = o.date instanceof Date ? o.date : new Date(o.date);
      return format(oDate, 'yyyy-MM-dd') === dateStr;
    });

    // If ANY override marks as unavailable, the day is blocked
    const blockingOverride = dateOverrides.find((o) => !o.isAvailable);
    if (blockingOverride) {
      return {
        date: dateStr,
        dayOfWeek,
        isAvailable: false,
        reason: blockingOverride.reason ?? undefined,
        totalSlots: 0,
        bookedSlots: 0,
        freeSlots: 0,
        reservations: [],
      };
    }

    // Determine effective time range — aggregate across all track overrides
    let startTime: string | null = null;
    let endTime: string | null = null;

    const activeOverrides = dateOverrides.filter(
      (o) => o.startTime && o.endTime,
    );
    if (activeOverrides.length > 0) {
      // Use earliest start and latest end across all track overrides
      for (const o of activeOverrides) {
        if (!startTime || (o.startTime && o.startTime < startTime))
          startTime = o.startTime!;
        if (!endTime || (o.endTime && o.endTime > endTime))
          endTime = o.endTime!;
      }
    } else {
      // Fall back to base weekly schedule
      const base = availability.find((a) => a.dayOfWeek === dayOfWeek);
      if (base) {
        startTime = base.startTime;
        endTime = base.endTime;
      }
    }

    // No availability defined
    if (!startTime || !endTime) {
      return {
        date: dateStr,
        dayOfWeek,
        isAvailable: false,
        totalSlots: 0,
        bookedSlots: 0,
        freeSlots: 0,
        reservations: [],
      };
    }

    // Evaluate rule engine for this day/teacher
    const ruleContext: RuleContext = {
      teacherId,
      date: dateStr,
      startTime: startTime,
      duration: 45,
      vehicleType: 'coche-manual',
      doubleSession: false,
    };
    const ruleResults = await this.ruleEngine.evaluateTeacherRules(
      teacherId,
      ruleContext,
    );
    const blockingRule = ruleResults.find((r) => r.action === 'block');
    if (blockingRule) {
      return {
        date: dateStr,
        dayOfWeek,
        isAvailable: false,
        reason: blockingRule.reason,
        totalSlots: 0,
        bookedSlots: 0,
        freeSlots: 0,
        reservations: [],
      };
    }

    // Calculate total slots using 45-minute grid increment
    const gridIncrement = 45;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const totalSlots = Math.floor((endMin - startMin) / gridIncrement);

    // Filter reservations for this specific day
    const dayReservations = reservations.filter((r) => {
      const rDate =
        r.startTime instanceof Date ? r.startTime : new Date(r.startTime);
      return format(rDate, 'yyyy-MM-dd') === dateStr;
    });

    // Active reservations (non-cancelled, non-completed)
    const activeReservations = dayReservations.filter(
      (r) => r.status !== 'cancelled' && r.status !== 'completed',
    );

    const bookedSlots = activeReservations.reduce(
      (sum, r) => sum + Math.ceil(r.duration / gridIncrement),
      0,
    );

    const freeSlots = Math.max(0, totalSlots - bookedSlots);

    // Build reservation DTOs
    const reservationDtos: PlanningReservationDto[] = dayReservations.map(
      (r) => {
        const student = studentUserMap.get(r.studentId) ?? null;
        return {
          id: r.id,
          startTime:
            r.startTime instanceof Date
              ? r.startTime.toISOString()
              : new Date(r.startTime).toISOString(),
          duration: r.duration,
          status: r.status,
          vehicleType: r.vehicleType,
          student: student
            ? { name: student.name, lastName: student.lastName }
            : null,
        };
      },
    );

    return {
      date: dateStr,
      dayOfWeek,
      isAvailable: true,
      totalSlots,
      bookedSlots,
      freeSlots,
      reservations: reservationDtos,
    };
  }
}
