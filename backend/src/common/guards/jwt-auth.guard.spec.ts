import { UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(reflector);
  });

  function mockContext(isPublic = false) {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as any;
  }

  it('should allow access to public routes', () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    const result = guard.canActivate(mockContext(true));

    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when user is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(() => guard.handleRequest(null, null)).toThrow(UnauthorizedException);
  });

  it('should pass user through when valid', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const user = { sub: 'user-1', role: 'admin' };

    const result = guard.handleRequest(null, user);

    expect(result).toBe(user);
  });
});
