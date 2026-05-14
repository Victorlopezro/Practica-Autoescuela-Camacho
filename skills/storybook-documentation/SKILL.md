---
name: storybook-documentation
description: Generate stories, document components, detect undocumented components, maintain visual coherence.
trigger: creating Storybook stories, documenting components, UI library maintenance
---

# Storybook Documentation Skill

Crea y mantiene la documentación de componentes en Storybook.

## Estructura de Story

```tsx
// components/{category}/{component}.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta = {
  title: '{Category}/{Component}',
  component: Component,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof Component>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // props por defecto
  },
};

export const WithData: Story = {
  args: {
    // variante con datos
  },
};

export const Empty: Story = {
  args: {
    // estado vacío
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
```

## Cobertura Mínima

- Default: estado normal con datos
- Empty: estado vacío/sin datos
- Loading: estado de carga
- Error: estado de error (si aplica)
- Variantes: primary, secondary, outline (para botones)

## Reglas

- Todo componente compartido en `/components/` debe tener story
- Stories en el mismo directorio que el componente
- Usar `autodocs` para generar documentación automática
- Incluir controles para todas las props
- Usar `argTypes` para props complejas
