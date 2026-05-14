---
name: api-contract
description: Generate DTOs, schemas, typed contracts, request/response models. Prepared for future Supabase backend.
trigger: defining API contracts, creating types, designing request/response models
---

# API Contract Skill

Define contratos API completos y tipados, preparados para migrar a Supabase.

## Estructura

```tsx
// types/api/{entity}.ts
export interface {Entity}DTO {
  id: string;
  // ... campos
  created_at: string; // ISO date siempre
  updated_at: string;
}

export interface Create{Entity}Request {
  // ... campos requeridos
}

export interface Update{Entity}Request {
  // ... campos parciales
}

export interface {Entity}Response {
  data: {Entity}DTO;
  error?: string;
}

export interface {Entity}ListResponse {
  data: {Entity}DTO[];
  total: number;
  page: number;
}
```

## Convenciones

- `_at` para timestamps (formato ISO 8601)
- `snake_case` para campos de BD
- `camelCase` para TypeScript (transformar en servicios)
- Prefijo DTO para objetos de transferencia

## Reglas

- DTO !== Type del frontend. Separar capas.
- Timestamps siempre con timezone
- IDs: string UUID v4
- Paginación: incluir total, page, pageSize
- Errores: estructura `{ error: string, code: string }`
