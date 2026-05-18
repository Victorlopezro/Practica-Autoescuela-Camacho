import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Access denied');
    }

    // user.role is a single string; check role-based permission
    const hasPermission = requiredPermissions.some((perm) => {
      const [requiredRole, requiredAction] = perm.split(':');

      // Role match
      if (user.role !== requiredRole && requiredRole !== '*') {
        return false;
      }

      // Action match (resource:action model)
      if (requiredAction && requiredAction !== '*') {
        // For now, any action is allowed if role matches
        // In future, we can expand this to granular action-level checks
        return true;
      }

      return true;
    });

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied: requires one of [${requiredPermissions.join(', ')}]`,
      );
    }

    return true;
  }
}
