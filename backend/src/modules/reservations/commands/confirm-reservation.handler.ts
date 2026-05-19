import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { ConfirmReservationCommand } from './confirm-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

@CommandHandler(ConfirmReservationCommand)
export class ConfirmReservationHandler implements ICommandHandler<ConfirmReservationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ConfirmReservationCommand) {
    const { reservationId, userId } = command;

    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== 'pending') {
      throw new BadRequestException('Only pending reservations can be confirmed');
    }

    const student = await this.prisma.student.findUnique({ where: { id: reservation.studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const deductAmount = reservation.duration === 90 ? 2 : 1;
    if (student.remainingClasses < deductAmount) {
      throw new BadRequestException('Insufficient classes — student does not have enough remaining classes');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: reservation.studentId },
        data: { remainingClasses: student.remainingClasses - deductAmount },
      });

      return tx.reservation.update({
        where: { id: reservationId },
        data: { status: 'confirmed' },
      });
    });

    this.eventBus.publish(
      new ReservationStatusChangedEvent(reservationId, 'pending', 'confirmed', new Date(), userId, reservation.duration),
    );

    return updated;
  }
}
