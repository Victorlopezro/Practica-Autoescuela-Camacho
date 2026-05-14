---
name: form-architecture
description: Generate forms with react-hook-form + zod, validations, error messages, loading states, and basic accessibility.
trigger: creating forms, data entry interfaces, settings pages, registration flows
---

# Form Architecture Skill

Genera formularios tipados con validación, estados y accesibilidad.

## Estructura Base

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function EntityForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* shadcn FormField components aquí */}
    </form>
  );
}
```

## Estados Obligatorios

- **Loading**: Deshabilitar botón submit mientras se envía
- **Error**: Mostrar errores de validación por campo + toast global
- **Success**: Reset o redirect después de submit exitoso
- **Empty**: Placeholder en inputs

## Reglas

- Siempre zod para validación
- Mensajes de error en español
- Botón submit: `disabled={isSubmitting}` + texto "Guardando..." durante submit
- Errores de API: toast + mensaje en el formulario
- Accesibilidad: label + error message asociado con aria-describedby
