import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { CancelReservationCommand } from './cancel-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

@CommandHandler(CancelReservationCommand)
export class CancelReservationHandler implements ICommandHandler<CancelReservationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CancelReservationCommand) {
    const { reservationId, userId } = command;

    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed reservation');
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation is already cancelled');
    }

    const currentStatus = reservation.status;
    let refundAmount = 0;

    // Deadline applies to all cancellations (pending or confirmed)
    const deadline = new Date(Date.UTC(
      reservation.startTime.getUTCFullYear(),
      reservation.startTime.getUTCMonth(),
      reservation.startTime.getUTCDate() - 1,
      18, 0, 0, 0,
    ));

    if (new Date() >= deadline) {
      throw new BadRequestException('Cancellation deadline passed — must cancel before 18:00 UTC the day prior');
    }

    if (currentStatus === 'confirmed') {
      refundAmount = reservation.duration === 90 ? 2 : 1;

      const student = await this.prisma.student.findUnique({ where: { id: reservation.studentId } });
      if (student) {
        await this.prisma.student.update({
          where: { id: reservation.studentId },
          data: { remainingClasses: student.remainingClasses + refundAmount },
        });
      }
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        refundAmount,
      },
    });

    this.eventBus.publish(
      new ReservationStatusChangedEvent(reservationId, currentStatus, 'cancelled', new Date(), userId, reservation.duration),
    );

    return updated;
  }
}
