import { ConflictException } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateUserCommand } from './create-user.command';
import { UserCreatedEvent } from '../events/user-created.event';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateUserCommand) {
    const { username, password, role, teacherId, createdBy, name, lastName, email, phone } = command;

    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new ConflictException('Username already exists');

    const hashed = await argon2.hash(password);

    const user = await this.prisma.user.create({
      data: { username, password: hashed, role, teacherId, createdById: createdBy, name, lastName, email, phone },
      select: { id: true, username: true, name: true, lastName: true, email: true, phone: true, role: true, teacherId: true, createdAt: true },
    });

    this.eventBus.publish(new UserCreatedEvent(user.id, user.role, createdBy));

    return user;
  }
}
