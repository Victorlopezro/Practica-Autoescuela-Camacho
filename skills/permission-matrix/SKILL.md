---
name: permission-matrix
description: Generate RBAC maps, access guards, role matrices, and typed permissions.
trigger: implementing auth, role-based access, permission checks, route guards
---

# Permission Matrix Skill

Genera matrices de permisos, guards y tipado de roles.

## Estructura Base

```tsx
// types/permissions.ts
export type Role = 'admin' | 'teacher' | 'student';

export type Permission =
  | 'student:read'
  | 'student:write'
  | 'teacher:read'
  | 'teacher:write'
  | 'vehicle:read'
  | 'vehicle:write'
  | 'booking:read'
  | 'booking:write'
  | 'schedule:read'
  | 'schedule:write'
  | 'payment:read'
  | 'payment:write'
  | 'settings:read'
  | 'settings:write'
  | 'analytics:read';

// RBAC Matrix
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'student:read', 'student:write',
    'teacher:read', 'teacher:write',
    'vehicle:read', 'vehicle:write',
    'booking:read', 'booking:write',
    'schedule:read', 'schedule:write',
    'payment:read', 'payment:write',
    'settings:read', 'settings:write',
    'analytics:read',
  ],
  teacher: [
    'student:read',
    'booking:read', 'booking:write',
    'schedule:read', 'schedule:write',
  ],
  student: [
    'booking:read', 'booking:write',
  ],
};
```

## Guard de Ruta

```tsx
export function requirePermission(permission: Permission) {
  return (role: Role): boolean => {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
  };
}
```

## Reglas

- Roles como union type, no string
- Permisos con formato `{recurso}:{acción}`
- Matriz centralizada, no dispersa en componentes
- Guard devuelve boolean — no hace redirect (eso es del middleware)
