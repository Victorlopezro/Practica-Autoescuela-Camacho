import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import { AdjustBalanceCommand } from './adjust-balance.command';
import { BalanceAdjustedEvent } from '../events/balance-adjusted.event';

@CommandHandler(AdjustBalanceCommand)
export class AdjustBalanceHandler implements ICommandHandler<AdjustBalanceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AdjustBalanceCommand) {
    const { studentId, amount, reason, adjustedBy } = command;

    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    const newBalance = student.remainingClasses + amount;
    if (newBalance < 0) {
      throw new BadRequestException('Insufficient balance — resulting classes cannot be below 0');
    }

    const history = (student.balanceHistory as Array<Record<string, unknown>>) || [];
    history.push({
      amount,
      reason,
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

    this.eventBus.publish(new BalanceAdjustedEvent(studentId, amount, reason, newBalance));

    return { remainingClasses: newBalance };
  }
}
