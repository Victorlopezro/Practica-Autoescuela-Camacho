import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { endOfDay, startOfDay, parseISO } from 'date-fns';

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    return { teacherId, doubleSession: teacher.doubleSession, availability, overrides };
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
  ) {
    const results: Array<{ date: string; slots: string[]; slotDuration: number }> = [];
    const start = parseISO(startDate);

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      const dayResult = await this.getAvailableSlots(
        teacherId,
        dateStr,
        vehicleType,
        doubleSession,
      );
      results.push({
        date: dateStr,
        slots: dayResult.slots,
        slotDuration: dayResult.slotDuration,
      });
    }

    return { teacherId, vehicleType, days: results };
  }

  async getAvailableSlots(
    teacherId: string,
    date: string,
    vehicleType: string,
    doubleSession?: boolean,
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
      return { date, slots: [], slotDuration, doubleSession: teacher.doubleSession };
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
      return { date, slots: [], slotDuration, doubleSession: teacher.doubleSession };
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
      select: { startTime: true, duration: true },
    });

    // Generate slots in 45-minute grid
    const slots: string[] = [];
    const effectiveDuration = doubleSession && teacher.doubleSession
      ? slotDuration * 2
      : slotDuration;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const gridIncrement = 45; // minutes

    let currentMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    while (currentMin + effectiveDuration <= endMin) {
      const slotStart = new Date(dateObj);
      slotStart.setHours(0, currentMin, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + effectiveDuration * 60 * 1000);

      // Check overlap with existing reservations
      const overlaps = existingReservations.some((r) => {
        const resEnd = new Date(r.startTime.getTime() + r.duration * 60 * 1000);
        return slotStart < resEnd && r.startTime < slotEnd;
      });

      if (!overlaps) {
        slots.push(slotStart.toISOString());
      }

      currentMin += gridIncrement;
    }

    return {
      date,
      slots,
      slotDuration: effectiveDuration,
      doubleSession: teacher.doubleSession,
    };
  }
}
