import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { AdminCancelReservationCommand } from './admin-cancel-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

@CommandHandler(AdminCancelReservationCommand)
export class AdminCancelReservationHandler implements ICommandHandler<AdminCancelReservationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AdminCancelReservationCommand) {
    const { reservationId, userId, reason } = command;

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status === 'completed') {
      throw new BadRequestException('Cannot cancel a completed reservation');
    }

    if (reservation.status === 'cancelled') {
      throw new BadRequestException('Reservation is already cancelled');
    }

    const currentStatus = reservation.status;
    let refundAmount = 0;

    // Admin bypasses the 18:00 UTC deadline — refund still applies
    if (currentStatus === 'confirmed') {
      refundAmount = reservation.duration === 90 ? 2 : 1;

      const student = await this.prisma.student.findUnique({
        where: { id: reservation.studentId },
      });
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
        cancelledById: userId,
        cancellationReason: reason,
        refundAmount,
      },
    });

    this.eventBus.publish(
      new ReservationStatusChangedEvent(
        reservationId,
        currentStatus,
        'cancelled',
        new Date(),
        userId,
        reservation.duration,
      ),
    );

    return updated;
  }
}
