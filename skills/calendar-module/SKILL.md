---
name: calendar-module
description: Generate calendar components with time slots, availability, overlays, booking states, and mobile responsiveness.
trigger: creating calendar views, booking systems, schedule management, availability pickers
---

# Calendar Module Skill

SKILL CRÍTICA. El calendario es el núcleo del sistema.

## Componentes a Generar

### 1. WeekCalendar
Vista semanal con slots horarios.

```tsx
interface WeekCalendarProps {
  weekStart: Date;
  slots: TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
  availability: DayAvailability[];
}
```

### 2. DayCalendar
Vista diaria detallada para profesores.

### 3. MonthCalendar
Vista mensual compacta para dashboard.

### 4. TimeSlotPicker
Selector de slots disponibles para alumnos.

### 5. AvailabilityEditor
Editor de disponibilidad semanal para profesores.

## Estados de Slot

| Estado | Color | Descripción |
|--------|-------|-------------|
| `available` | `bg-primary/10` | Libre para reservar |
| `booked` | `bg-primary` | Ocupado por reserva |
| `pending` | `bg-yellow-400` | Reserva pendiente confirmación |
| `blocked` | `bg-gray-200` | Bloqueado por admin |
| `past` | `bg-gray-100` | Ya pasó |

## Mobile

- En móvil: mostrar solo DayCalendar con scroll vertical
- En tablet: mostrar WeekCalendar con slots compactos
- En desktop: mostrar WeekCalendar completo con sidebar de detalle

## Reglas

- NO generar calendarios desde cero. Extender shadcn Calendar si existe
- Slots: mínimo 30 minutos, máximo 2 horas
- Overlay de detalle: al hacer click en slot ocupado, mostrar información
- Las reservas no deben solaparse — validar siempre
- Touch-friendly: slots mínimo 44px de alto en mobile
