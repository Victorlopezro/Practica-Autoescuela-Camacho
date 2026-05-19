import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { RefreshTokenHandler } from './refresh-token.handler';
import { RefreshTokenCommand } from './refresh-token.command';
import { TokenRefreshedEvent } from '../events/token-refreshed.event';

describe('RefreshTokenHandler', () => {
  let handler: RefreshTokenHandler;
  let prisma: any;
  let jwtService: any;
  let configService: any;
  let eventBus: any;

  const validPayload = { sub: 'user-1', jti: 'token-id-1' };

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn(), verify: jest.fn() };
    configService = { get: jest.fn(), getOrThrow: jest.fn() };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<RefreshTokenHandler>(RefreshTokenHandler);
  });

  it('should rotate tokens when refresh token is valid', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue(validPayload);
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id-1',
      token: 'old-refresh-token',
      userId: 'user-1',
      revoked: false,
    });
    const mockUser = {
      id: 'user-1',
      username: 'admin',
      name: 'Admin',
      lastName: 'User',
      email: 'admin@camacho.com',
      phone: null,
      role: 'admin',
      teacherId: null,
      studentId: null,
    };
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.student.findUnique.mockResolvedValue(null);
    (jwtService.sign as jest.Mock)
      .mockReturnValueOnce('new-access-token')
      .mockReturnValueOnce('new-refresh-token');

    const result = await handler.execute(
      new RefreshTokenCommand('old-refresh-token'),
    );

    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: mockUser,
    });
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(TokenRefreshedEvent),
    );
  });

  it('should throw on revoked token', async () => {
    (jwtService.verify as jest.Mock).mockReturnValue(validPayload);
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id-1',
      token: 'old-refresh-token',
      revoked: true,
    });

    await expect(
      handler.execute(new RefreshTokenCommand('old-refresh-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw on invalid JWT', async () => {
    (jwtService.verify as jest.Mock).mockImplementation(() => {
      throw new Error('jwt expired');
    });

    await expect(
      handler.execute(new RefreshTokenCommand('bad-token')),
    ).rejects.toThrow(UnauthorizedException);
  });
});
