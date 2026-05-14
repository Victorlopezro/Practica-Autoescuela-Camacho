---
name: crud-generator
description: Generate CRUD tables, forms, dialogs, types, mocks, loading states, empty states, and basic validations.
trigger: creating CRUD interfaces, tables, admin panels, data management forms
---

# CRUD Generator Skill

Genera componentes CRUD completos y consistentes usando shadcn/ui + Tailwind + TypeScript estricto.

## Output Generado

Para cada entidad, genera:
- `types/{entity}.ts` → Tipo + schema validación
- `services/mocks/{entity}Service.ts` → CRUD mockeado
- `components/features/{entity}/{entity}Table.tsx` → Tabla con acciones
- `components/features/{entity}/{entity}Form.tsx` → Formulario crear/editar
- `components/features/{entity}/{entity}Dialog.tsx` → Diálogo crear/editar
- Estados: loading, empty, error, success

## Patrón de Tabla

```tsx
// components/features/{entity}/{entity}Table.tsx
'use client';
interface Props {
  data: EntityType[];
  onEdit: (item: EntityType) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}
```

## Patrón de Formulario

```tsx
// Usar react-hook-form + zod
const formSchema = z.object({ ... });
type FormData = z.infer<typeof formSchema>;
```

## Reglas

- Tipo primero, servicio después, UI al final
- Estados vacío y error obligatorios
- Acciones: editar, eliminar, crear (en ese orden en la tabla)
- Usar siempre componentes shadcn/ui: Table, Dialog, Form, Button
- Never `any` — tipado estricto siempre
