---
name: mock-service
description: Generate fake repositories, fake APIs, mock datasets, delayed responses, and optimistic UI patterns.
trigger: creating mock data, service mocks, fake APIs, testing data
---

# Mock Service Skill

Genera servicios mock completos siguiendo el contrato de tipos.

## Estructura Base

```tsx
// services/mocks/{entity}Service.ts
import type { Entity } from '@/types';
import { mock{Entities} } from './index';

export const {entity}Service = {
  getAll: async (): Promise<Entity[]> => {
    await delay(300);
    return mock{Entities};
  },

  getById: async (id: string): Promise<Entity | null> => {
    await delay(200);
    return mock{Entities}.find(e => e.id === id) || null;
  },

  create: async (data: Omit<Entity, 'id'>): Promise<Entity> => {
    await delay(500);
    return { ...data, id: `entity-${Date.now()}` };
  },

  update: async (id: string, data: Partial<Entity>): Promise<void> => {
    await delay(400);
  },

  delete: async (id: string): Promise<void> => {
    await delay(300);
  },
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
```

## Datasets

- Mínimo 3 items por entidad
- Incluir casos borde: items vacíos, estados variados
- Fechas: usar fechas relativas al momento actual

## Reglas

- Misma interfaz que tendrá el servicio real
- Delays: 200-800ms aleatorios para simular red
- Errores: incluir función `simulateError()` para tests
- No importar datos desde UI — solo desde servicios
