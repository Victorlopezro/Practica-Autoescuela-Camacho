import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * @Roles('admin:manage', 'teacher:view')
 * Format: `resource:action`
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
