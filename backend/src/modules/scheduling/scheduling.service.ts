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

  private timeRangesOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    return start1 < end2 && start2 < end1;
  }

  async setAvailability(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    track?: string,
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

      // Cross-track overlap validation: fetch ALL entries for this teacher+day
      const existingEntries = await this.prisma.teacherAvailability.findMany({
        where: { teacherId, dayOfWeek },
      });

      for (const entry of existingEntries) {
        // Skip the entry we're updating (same track)
        if (entry.track === (track ?? null)) continue;

        // Check time overlap with entries on other tracks
        if (
          this.timeRangesOverlap(
            startTime,
            endTime,
            entry.startTime,
            entry.endTime,
          )
        ) {
          throw new BadRequestException(
            `Time range overlaps with existing availability on ${entry.track ?? 'default'} track (${entry.startTime}-${entry.endTime})`,
          );
        }
      }

      // Use findFirst to check for existing entry, then create or update
      // (avoiding Prisma upsert issues with nullable compound keys)
      const existing = await this.prisma.teacherAvailability.findFirst({
        where: { teacherId, dayOfWeek, track: track ?? null },
      });

      if (existing) {
        return this.prisma.teacherAvailability.update({
          where: { id: existing.id },
          data: { startTime, endTime },
        });
      }

      return this.prisma.teacherAvailability.create({
        data: { teacherId, dayOfWeek, startTime, endTime, track },
      });
    } catch (error) {
      this.logger.error(
        `setAvailability failed for teacher ${teacherId} day ${dayOfWeek}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  async removeAvailability(
    teacherId: string,
    dayOfWeek: number,
    track?: string,
  ) {
    try {
      // Use findFirst then delete to handle nullable compound key
      const entry = await this.prisma.teacherAvailability.findFirst({
        where: { teacherId, dayOfWeek, track: track ?? null },
      });
      if (!entry) throw new NotFoundException('Availability entry not found');
      await this.prisma.teacherAvailability.delete({
        where: { id: entry.id },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
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
    track?: string,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const dateObj = parseISO(date);

    // If setting unavailable, clear time fields
    if (!isAvailable) {
      try {
        const existing = await this.prisma.availabilityOverride.findFirst({
          where: { teacherId, date: dateObj, track: track ?? null },
        });
        if (existing) {
          return this.prisma.availabilityOverride.update({
            where: { id: existing.id },
            data: { isAvailable: false, startTime: null, endTime: null },
          });
        }
        return this.prisma.availabilityOverride.create({
          data: {
            teacherId,
            date: dateObj,
            isAvailable: false,
            track: track ?? null,
          },
        });
      } catch (err) {
        this.logger.error(
          `setOverride(!isAvailable) failed for teacher ${teacherId} date ${date}: ${(err as Error).message}`,
          (err as Error).stack,
        );
        throw err;
      }
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

    try {
      const existing = await this.prisma.availabilityOverride.findFirst({
        where: { teacherId, date: dateObj, track: track ?? null },
      });

      if (existing) {
        return this.prisma.availabilityOverride.update({
          where: { id: existing.id },
          data: { isAvailable, startTime, endTime, reason },
        });
      }

      return this.prisma.availabilityOverride.create({
        data: {
          teacherId,
          date: dateObj,
          isAvailable,
          startTime,
          endTime,
          reason,
          track: track ?? null,
        },
      });
    } catch (err) {
      this.logger.error(
        `setOverride(isAvailable=true) failed for teacher ${teacherId} date ${date}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }

  async removeOverride(teacherId: string, date: string, track?: string) {
    const dateObj = parseISO(date);
    const existing = await this.prisma.availabilityOverride.findFirst({
      where: { teacherId, date: dateObj, track: track ?? null },
    });
    if (!existing) throw new NotFoundException('Override not found');
    await this.prisma.availabilityOverride.delete({
      where: { id: existing.id },
    });
  }

  async batchSetOverrides(
    teacherId: string,
    overrides: Array<{
      date: string;
      isAvailable: boolean;
      startTime?: string;
      endTime?: string;
      reason?: string;
      track?: string;
    }>,
  ) {
    if (overrides.length === 0) {
      throw new BadRequestException('At least one override is required');
    }

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    // Validate time formats for all entries
    for (const override of overrides) {
      if (override.startTime || override.endTime) {
        const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (override.startTime && !timeRegex.test(override.startTime)) {
          throw new BadRequestException(
            `Invalid startTime format: ${override.startTime}`,
          );
        }
        if (override.endTime && !timeRegex.test(override.endTime)) {
          throw new BadRequestException(
            `Invalid endTime format: ${override.endTime}`,
          );
        }
        if (
          override.startTime &&
          override.endTime &&
          override.startTime >= override.endTime
        ) {
          throw new BadRequestException('Start time must be before end time');
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const results = [];
      for (const override of overrides) {
        const dateObj = parseISO(override.date);

        const existing = await tx.availabilityOverride.findFirst({
          where: { teacherId, date: dateObj, track: override.track ?? null },
        });

        if (existing) {
          results.push(
            await tx.availabilityOverride.update({
              where: { id: existing.id },
              data: {
                isAvailable: override.isAvailable,
                startTime: override.isAvailable ? override.startTime : null,
                endTime: override.isAvailable ? override.endTime : null,
                reason: override.reason,
              },
            }),
          );
        } else {
          results.push(
            await tx.availabilityOverride.create({
              data: {
                teacherId,
                date: dateObj,
                isAvailable: override.isAvailable,
                startTime: override.isAvailable ? override.startTime : null,
                endTime: override.isAvailable ? override.endTime : null,
                reason: override.reason,
                track: override.track ?? null,
              },
            }),
          );
        }
      }

      // Stale cleanup: for each date in the batch, delete overrides whose track is NOT in the batch
      const datesInBatch = [
        ...new Set(
          overrides.map((o) => {
            const d = parseISO(o.date);
            return d.toISOString().split('T')[0];
          }),
        ),
      ];

      for (const dateStr of datesInBatch) {
        const dateObj = parseISO(dateStr);
        const tracksForDate = overrides
          .filter((o) => {
            const d = parseISO(o.date);
            return d.toISOString().split('T')[0] === dateStr;
          })
          .map((o) => o.track);

        const nonNullTracks = tracksForDate.filter(
          (t): t is string => t != null,
        );
        const hasNullTrack = tracksForDate.some((t) => t == null);

        await tx.availabilityOverride.deleteMany({
          where: {
            teacherId,
            date: dateObj,
            OR: [
              ...(nonNullTracks.length > 0
                ? [{ track: { notIn: nonNullTracks } }]
                : []),
              ...(hasNullTrack ? [] : [{ track: null }]),
            ],
          },
        });
      }

      return results;
    });
  }

  async copyWeekOverrides(
    teacherId: string,
    sourceDate: string,
    targetDate: string,
    overrideExisting = false,
  ) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const sourceStart = parseISO(sourceDate);
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setDate(sourceEnd.getDate() + 7);

    const targetStart = parseISO(targetDate);
    const targetEnd = new Date(targetStart);
    targetEnd.setDate(targetEnd.getDate() + 7);

    // Fetch source week overrides
    const sourceOverrides = await this.prisma.availabilityOverride.findMany({
      where: {
        teacherId,
        date: { gte: sourceStart, lt: sourceEnd },
      },
    });

    if (sourceOverrides.length === 0) {
      return { copied: 0 };
    }

    // Fetch existing target week overrides for conflict detection
    const existingTarget = await this.prisma.availabilityOverride.findMany({
      where: {
        teacherId,
        date: { gte: targetStart, lt: targetEnd },
      },
    });
    const existingTargetDates = new Set(
      existingTarget.map((o) => {
        const d = o.date instanceof Date ? o.date : new Date(o.date);
        return d.toISOString().split('T')[0];
      }),
    );

    // Calculate day offset between source and target weeks
    const dayOffsetMs = targetStart.getTime() - sourceStart.getTime();

    let copied = 0;
    const entriesToCopy: Array<(typeof sourceOverrides)[0]> = [];

    for (const override of sourceOverrides) {
      const srcDate =
        override.date instanceof Date ? override.date : new Date(override.date);
      const tgtDate = new Date(srcDate.getTime() + dayOffsetMs);
      const tgtDateStr = tgtDate.toISOString().split('T')[0];

      // Skip if target already has an override and we're not overriding
      if (!overrideExisting && existingTargetDates.has(tgtDateStr)) {
        continue;
      }

      copied++;
      entriesToCopy.push(override);
    }

    if (entriesToCopy.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const override of entriesToCopy) {
          const srcDate =
            override.date instanceof Date
              ? override.date
              : new Date(override.date);
          const tgtDate = new Date(srcDate.getTime() + dayOffsetMs);

          const existing = await tx.availabilityOverride.findFirst({
            where: { teacherId, date: tgtDate, track: override.track ?? null },
          });

          if (existing) {
            await tx.availabilityOverride.update({
              where: { id: existing.id },
              data: {
                isAvailable: override.isAvailable,
                startTime: override.startTime,
                endTime: override.endTime,
                reason: override.reason,
              },
            });
          } else {
            await tx.availabilityOverride.create({
              data: {
                teacherId,
                date: tgtDate,
                isAvailable: override.isAvailable,
                startTime: override.startTime,
                endTime: override.endTime,
                reason: override.reason,
                track: override.track ?? null,
              },
            });
          }
        }
      });
    }

    return { copied };
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
      this.prisma.vehicleTypeConfig.findUnique({
        where: { type: vehicleType },
      }),
    ]);
    if (!teacher) throw new NotFoundException('Teacher not found');

    const baseSlotDuration = typeConfig?.duration ?? 45;

    // Check generation rules for double booking
    const genRules = await this.ruleEngine.getGenerationRules(teacherId);
    const hasDoubleBookingGenRule = genRules.length > 0;

    const effectiveDuration = hasDoubleBookingGenRule
      ? baseSlotDuration * 2
      : doubleSession && teacher.doubleSession
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

    // 2.5 Derive track from student's licenseSubType when vehicleType is moto-
    let track: string | undefined;
    if (vehicleType.startsWith('moto-') && studentId) {
      const slotStudent = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { licenseSubType: true },
      });
      if (slotStudent?.licenseSubType) {
        track = slotStudent.licenseSubType;
      }
    }

    // 2.6 Build student license type map for overlap checking
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

    // 2.7 Lookup student context for personalized slot listing
    let slotStudentContext: { licenseType: string } | undefined;
    if (studentId) {
      const slotStudent = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { licenseType: true, licenseSubType: true },
      });
      if (slotStudent?.licenseType) {
        slotStudentContext = { licenseType: slotStudent.licenseType };
      }
      // Derive track as fallback if not already set from vehicleType check
      if (!track && slotStudent?.licenseSubType) {
        track = slotStudent.licenseSubType;
      }
    }

    // 3. Filter availability by track and build lookup maps for O(1) access
    let filteredAvailability = availability;
    if (track) {
      filteredAvailability = availability.filter(
        (a) => a.track === track || a.track === null,
      );
      // Sort: null entries first, track-specific entries last
      // so track entries overwrite null ones in the map
      filteredAvailability.sort((a, b) => {
        if (a.track === null && b.track !== null) return -1;
        if (a.track !== null && b.track === null) return 1;
        return 0;
      });
    } else {
      filteredAvailability = availability.filter((a) => a.track === null);
    }

    const availabilityMap = new Map(
      filteredAvailability.map((a) => [a.dayOfWeek, a]),
    );
    const overrideMap = new Map<string, (typeof overrides)[0]>();
    for (const o of overrides) {
      const oDate = o.date instanceof Date ? o.date : new Date(o.date);
      const key = `${oDate.toISOString().split('T')[0]}|${o.track ?? 'null'}`;
      overrideMap.set(key, o);
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

      // Check override — try track-specific first, then fallback to null-track
      let override = overrideMap.get(`${dateStr}|${track ?? 'null'}`);
      if (!override) {
        override = overrideMap.get(`${dateStr}|null`);
      }
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
          doubleSession:
            hasDoubleBookingGenRule ||
            !!(doubleSession && teacher.doubleSession),
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

    // Derive track from student's licenseSubType (passed via caller or internal)
    let track: string | undefined;
    if (vehicleType.startsWith('moto-') && studentId) {
      const slotStudent = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { licenseSubType: true },
      });
      if (slotStudent?.licenseSubType) {
        track = slotStudent.licenseSubType;
      }
    }

    // Get base availability for the day — now supports multiple entries per day
    const baseAvailabilities = await this.prisma.teacherAvailability.findMany({
      where: { teacherId, dayOfWeek },
    });

    // Filter by track

    let baseAvailability: (typeof baseAvailabilities)[0] | undefined;
    if (track) {
      // Prefer track-specific entry, fall back to null-track entry
      baseAvailability =
        baseAvailabilities.find((a) => a.track === track) ??
        baseAvailabilities.find((a) => a.track === null);
    } else {
      baseAvailability = baseAvailabilities.find((a) => a.track === null);
    }

    // Check for override — try track-specific first, then fallback to null-track
    let override = await this.prisma.availabilityOverride.findFirst({
      where: { teacherId, date: dateObj, track: track ?? null },
    });

    if (!override && track) {
      override = await this.prisma.availabilityOverride.findFirst({
        where: { teacherId, date: dateObj, track: null },
      });
    }

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

    // Check generation rules for double booking
    const genRules = await this.ruleEngine.getGenerationRules(teacherId);
    const hasDoubleBookingGenRule = genRules.length > 0;

    // Generate slots — grid increment matches effectiveDuration
    const slots: string[] = [];
    const effectiveDuration = hasDoubleBookingGenRule
      ? slotDuration * 2
      : doubleSession && teacher.doubleSession
        ? slotDuration * 2
        : slotDuration;

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
        doubleSession:
          hasDoubleBookingGenRule || !!(doubleSession && teacher.doubleSession),
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
      doubleSession: hasDoubleBookingGenRule || teacher.doubleSession,
    };
  }
}
