import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { LogoutCommand } from './logout.command';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: LogoutCommand) {
    const { refreshToken } = command;

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (stored && !stored.revoked) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true, revokedAt: new Date() },
      });
    }

    return { message: 'Logged out successfully' };
  }
}
