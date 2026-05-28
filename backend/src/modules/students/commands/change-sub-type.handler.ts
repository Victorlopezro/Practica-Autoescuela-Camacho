import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import { ChangeSubTypeCommand } from './change-sub-type.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

@CommandHandler(ChangeSubTypeCommand)
export class ChangeSubTypeHandler implements ICommandHandler<ChangeSubTypeCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ChangeSubTypeCommand) {
    const { studentId, targetSubType, userId } = command;

    // 1. Find student
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // 2. Validate: only A1/A2 license types, pista→circulacion
    if (!student.licenseType || !['A1', 'A2'].includes(student.licenseType)) {
      throw new BadRequestException(
        'Only A1/A2 students can change license sub-type',
      );
    }
    if (student.licenseSubType !== 'pista') {
      throw new BadRequestException(
        'Only pista→circulacion change is supported. Student must have licenseSubType=pista.',
      );
    }

    // 3. Find future moto-pista reservations (pending or confirmed)
    const futureReservations = await this.prisma.reservation.findMany({
      where: {
        studentId,
        vehicleType: 'moto-pista',
        startTime: { gte: new Date() },
        status: { in: ['pending', 'confirmed'] },
      },
    });

    // 4. Calculate refund: sum of durations / 45
    const totalDuration = futureReservations.reduce(
      (sum, r) => sum + r.duration,
      0,
    );
    const refundClasses = Math.floor(totalDuration / 45);

    // 5. Execute in transaction
    return this.prisma.$transaction(async (tx) => {
      // Cancel all future moto-pista reservations
      for (const reservation of futureReservations) {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelledById: userId,
            cancellationReason: 'Cambio a circulación',
          },
        });
      }

      // Build balance history entry
      const history =
        (student.balanceHistory as Array<Record<string, unknown>>) || [];
      if (refundClasses > 0) {
        history.push({
          amount: refundClasses,
          reason: `Refund por cambio a circulación (${totalDuration} min cancelados)`,
          timestamp: new Date(),
          adjustedBy: userId,
        });
      }

      // Update student
      const updated = await tx.student.update({
        where: { id: studentId },
        data: {
          licenseSubType: targetSubType,
          remainingClasses: student.remainingClasses + refundClasses,
          balanceHistory: history as Prisma.InputJsonValue,
        },
      });

      if (refundClasses > 0) {
        this.eventBus.publish(
          new BalanceAdjustedEvent(
            studentId,
            refundClasses,
            `Refund por cambio a circulación (${totalDuration} min cancelados)`,
            updated.remainingClasses,
          ),
        );
      }

      return updated;
    });
  }
}
