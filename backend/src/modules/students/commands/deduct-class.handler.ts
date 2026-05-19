import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeductClassCommand } from './deduct-class.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

@CommandHandler(DeductClassCommand)
export class DeductClassHandler implements ICommandHandler<DeductClassCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeductClassCommand) {
    const { studentId, duration, adjustedBy } = command;

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const deductAmount = duration === 90 ? 2 : 1;
    const newBalance = student.remainingClasses - deductAmount;

    if (newBalance < 0) {
      throw new BadRequestException(
        `Insufficient classes: need ${deductAmount} but only ${student.remainingClasses} remaining`,
      );
    }

    const history = (student.balanceHistory as Array<Record<string, unknown>>) || [];
    history.push({
      amount: -deductAmount,
      reason: `Class deducted (${duration} min)`,
      timestamp: new Date(),
      adjustedBy,
    });

    await this.prisma.student.update({
      where: { id: studentId },
      data: {
        remainingClasses: newBalance,
        balanceHistory: history as Prisma.InputJsonValue,
      },
    });

    this.eventBus.publish(
      new BalanceAdjustedEvent(studentId, -deductAmount, `Class deducted (${duration} min)`, newBalance),
    );

    return { remainingClasses: newBalance };
  }
}
