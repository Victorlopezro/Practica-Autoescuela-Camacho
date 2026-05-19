import { randomUUID } from 'node:crypto';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { RefreshTokenCommand } from './refresh-token.command';
import { TokenRefreshedEvent } from '../events/token-refreshed.event';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RefreshTokenCommand) {
    const { refreshToken } = command;

    let payload: { sub: string; jti: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!stored || stored.revoked) {
      throw new UnauthorizedException('Refresh token revoked or not found');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true, revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, username: true, name: true, lastName: true, email: true, phone: true, role: true, teacherId: true },
    });
    if (!user) throw new UnauthorizedException('User no longer exists');

    const newPayload = { sub: user.id, username: user.username, role: user.role };
    const newAccessToken = this.jwtService.sign(newPayload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: 900, // 15 minutes
    });

    const newRefreshTokenId = randomUUID();
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, jti: newRefreshTokenId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 604800, // 7 days
      },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        id: newRefreshTokenId,
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    this.eventBus.publish(
      new TokenRefreshedEvent(user.id, stored.id, newRefreshTokenId),
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, user };
  }
}
