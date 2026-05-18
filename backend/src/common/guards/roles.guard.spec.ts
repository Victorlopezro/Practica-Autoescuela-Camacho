import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector);
  });

  function mockContext(role: string) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { sub: 'user-1', role } }),
      }),
    } as any;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const result = guard.canActivate(mockContext('student'));

    expect(result).toBe(true);
  });

  it('should allow access when role matches', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin:*']);

    const result = guard.canActivate(mockContext('admin'));

    expect(result).toBe(true);
  });

  it('should deny access when role does not match', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin:*']);

    expect(() => guard.canActivate(mockContext('student'))).toThrow(
      ForbiddenException,
    );
  });

  it('should allow wildcard role *:action', () => {
    reflector.getAllAndOverride.mockReturnValue(['*:*']);

    const result = guard.canActivate(mockContext('student'));

    expect(result).toBe(true);
  });
});
