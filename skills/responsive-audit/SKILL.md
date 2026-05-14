---
name: responsive-audit
description: Review breakpoints, overflow, touch targets, spacing, mobile UX, and desktop UX.
trigger: responsive review, mobile testing, cross-device compatibility check
---

# Responsive Audit Skill

Audita el responsive de todas las pantallas.

## Checklist de Auditoría

### Mobile (375px) — Prioridad máxima
- [ ] ¿Todo el contenido es visible sin scroll horizontal?
- [ ] ¿Los botones tienen mínimo 44x44px?
- [ ] ¿Los inputs tienen suficiente padding?
- [ ] ¿La navegación inferior funciona correctamente?
- [ ] ¿Las tablas tienen scroll horizontal?
- [ ] ¿Los modales ocupan todo el ancho?

### Tablet (768px)
- [ ] ¿El layout usa 2 columnas donde corresponde?
- [ ] ¿Los calendarios muestran la semana completa?
- [ ] ¿La navegación lateral aparece (si aplica)?

### Desktop (1024px+)
- [ ] ¿El layout usa el espacio disponible?
- [ ] ¿Las tablas muestran todas las columnas?
- [ ] ¿No hay contenedores con max-width muy pequeños?

## Problemas Comunes a Buscar

```tsx
// ❌ Fixed width (peta en mobile)
<div className="w-[400px]">

// ❌ Overflow oculto (pérdida de contenido)
<div className="overflow-hidden">

// ❌ Tabla sin scroll horizontal en mobile
<table className="..."> // necesita wrapper con overflow-x-auto
```

## Reglas

- Mobile-first: probar en 375px antes que en cualquier otro tamaño
- Touch targets: todos los elementos interactivos ≥ 44x44px
- Texto: mínimo 16px en inputs para evitar zoom en iOS
- Overflow: evitar overflow:hidden en contenedores principales
