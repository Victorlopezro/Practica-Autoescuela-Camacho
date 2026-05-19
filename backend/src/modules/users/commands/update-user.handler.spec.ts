import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../common/services/prisma.service';
import { UpdateUserHandler } from './update-user.handler';
import { UpdateUserCommand } from './update-user.command';
import { UserRoleChangedEvent } from '../events/user-role-changed.event';

describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler;
  let prisma: any;
  let eventBus: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    eventBus = { publish: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserHandler,
        { provide: PrismaService, useValue: prisma },
        { provide: EventBus, useValue: eventBus },
      ],
    }).compile();

    handler = module.get<UpdateUserHandler>(UpdateUserHandler);
  });

  it('should update user role and emit event', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'jdoe',
      role: 'student',
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      username: 'jdoe',
      role: 'teacher',
      teacherId: null,
      updatedAt: new Date(),
    });

    const result = await handler.execute(
      new UpdateUserCommand('user-1', 'teacher', undefined, 'admin-1'),
    );

    expect(result.role).toBe('teacher');
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.any(UserRoleChangedEvent),
    );
  });

  it('should throw NotFoundException when user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      handler.execute(new UpdateUserCommand('nonexistent', 'admin')),
    ).rejects.toThrow(NotFoundException);
  });
});
