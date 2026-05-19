import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma.service';
import { DeleteUserHandler } from './delete-user.handler';
import { DeleteUserCommand } from './delete-user.command';

describe('DeleteUserHandler', () => {
  let handler: DeleteUserHandler;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteUserHandler,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    handler = module.get<DeleteUserHandler>(DeleteUserHandler);
  });

  it('should delete user when found', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'jdoe' });

    const result = await handler.execute(new DeleteUserCommand('user-1'));

    expect(result).toEqual({ message: 'User deleted successfully' });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
  });

  it('should throw NotFoundException when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new DeleteUserCommand('nonexistent')),
    ).rejects.toThrow(NotFoundException);
  });
});
