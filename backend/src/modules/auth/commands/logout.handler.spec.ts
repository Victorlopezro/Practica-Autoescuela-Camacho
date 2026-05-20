import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../common/services/prisma.service';
import { LogoutHandler } from './logout.handler';
import { LogoutCommand } from './logout.command';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      refreshToken: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [LogoutHandler, { provide: PrismaService, useValue: prisma }],
    }).compile();

    handler = module.get<LogoutHandler>(LogoutHandler);
  });

  it('should revoke refresh token if found and not revoked', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id-1',
      token: 'some-token',
      revoked: false,
    });

    await handler.execute(new LogoutCommand('some-token'));

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'token-id-1' },
      data: { revoked: true, revokedAt: expect.any(Date) },
    });
  });

  it('should not fail if token not found', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue(null);

    const result = await handler.execute(new LogoutCommand('unknown-token'));

    expect(result).toEqual({ message: 'Logged out successfully' });
    expect(prisma.refreshToken.update).not.toHaveBeenCalled();
  });
});
