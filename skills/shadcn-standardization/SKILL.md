---
name: shadcn-standardization
description: Normalize UI components, spacing, sizes, variants. Prevent inconsistent Tailwind.
trigger: UI normalization, design system maintenance, visual consistency review
---

# Shadcn Standardization Skill

Normaliza el uso de componentes UI para mantener consistencia visual.

## Reglas de Componentes

| Situación | Usar | Evitar |
|-----------|------|--------|
| Botón principal | `<Button>` (shadcn) | `<button className="bg-[#00628c]...">` |
| Botón secundario | `<Button variant="outline">` | `<button className="border...">` |
| Cards | `<Card>` (compartido) | `<div className="bg-white rounded-xl...">` |
| Inputs | `<Input>` (shadcn) | `<input className="...">` |
| Diálogos | `<Dialog>` (shadcn) | `<div className="fixed...">` |
| Tablas | `<Table>` (shadcn) | `<table className="...">` |
| Badges | `<Badge>` (shadcn) | `<span className="bg-green-50...">` |

## Colores

NO hardcodear colores hex. Usar:
- `text-primary` / `bg-primary` para #00628c
- `text-secondary` / `bg-secondary` para #4558ae
- `text-destructive` para errores
- Clases semánticas de shadcn/ui

```tsx
// ❌ MAL
<button className="bg-[#00628c] text-white">

// ✅ BIEN
<Button>Reservar</Button>
```

## Spacing

- Padding página: `p-4`
- Gap entre secciones: `space-y-4`
- Gap entre elementos: `gap-3`
- Card padding: `p-4` (ya incluido en el componente Card)

## Responsive

- Mobile-first: probar siempre en 375px primero
- Breakpoints: `sm:`, `md:`, `lg:` — NO breakpoints custom
- Touch targets: mínimo 44x44px para botones/icons
