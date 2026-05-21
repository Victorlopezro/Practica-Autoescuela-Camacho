import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { startOfDay, endOfDay, parseISO, addDays, eachDayOfInterval, format } from 'date-fns';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import type {
  TeacherAvailability,
  AvailabilityOverride,
} from '@prisma/client';
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
  ) {}

  @Get()
  @Roles('admin:manage')
  @ApiOperation({ summary: 'Get planning overview for all teachers in a date range' })
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
    const availabilityData =
      await this.scheduling.getTeacherAvailability(teacher.id);

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
    const dayPlannings: DayPlanningDto[] = days.map((date) =>
      this.buildDayPlanning(
        date,
        availabilityData.availability,
        availabilityData.overrides,
        reservations,
        studentUserMap,
      ),
    );

    return {
      id: teacher.id,
      name: teacher.name,
      doubleSession: teacher.doubleSession,
      days: dayPlannings,
    };
  }

  private buildDayPlanning(
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
  ): DayPlanningDto {
    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');

    // Check override for this date
    const override = overrides.find((o) => {
      const oDate = o.date instanceof Date ? o.date : new Date(o.date);
      return format(oDate, 'yyyy-MM-dd') === dateStr;
    });

    // If override marks as unavailable
    if (override && !override.isAvailable) {
      return {
        date: dateStr,
        dayOfWeek,
        isAvailable: false,
        reason: override.reason ?? undefined,
        totalSlots: 0,
        bookedSlots: 0,
        freeSlots: 0,
        reservations: [],
      };
    }

    // Determine effective time range
    let startTime: string | null = null;
    let endTime: string | null = null;

    if (override && override.startTime && override.endTime) {
      // Override with custom hours
      startTime = override.startTime;
      endTime = override.endTime;
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

    // Calculate total slots using 45-minute grid increment
    const gridIncrement = 45;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const totalSlots = Math.floor((endMin - startMin) / gridIncrement);

    // Filter reservations for this specific day
    const dayReservations = reservations.filter((r) => {
      const rDate = r.startTime instanceof Date ? r.startTime : new Date(r.startTime);
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
