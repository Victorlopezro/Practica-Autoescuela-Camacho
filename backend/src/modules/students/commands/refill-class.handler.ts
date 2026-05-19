import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import { RefillClassCommand } from './refill-class.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

@CommandHandler(RefillClassCommand)
export class RefillClassHandler implements ICommandHandler<RefillClassCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefillClassCommand) {
    const { studentId, amount, adjustedBy } = command;

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const newBalance = student.remainingClasses + amount;

    const history = (student.balanceHistory as Array<Record<string, unknown>>) || [];
    history.push({
      amount,
      reason: `Classes refilled (${amount} added)`,
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
      new BalanceAdjustedEvent(studentId, amount, `Classes refilled`, newBalance),
    );

    return { remainingClasses: newBalance };
  }
}
