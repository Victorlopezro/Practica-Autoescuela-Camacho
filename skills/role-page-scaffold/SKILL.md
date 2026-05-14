---
name: role-page-scaffold
description: Generate base pages per role with layouts, navigation, breadcrumbs, visual guards, and responsive base.
trigger: creating new pages for student, teacher, or admin roles
---

# Role Page Scaffold Skill

Genera la estructura base de páginas por rol siguiendo la arquitectura del proyecto.

## Rol → Routing

| Rol | Base Path | Layout |
|-----|-----------|--------|
| student | `/student/{page}` | `app/student/layout.tsx` |
| teacher | `/teacher/{page}` | `app/teacher/layout.tsx` |
| admin | `/admin/{page}` | `app/admin/layout.tsx` |

## Estructura de Página Base

```tsx
'use client';

import { Card, CardHeader } from '@/components/layouts/Card';

export default function {Role}{Page}() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">{Título}</h1>
      {/* contenido */}
    </div>
  );
}
```

## Reglas

- Siempre `'use client'` hasta que haya Server Components reales
- Layouts ya existen: NO crear nuevos layouts por rol
- Navbar y MobileNav ya existen en layouts — NO duplicarlos
- Padding base: `p-4` para página, `space-y-4` para secciones
- Títulos: `text-xl font-bold text-gray-900`
- NO crear breadcrumbs manuales — usar navegación del MobileNav
