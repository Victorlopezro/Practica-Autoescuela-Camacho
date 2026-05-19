import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

// Helper to extract the factory function from a createParamDecorator
function getParamDecoratorFactory(decorator: Function) {
  class TestController {
    test(@decorator() user: any) {} // eslint-disable-line @typescript-eslint/no-unused-vars
  }
  const metadata = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestController, 'test');
  const key = Object.keys(metadata)[0];
  return metadata[key].factory;
}

describe('CurrentUser decorator', () => {
  let factory: (data: any, ctx: ExecutionContext) => any;
  const mockUser = { sub: 'user-1', username: 'admin', role: 'admin' };

  beforeEach(() => {
    factory = getParamDecoratorFactory(CurrentUser);
  });

  it('should extract full user from request when no data param is given', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as ExecutionContext;

    const result = factory(undefined, mockCtx);

    expect(result).toEqual(mockUser);
  });

  it('should extract a specific property when data param is given', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as ExecutionContext;

    const result = factory('sub', mockCtx);

    expect(result).toBe('user-1');
  });

  it('should return undefined when user does not exist on request', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined }),
      }),
    } as ExecutionContext;

    const result = factory(undefined, mockCtx);

    expect(result).toBeUndefined();
  });

  it('should return undefined for a specific property when user does not exist', () => {
    const mockCtx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: undefined }),
      }),
    } as ExecutionContext;

    const result = factory('sub', mockCtx);

    expect(result).toBeUndefined();
  });
});
