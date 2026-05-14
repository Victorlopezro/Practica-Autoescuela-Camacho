---
name: service-layer
description: Generate decoupled services, adapters, repositories, providers, and clean interfaces.
trigger: creating service layer, API integration, data access layer, backend communication
---

# Service Layer Skill

Genera la capa de servicios desacoplada entre UI y datos.

## Arquitectura

```
UI (pages/components)
    ↓ llama
Services (interfaces)
    ↓ implementa
Adapters (mock | api | supabase)
    ↓ usa
Types/DTOs
```

## Patrón de Servicio

```tsx
// services/interfaces/I{Entity}Service.ts
export interface I{Entity}Service {
  getAll(): Promise<{Entity}DTO[]>;
  getById(id: string): Promise<{Entity}DTO | null>;
  create(data: Create{Entity}Request): Promise<{Entity}DTO>;
  update(id: string, data: Update{Entity}Request): Promise<{Entity}DTO>;
  delete(id: string): Promise<void>;
}
```

## Provider Pattern

```tsx
// services/providers/{entity}Provider.tsx
import { createContext, useContext } from 'react';
import type { I{Entity}Service } from '../interfaces';

const {Entity}Context = createContext<I{Entity}Service | null>(null);

export function {Entity}Provider({ service, children }: {
  service: I{Entity}Service;
  children: React.ReactNode;
}) {
  return (
    <{Entity}Context.Provider value={service}>
      {children}
    </{Entity}Context.Provider>
  );
}

export function use{Entity}Service(): I{Entity}Service {
  const ctx = useContext({Entity}Context);
  if (!ctx) throw new Error('{Entity}Provider missing');
  return ctx;
}
```

## Reglas

- Interfaz primero, implementación después
- Provider pattern para inyección de dependencias
- Mock adapter por defecto, API adapter cuando llegue backend
- Tipado fuerte: nunca `any` en servicios
- Errores tipados: `ServiceError` con código y mensaje
