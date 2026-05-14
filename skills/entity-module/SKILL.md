---
name: entity-module
description: Generate complete entity modules including types, services, mocks, forms, contracts, and validation.
trigger: creating new entities, domain modules, feature modules
---

# Entity Module Skill

Genera la estructura completa para una entidad del dominio.

## Entidades Soportadas

| Entidad | Tipo | Rol Principal |
|---------|------|---------------|
| student | Persona | admin, teacher |
| teacher | Persona | admin |
| vehicle | Recurso | admin |
| booking | Evento | student, teacher, admin |
| availability | Config | teacher, admin |
| payment | Financiero | student, admin |
| incident | Evento | teacher, admin |
| schedule | Config | admin |

## Estructura Generada

Para cada entidad, genera:

```
/types/{entity}.ts           → Tipo principal + sub-tipos
/types/api/{entity}.ts       → DTOs, request/response
/services/interfaces/I{Entity}Service.ts → Contrato
/services/mocks/{entity}Service.ts → Mock implementation
/services/mocks/index.ts     → Mock datasets (actualizar)
/components/features/{entity}/{entity}Table.tsx → Tabla CRUD
/components/features/{entity}/{entity}Form.tsx → Formulario
/components/features/{entity}/{entity}Dialog.tsx → Diálogo
```

## Validación (zod)

```tsx
export const {entity}Schema = z.object({
  // campos
});

export type {Entity}FormData = z.infer<typeof {entity}Schema>;
```

## Reglas

- Siempre generar types primero
- Servicio mock debe implementar la interfaz del servicio real
- Tabla: incluir sorting por fecha, filtro por estado
- Formulario: validación con zod + mensajes en español
- Never `any` — tipado estricto siempre
- Estados loading, empty y error obligatorios
