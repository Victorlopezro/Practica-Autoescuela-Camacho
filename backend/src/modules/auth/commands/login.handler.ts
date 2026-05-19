import { randomUUID } from 'node:crypto';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../../common/services/prisma.service';
import { LoginCommand } from './login.command';
import { UserLoggedInEvent } from '../events/user-logged-in.event';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LoginCommand) {
    const { username, password } = command;

    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password, password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, username: user.username, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: 900, // 15 minutes
    });

    const refreshTokenId = randomUUID();
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: refreshTokenId },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: 604800, // 7 days
      },
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    this.eventBus.publish(new UserLoggedInEvent(user.id, new Date()));

    const userProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, username: true, name: true, lastName: true, email: true, phone: true, role: true, teacherId: true },
    });

    return { accessToken, refreshToken, user: userProfile };
  }
}
