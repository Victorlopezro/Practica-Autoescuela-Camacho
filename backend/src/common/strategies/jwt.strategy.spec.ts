import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import type { JwtPayload } from '../decorators/current-user.decorator';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let prisma: any;
  let configService: any;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
      },
    };
    configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    strategy = new JwtStrategy(configService as any, prisma as any);
  });

  describe('validate', () => {
    it('should return JwtPayload when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        role: 'admin',
      });

      const payload: JwtPayload = {
        sub: 'user-1',
        username: 'admin',
        role: 'student',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'user-1',
        username: 'admin',
        role: 'admin',
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, role: true },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const payload: JwtPayload = {
        sub: 'unknown',
        username: 'ghost',
        role: 'student',
      };

      await expect(
        strategy.validate(payload),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
