import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { CreateUserHandler } from './create-user.handler';
import { CreateUserCommand } from './create-user.command';
import { UserCreatedEvent } from '../events/user-created.event';

jest.mock('argon2', () => ({
  hash: jest.fn(),
}));

import * as argon2 from 'argon2';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let prisma: any;
  let eventBus: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<CreateUserHandler>(CreateUserHandler);
    jest.clearAllMocks();
  });

  it('should create user and emit event', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      username: 'jdoe',
      role: 'teacher',
      teacherId: null,
      createdAt: new Date(),
    });

    const result = await handler.execute(
      new CreateUserCommand('jdoe', 'secure123', 'teacher', undefined, 'admin-1'),
    );

    expect(result.username).toBe('jdoe');
    expect(result.role).toBe('teacher');
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(UserCreatedEvent),
    );
  });

  it('should throw ConflictException when username exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing', username: 'jdoe' });

    await expect(
      handler.execute(new CreateUserCommand('jdoe', 'pass', 'student')),
    ).rejects.toThrow(ConflictException);
  });
});
