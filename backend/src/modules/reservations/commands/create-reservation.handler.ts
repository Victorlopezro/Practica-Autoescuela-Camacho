import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { RuleEngineService } from '../../scheduling/rule-engine.service';
import { CreateReservationCommand } from './create-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

@CommandHandler(CreateReservationCommand)
export class CreateReservationHandler implements ICommandHandler<CreateReservationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
    private readonly ruleEngine: RuleEngineService,
  ) {}

  async execute(command: CreateReservationCommand) {
    const { studentId, teacherId, vehicleType, startTime, duration, userId } =
      command;

    const teacher = await this.prisma.teacher.findUnique({
      where: { id: teacherId },
    });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Check remaining classes before booking
    if (student.remainingClasses <= 0) {
      throw new BadRequestException(
        'No tienes clases disponibles. Compra un pack para poder reservar.',
      );
    }

    // Rule engine check (feature-flag guarded)
    if (process.env.RULES_ENGINE_ENABLED === 'true') {
      const dateStr = startTime.toISOString().split('T')[0];
      const timeStr = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
      const result = await this.ruleEngine.canCreateReservation({
        teacherId,
        date: dateStr,
        startTime: timeStr,
        duration,
        vehicleType,
        student: {
          id: studentId,
          licenseType: student.licenseType ?? undefined,
          remainingClasses: student.remainingClasses,
        },
        doubleSession: duration >= 90,
      });

      if (result.blocked) {
        throw new BadRequestException(
          result.blockingRule?.reason ??
            'Reserva bloqueada por reglas de scheduling.',
        );
      }

      if (result.warnings.length > 0) {
        Logger.log(
          `Rule warnings for reservation: ${result.warnings.map((w) => w.ruleName).join(', ')}`,
          CreateReservationHandler.name,
        );
      }
    }

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const dateStr2 = startTime.toISOString().split('T')[0];
    const timeStr2 = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;

    // Find overlaps outside transaction to build rule engine context
    const potentialOverlaps = await this.prisma.reservation.findMany({
      where: {
        teacherId,
        status: { notIn: ['cancelled'] },
        startTime: { lt: endTime },
      },
      select: { startTime: true, duration: true, studentId: true, vehicleType: true },
      orderBy: { startTime: 'asc' },
    });

    const overlapping = potentialOverlaps.filter((existing) => {
      const existingEnd = new Date(
        existing.startTime.getTime() + existing.duration * 60 * 1000,
      );
      return existingEnd > startTime;
    });

    // If overlap detected, build context and let rule engine decide
    if (overlapping.length > 0) {
      const overlapStudentIds = [...new Set(overlapping.map((r) => r.studentId))];
      const overlapStudents = await this.prisma.student.findMany({
        where: { id: { in: overlapStudentIds } },
        select: { licenseType: true },
      });
      const overlappingLicenses = [
        ...new Set(
          overlapStudents
            .map((s) => s.licenseType)
            .filter(Boolean),
        ),
      ] as string[];

      const overlappingVehicleTypes = [
        ...new Set(
          overlapping
            .map((r) => r.vehicleType)
            .filter(Boolean),
        ),
      ] as string[];

      const overlapContext: import('../../scheduling/rule-engine.service').RuleContext = {
        teacherId,
        date: dateStr2,
        startTime: timeStr2,
        duration,
        vehicleType,
        student: {
          id: studentId,
          licenseType: student.licenseType ?? undefined,
          remainingClasses: student.remainingClasses,
        },
        doubleSession: duration >= 90,
        overlappingLicenseTypes: overlappingLicenses,
        overlappingVehicleTypes,
        overlappingCount: overlapping.length,
      };

      const result = await this.ruleEngine.canCreateReservation(overlapContext);

      if (result.blocked) {
        throw new ConflictException(
          result.blockingRule?.reason ??
            'Schedule conflict — teacher already has a reservation in this time slot',
        );
      }
      // If not blocked (allow rule matched), fall through to create the reservation
    }

    const reservation = await this.prisma.$transaction(async (tx) => {
      // Re-fetch student inside transaction to prevent race conditions
      const currentStudent = await tx.student.findUnique({
        where: { id: studentId },
        select: { remainingClasses: true },
      });
      if (!currentStudent || currentStudent.remainingClasses <= 0) {
        throw new BadRequestException(
          'No tienes clases disponibles. Compra un pack para poder reservar.',
        );
      }

      // Decrement remaining classes
      const classesToConsume = duration >= 90 ? 2 : 1;
      await tx.student.update({
        where: { id: studentId },
        data: { remainingClasses: { decrement: classesToConsume } },
      });

      return tx.reservation.create({
        data: {
          studentId,
          teacherId,
          vehicleType,
          startTime,
          duration,
          status: 'pending',
        },
      });
    });

    this.eventBus.publish(
      new ReservationStatusChangedEvent(
        reservation.id,
        null,
        'pending',
        new Date(),
        userId,
        reservation.duration,
      ),
    );

    return reservation;
  }
}
