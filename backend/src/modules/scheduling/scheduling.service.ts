import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RuleEngineService } from './rule-engine.service';
import { endOfDay, startOfDay, parseISO } from 'date-fns';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  async getTeacherAvailability(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const [availability, overrides] = await Promise.all([
      this.prisma.teacherAvailability.findMany({
        where: { teacherId },
        orderBy: { dayOfWeek: 'asc' },
      }),
      this.prisma.availabilityOverride.findMany({
        where: { teacherId },
        orderBy: { date: 'asc' },
      }),
    ]);

    return {
      teacherId,
      doubleSession: teacher.doubleSession,
      availability,
      overrides,
    };
  }

  async setAvailability(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ) {
    try {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
      });
      if (!teacher) throw new NotFoundException('Teacher not found');

      // Validate time format
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new BadRequestException('Time must be in HH:mm format');
      }

      // Validate start < end
      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      return this.prisma.teacherAvailability.upsert({
        where: {
          teacherId_dayOfWeek: { teacherId, dayOfWeek },
        },
        create: { teacherId, dayOfWeek, startTime, endTime },
        update: { startTime, endTime },
      });
    } catch (error) {
      this.logger.error(
        `setAvailability failed for teacher ${teacherId} day ${dayOfWeek}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async removeAvailability(teacherId: string, dayOfWeek: number) {
    try {
      await this.prisma.teacherAvailability.delete({
        where: {
          teacherId_dayOfWeek: { teacherId, dayOfWeek },
        },
      });
    } catch {
      throw new NotFoundException('Availability entry not found');
    }
  }

  async setOverride(
    teacherId: string,
    date: string,
    isAvailable: boolean,
    startTime?: string,
    endTime?: string,
    reason?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const dateObj = parseISO(date);

    // If setting unavailable, clear time fields
    if (!isAvailable) {
      return this.prisma.availabilityOverride.upsert({
        where: {
          teacherId_date: { teacherId, date: dateObj },
        },
        create: { teacherId, date: dateObj, isAvailable: false },
        update: { isAvailable: false, startTime: null, endTime: null },
      });
    }

    // Available with custom hours — validate
    if (startTime && endTime) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        throw new BadRequestException('Time must be in HH:mm format');
      }
      if (startTime >= endTime) {
        throw new BadRequestException('Start time must be before end time');
      }
    }

    return this.prisma.availabilityOverride.upsert({
      where: {
        teacherId_date: { teacherId, date: dateObj },
      },
      create: {
        teacherId,
        date: dateObj,
        isAvailable,
        startTime,
        endTime,
        reason,
      },
      update: {
        isAvailable,
        startTime,
        endTime,
        reason,
      },
    });
  }

  async removeOverride(teacherId: string, date: string) {
    const dateObj = parseISO(date);
    try {
      await this.prisma.availabilityOverride.delete({
        where: {
          teacherId_date: { teacherId, date: dateObj },
        },
      });
    } catch {
      throw new NotFoundException('Override not found');
    }
  }

  async getAvailableSlotsInRange(
    teacherId: string,
    startDate: string,
    days: number,
    vehicleType: string,
    doubleSession?: boolean,
    studentId?: string,
  ) {
    // 1. Fetch teacher + vehicle config ONCE (not per day)
    const [teacher, typeConfig] = await Promise.all([
      this.prisma.teacher.findUnique({ where: { id: teacherId } }),
      this.prisma.vehicleTypeConfig.findUnique({ where: { type: vehicleType } }),
    ]);
    if (!teacher) throw new NotFoundException('Teacher not found');

    const baseSlotDuration = typeConfig?.duration ?? 45;
    const effectiveDuration =
      doubleSession && teacher.doubleSession
        ? baseSlotDuration * 2
        : baseSlotDuration;

    const start = parseISO(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    // 2. Batch-fetch ALL availability + overrides + reservations in ONE round-trip each
    const [availability, overrides, reservations] = await Promise.all([
      this.prisma.teacherAvailability.findMany({
        where: { teacherId },
        orderBy: { dayOfWeek: 'asc' },
      }),
      this.prisma.availabilityOverride.findMany({
        where: { teacherId, date: { gte: start, lte: end } },
        orderBy: { date: 'asc' },
      }),
      this.prisma.reservation.findMany({
        where: {
          teacherId,
          startTime: { gte: start, lte: end },
          status: { notIn: ['cancelled'] },
        },
        select: { startTime: true, duration: true, studentId: true },
      }),
    ]);

    // 2.5 Build student license type map for overlap checking
    const allStudentIds = [...new Set(reservations.map((r) => r.studentId))];
    const studentLicenses =
      allStudentIds.length > 0
        ? await this.prisma.student.findMany({
            where: { id: { in: allStudentIds } },
            select: { id: true, licenseType: true },
          })
        : [];
    const licenseTypeMap = new Map(
      studentLicenses.map((s) => [s.id, s.licenseType]),
    );

    // 2.6 Lookup student context for personalized slot listing
    let slotStudentContext: { licenseType: string } | undefined;
    if (studentId) {
      const slotStudent = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { licenseType: true },
      });
      if (slotStudent?.licenseType) {
        slotStudentContext = { licenseType: slotStudent.licenseType };
      }
    }

    // 3. Build lookup maps for O(1) access
    const availabilityMap = new Map(
      availability.map((a) => [a.dayOfWeek, a]),
    );
    const overrideMap = new Map<string, (typeof overrides)[0]>();
    for (const o of overrides) {
      const oDate = o.date instanceof Date ? o.date : new Date(o.date);
      overrideMap.set(oDate.toISOString().split('T')[0], o);
    }

    // 4. Compute slots for each day in-memory
    const results: Array<{
      date: string;
      slots: string[];
      slotDuration: number;
    }> = [];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      // Check override
      const override = overrideMap.get(dateStr);
      if (override && !override.isAvailable) {
        results.push({
          date: dateStr,
          slots: [],
          slotDuration: effectiveDuration,
        });
        continue;
      }

      // Determine effective time range
      let slotStartTime: string | null = null;
      let slotEndTime: string | null = null;

      if (override && override.startTime && override.endTime) {
        slotStartTime = override.startTime;
        slotEndTime = override.endTime;
      } else {
        const base = availabilityMap.get(dayOfWeek);
        if (base) {
          slotStartTime = base.startTime;
          slotEndTime = base.endTime;
        }
      }

      if (!slotStartTime || !slotEndTime) {
        results.push({
          date: dateStr,
          slots: [],
          slotDuration: effectiveDuration,
        });
        continue;
      }

      // Filter reservations for this specific day
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayReservations = reservations.filter(
        (r) => r.startTime >= dayStart && r.startTime <= dayEnd,
      );

      // Generate slots
      const slots: string[] = [];
      const [startH, startM] = slotStartTime.split(':').map(Number);
      const [endH, endM] = slotEndTime.split(':').map(Number);

      let currentMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      while (currentMin + effectiveDuration <= endMin) {
        const slotStart = new Date(currentDate);
        slotStart.setHours(0, currentMin, 0, 0);
        const slotEndTs = new Date(
          slotStart.getTime() + effectiveDuration * 60 * 1000,
        );

        // Check overlap with existing reservations (in-memory)
        const overlappingRes = dayReservations.filter((r) => {
          const resEnd = new Date(
            r.startTime.getTime() + r.duration * 60 * 1000,
          );
          return slotStart < resEnd && r.startTime < slotEndTs;
        });

        // Build context — include overlap info if detected
        const slotTimeStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
        const ruleContext: import('./rule-engine.service').RuleContext = {
          teacherId,
          date: dateStr,
          startTime: slotTimeStr,
          duration: effectiveDuration,
          vehicleType,
          doubleSession: !!(doubleSession && teacher.doubleSession),
          ...(slotStudentContext ? { student: slotStudentContext } : {}),
        };

        if (overlappingRes.length > 0) {
          const overlappingLicenses = [
            ...new Set(
              overlappingRes
                .map((r) => licenseTypeMap.get(r.studentId))
                .filter(Boolean),
            ),
          ] as string[];
          ruleContext.overlappingLicenseTypes = overlappingLicenses;
          ruleContext.overlappingCount = overlappingRes.length;
        }

        // Rule engine filtering (feature-flag guarded)
        if (process.env.RULES_ENGINE_ENABLED === 'true') {
          const result =
            await this.ruleEngine.canCreateReservation(ruleContext);

          if (result.blocked) {
            currentMin += effectiveDuration;
            continue;
          }
        }

        slots.push(slotStart.toISOString());
        currentMin += effectiveDuration;
      }

      results.push({
        date: dateStr,
        slots,
        slotDuration: effectiveDuration,
      });
    }

    return { teacherId, vehicleType, days: results };
  }

  async getAvailableSlots(
    teacherId: string,
    date: string,
    vehicleType: string,
    doubleSession?: boolean,
    studentId?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Get vehicle type duration upfront
    const typeConfig = await this.prisma.vehicleTypeConfig.findUnique({
      where: { type: vehicleType },
    });
    const slotDuration = typeConfig?.duration ?? 45;

    const dateObj = parseISO(date);
    const dayOfWeek = dateObj.getDay();

    // Get base availability for the day
    const baseAvailability = await this.prisma.teacherAvailability.findUnique({
      where: {
        teacherId_dayOfWeek: { teacherId, dayOfWeek },
      },
    });

    // Check for override
    const override = await this.prisma.availabilityOverride.findUnique({
      where: {
        teacherId_date: { teacherId, date: dateObj },
      },
    });

    // If override marks as unavailable, no slots
    if (override && !override.isAvailable) {
      return {
        date,
        slots: [],
        slotDuration,
        doubleSession: teacher.doubleSession,
      };
    }

    // Determine effective time range
    let startTime: string;
    let endTime: string;

    if (override && override.startTime && override.endTime) {
      startTime = override.startTime;
      endTime = override.endTime;
    } else if (baseAvailability) {
      startTime = baseAvailability.startTime;
      endTime = baseAvailability.endTime;
    } else {
      return {
        date,
        slots: [],
        slotDuration,
        doubleSession: teacher.doubleSession,
      };
    }

    // Get existing reservations for conflict check
    const dayStart = startOfDay(dateObj);
    const dayEnd = endOfDay(dateObj);

    const existingReservations = await this.prisma.reservation.findMany({
      where: {
        teacherId,
        startTime: { gte: dayStart, lte: dayEnd },
        status: { notIn: ['cancelled'] },
      },
      select: { startTime: true, duration: true, studentId: true },
    });

    // Build student license type map for overlap checking
    const singleStudentIds = [
      ...new Set(existingReservations.map((r) => r.studentId)),
    ];
    const singleStudentLicenses =
      singleStudentIds.length > 0
        ? await this.prisma.student.findMany({
            where: { id: { in: singleStudentIds } },
            select: { id: true, licenseType: true },
          })
        : [];
    const singleLicenseMap = new Map(
      singleStudentLicenses.map((s) => [s.id, s.licenseType]),
    );

    // Lookup student context for personalized slot listing
    let singleSlotStudentContext: { licenseType: string } | undefined;
    if (studentId) {
      const singleStudent = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { licenseType: true },
      });
      if (singleStudent?.licenseType) {
        singleSlotStudentContext = { licenseType: singleStudent.licenseType };
      }
    }

    // Generate slots — grid increment matches effectiveDuration
    const slots: string[] = [];
    const effectiveDuration =
      doubleSession && teacher.doubleSession ? slotDuration * 2 : slotDuration;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let currentMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    while (currentMin + effectiveDuration <= endMin) {
      const slotStart = new Date(dateObj);
      slotStart.setHours(0, currentMin, 0, 0);
      const slotEnd = new Date(
        slotStart.getTime() + effectiveDuration * 60 * 1000,
      );

      // Check overlap with existing reservations
      const overlappingRes = existingReservations.filter((r) => {
        const resEnd = new Date(r.startTime.getTime() + r.duration * 60 * 1000);
        return slotStart < resEnd && r.startTime < slotEnd;
      });

      // Build context — include overlap info if detected
      const slotTimeStr = `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`;
      const ruleContext: import('./rule-engine.service').RuleContext = {
        teacherId,
        date,
        startTime: slotTimeStr,
        duration: effectiveDuration,
        vehicleType,
        doubleSession: !!(doubleSession && teacher.doubleSession),
        ...(singleSlotStudentContext
          ? { student: singleSlotStudentContext }
          : {}),
      };

      if (overlappingRes.length > 0) {
        const overlappingLicenses = [
          ...new Set(
            overlappingRes
              .map((r) => singleLicenseMap.get(r.studentId))
              .filter(Boolean),
          ),
        ] as string[];
        ruleContext.overlappingLicenseTypes = overlappingLicenses;
        ruleContext.overlappingCount = overlappingRes.length;
      }

      // Rule engine filtering (feature-flag guarded)
      if (process.env.RULES_ENGINE_ENABLED === 'true') {
        const result = await this.ruleEngine.canCreateReservation(ruleContext);

        if (result.blocked) {
          currentMin += effectiveDuration;
          continue;
        }
      }

      slots.push(slotStart.toISOString());

      currentMin += effectiveDuration;
    }

    return {
      date,
      slots,
      slotDuration: effectiveDuration,
      doubleSession: teacher.doubleSession,
    };
  }
}
