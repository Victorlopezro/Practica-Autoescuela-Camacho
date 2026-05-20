import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { LoginHandler } from './login.handler';
import { LoginCommand } from './login.command';
import { UserLoggedInEvent } from '../events/user-logged-in.event';

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

import * as argon2 from 'argon2';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let prisma: any;
  let jwtService: any;
  let eventBus: any;

  const mockUser = {
    id: 'user-1',
    username: 'admin',
    password: 'hashed-password',
    name: 'Admin',
    lastName: 'User',
    email: 'admin@camacho.com',
    phone: null,
    role: 'admin',
    teacherId: null,
  };

  const mockUserProfile = {
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

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      student: { findUnique: jest.fn() },
      refreshToken: { create: jest.fn() },
    };
    jwtService = { sign: jest.fn() };
    eventBus = { publish: jest.fn() };

    const configService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<LoginHandler>(LoginHandler);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return tokens with user profile when credentials are valid', async () => {
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser) // first call: auth lookup
        .mockResolvedValueOnce(mockUserProfile); // second call: profile query
      (prisma.student.findUnique as jest.Mock).mockResolvedValue(null);
      (argon2.verify as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await handler.execute(
        new LoginCommand('admin', 'admin123'),
      );

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: mockUserProfile,
      });
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.any(UserLoggedInEvent),
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        handler.execute(new LoginCommand('unknown', 'pass')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        handler.execute(new LoginCommand('admin', 'wrong')),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
