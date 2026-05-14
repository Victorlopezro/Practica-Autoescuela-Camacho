---
name: feature-cleanup
description: Detect duplicate components, dead imports, repeated Tailwind, redundant variants, and temporary code.
trigger: code review, technical debt analysis, pre-refactor cleanup
---

# Feature Cleanup Skill

Detecta y reporta código duplicado, imports muertos y Tailwind inconsistente.

## Qué Detectar

### 1. Componentes Duplicados
- Misma estructura visual en múltiples roles → sugerir unificación
- Cards que hacen lo mismo pero con diferentes clases

### 2. Imports Muertos
- Componentes importados pero no usados en el JSX
- Servicios importados pero no llamados

### 3. Tailwind Repetido
- Mismas combinaciones de clases en múltiples lugares
- `bg-[#00628c]` hardcodeado en vez de `bg-primary`

### 4. Variantes Redundantes
- Dos versiones del mismo componente (refactored vs refinado)
- Layouts duplicados

### 5. Código Temporal
- TODO comments
- hardcoded data que debería venir de servicios
- console.log statements

## Output

Generar reporte con:
```
{file}:{line} | {type} | {severity} | {suggestion}
```

## Reglas

- NO modificar código automáticamente — solo reportar
- Clasificar severidad: ALTA (bug potencial) | MEDIA (deuda) | BAJA (estilo)
- Priorizar ALTA y MEDIA sobre BAJA
