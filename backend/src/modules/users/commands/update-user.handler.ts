import { NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateUserCommand } from './update-user.command';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateUserCommand) {
    const { userId, role, teacherId, changedBy, name, lastName, email, phone } = command;

    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) throw new NotFoundException('User not found');

    const data: Record<string, unknown> = {};
    if (role !== undefined) data.role = role;
    if (teacherId !== undefined) data.teacherId = teacherId;
    if (name !== undefined) data.name = name;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, name: true, lastName: true, email: true, phone: true, role: true, teacherId: true, updatedAt: true },
    });

    if (role !== undefined && role !== existing.role) {
      this.eventBus.publish(
        new UserRoleChangedEvent(userId, existing.role, role, changedBy),
      );
    }

    return updated;
  }
}
