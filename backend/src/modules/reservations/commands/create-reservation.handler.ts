import { ConflictException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateReservationCommand } from './create-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

@CommandHandler(CreateReservationCommand)
export class CreateReservationHandler implements ICommandHandler<CreateReservationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
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

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const reservation = await this.prisma.$transaction(async (tx) => {
      // Find all non-cancelled reservations for this teacher that could potentially overlap
      // A reservation overlaps if: existingStart < newEnd AND existingStart + existingDuration > newStart
      // Prisma can't do computed fields in WHERE, so we fetch candidates where startTime < endTime and filter in-memory
      const potentialOverlaps = await tx.reservation.findMany({
        where: {
          teacherId,
          status: { notIn: ['cancelled'] },
          startTime: { lt: endTime },
        },
        orderBy: { startTime: 'asc' },
      });

      for (const existing of potentialOverlaps) {
        const existingEnd = new Date(
          existing.startTime.getTime() + existing.duration * 60 * 1000,
        );
        if (existingEnd > startTime) {
          throw new ConflictException(
            'Schedule conflict — teacher already has a reservation in this time slot',
          );
        }
      }

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
