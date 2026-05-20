import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { CompleteReservationCommand } from './complete-reservation.command';
import { ReservationStatusChangedEvent } from '../events/reservation-status-changed.event';

@CommandHandler(CompleteReservationCommand)
export class CompleteReservationHandler implements ICommandHandler<CompleteReservationCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CompleteReservationCommand) {
    const { reservationId, userId } = command;

    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw new NotFoundException('Reservation not found');

    if (reservation.status !== 'confirmed') {
      throw new BadRequestException(
        'Only confirmed reservations can be completed',
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'completed' },
    });

    this.eventBus.publish(
      new ReservationStatusChangedEvent(
        reservationId,
        'confirmed',
        'completed',
        new Date(),
        userId,
        reservation.duration,
      ),
    );

    return updated;
  }
}
