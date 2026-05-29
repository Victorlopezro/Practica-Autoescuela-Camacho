# 📋 Guía del Sistema de Reglas — Autoescuela

> Documento vivo. Actualizamos a medida que agregamos nuevas directrices.

## Índice

1. [¿Qué es?](#qué-es)
2. [Cómo funciona](#cómo-funciona)
3. [Campos de contexto disponibles](#campos-de-contexto-disponibles)
4. [Operadores](#operadores)
5. [Acciones](#acciones)
6. [Prioridades y flujo de evaluación](#prioridades-y-flujo-de-evaluación)
7. [Cómo escribir reglas en lenguaje natural](#cómo-escribir-reglas-en-lenguaje-natural)
8. [Ejemplos que funcionan bien](#ejemplos-que-funcionan-bien)
9. [Cosas que el AI NO entiende bien](#cosas-que-el-ai-no-entiende-bien)
10. [Límites conocidos](#límites-conocidos)
11. [Reglas actuales en el sistema](#reglas-actuales-en-el-sistema)

---

## ¿Qué es?

Es un **motor de reglas** que evalúa cada intento de reserva antes de permitirla. Las reglas se escriben en lenguaje natural desde el panel de administración y el sistema las traduce automáticamente a condiciones evaluables.

**No hay que tocar código** para añadir, modificar o eliminar reglas. Se hace todo desde la interfaz de administración → Reglas.

## Cómo funciona

Cuando un alumno intenta reservar una clase, el sistema:

1. Recoge el **contexto** de la reserva (profesor, alumno, vehículo, horario, etc.)
2. Si hay solapamiento con otra reserva, también recoge los **carnets de los alumnos que ya están** en ese horario
3. Evalúa las **reglas activas** en orden de prioridad
4. Decide si bloquea, advierte o permite la reserva

## Campos de contexto disponibles

Estos son los datos que el sistema conoce y sobre los que se pueden escribir reglas:

| Campo | Tipo | Qué es | Ejemplo de regla |
|---|---|---|---|
| `vehicleType` | texto | Tipo de vehículo (coche, ciclomotor, etc.) | _"No permitir coche a alumnos con A1"_ |
| `time` | hora | Hora de inicio de la clase (HH:mm) | _"No reservar antes de las 8:00"_ |
| `date` | fecha | Fecha de la clase (YYYY-MM-DD) | _"Bloquear el 25 de diciembre"_ |
| `dayOfWeek` | número | Día de la semana (0=domingo, 6=sábado) | _"Solo clases entre lunes y viernes"_ |
| `duration` | número | Duración en minutos | _"Clases de 90 min solo si quedan pocas"_ |
| `teacher.doubleSession` | booleano | Si el profesor tiene doble sesión activada | _"Bloquear doble sesión para este profe"_ |
| `student.licenseType` | texto | Carnet del alumno (A1, A2, AM, B, etc.) | _"Solo B puede usar el coche"_ |
| `student.remainingClasses` | número | Clases que le quedan al alumno | _"Advertir si quedan menos de 3 clases"_ |
 | `overlappingLicenseTypes` | array | Carnets de los alumnos que ya ocupan ese slot | _"Permitir A1 si el que ya está es A2"_ |
 | `overlappingVehicleTypes` | array | Tipos de vehículo de las reservas solapadas | _"No permitir dos motos en mismo horario"_ |
 | `overlappingCount` | número | Cuántos alumnos ya tienen ese horario | _"Máximo 2 alumnos por horario"_ |
 | `isDeadlinePassed` | booleano | Si pasó el plazo de reserva (día anterior a las 18:00) | _"No reservar si pasó el plazo"_ |

## Operadores

| Operador | Significado | Para qué sirve |
|---|---|---|
| `eq` | Igual a | `student.licenseType eq A1` |
| `neq` | Distinto de | `vehicleType neq ciclomotor` |
| `gt` | Mayor que | `overlappingCount gt 1` |
| `gte` | Mayor o igual que | `overlappingCount gte 2` |
| `lt` | Menor que | `duration lt 60` |
| `lte` | Menor o igual que | `remainingClasses lte 3` |
| `in` | Está en una lista | `dayOfWeek in (0, 6)` — fines de semana |
| `notIn` | No está en una lista | `vehicleType notIn (coche, ciclomotor)` |
| `contains` | Un array contiene un valor | `overlappingLicenseTypes contains A2` |

## Acciones

| Acción | Qué hace |
|---|---|
| **block** | ❌ Bloquea la reserva. El alumno no puede crearla. |
| **warn** | ⚠️ Muestra una advertencia pero permite continuar. |
| **allow** | ✅ Permite explícitamente. Corta la evaluación — **ninguna regla posterior se evalúa**. |

## Prioridades y flujo de evaluación

Las reglas tienen una **prioridad numérica**. Menos número = más prioridad.

El flujo es:

```
1. Se evalúan todas las reglas activas ordenadas por prioridad (ascendente)
2. Si una regla allow coincide → se corta ahí, se permite (nada más se evalúa)
3. Si una regla block coincide → se corta ahí, se bloquea
4. Si una regla warn coincide → se guarda la advertencia y se sigue evaluando
5. Si ninguna regla coincide → la reserva sigue su curso normal
```

**IMPORTANTE**: Las reglas allow tienen un comportamiento especial. Si una allow coincide, **el sistema no evalúa nada más**. Por eso las reglas de límite general (como "máximo 2 alumnos") deben tener prioridad MÁS ALTA (número más bajo) que las allow.

### Prioridades actuales

| Prioridad | Regla | Acción |
|---|---|---|
| 1 | Vacaciones, festivos, deadline | block |
| 2 | Faltas del profesor | block |
| **5** | **Límite de doble sesión (max 2)** | **block** |
| 10 | Allow por combinación de carnets | allow |
| 50 | Incremento de cuadrícula | warn |
| 60 | Restricción doble sesión | warn |
| 100 | Bloqueo genérico de solapamientos | block |

## Cómo escribir reglas en lenguaje natural

### ✅ Buenas prácticas

1. **Sé específico**: _"Los alumnos con carnet A1 no pueden reservar coches, solo ciclomotor"_ → mejor que _"Restricción de vehículos"_
2. **Usa el vocabulario del sistema**: carnet/licencia (A1, A2, AM, B), vehículo (coche, ciclomotor), día de la semana, fecha
3. **Una regla = una directriz**: No mezcles cosas distintas en una misma regla
4. **Si necesitas límites numéricos, dilo explícitamente**: _"Máximo 2 alumnos en el mismo horario"_
5. **Menciona el contexto relevante**: qué profesor, qué alumno, qué vehículo, qué día

### ❌ Malas prácticas

- _"Gestionar mejor las reservas"_ — demasiado vago, el AI no sabe qué significa "mejor"
- _"Que no se junten alumnos conflictivos"_ — el AI no sabe quién es conflictivo
- _"Algo con las fechas"_ — demasiado ambiguo
- Poner "(max 2)" solo en el nombre sin decirlo en la descripción — el AI no lo traduce a condición real

## Ejemplos que funcionan bien

```
"Los alumnos con carnet AM solo pueden reservar el ciclomotor"
→ student.licenseType eq AM AND vehicleType neq ciclomotor → block
```

```
"No se pueden hacer clases los fines de semana"
→ dayOfWeek in (0, 6) → block
```

```
"Si al alumno le quedan menos de 3 clases, advertir que necesita
un incremento de duración a 90 minutos"
→ student.remainingClasses lt 3 → warn
```

```
"Permitir que un alumno con carnet A1 pueda compartir horario
con un alumno que tenga carnet A2"
→ student.licenseType eq A1 AND overlappingLicenseTypes contains A2 → allow
```

```
"Máximo 2 alumnos en el mismo horario con el mismo profesor"
→ overlappingCount gte 2 → block
```

## Cosas que el AI NO entiende bien

- **Reglas condicionales complejas** con múltiples excepciones: _"bloquear X excepto cuando Y y además Z"_
- **Lógica temporal elaborada**: _"cada 3 semanas"_ — no es compatible
- **Referencias a personas por nombre** que no están en el sistema: el AI no puede resolver "Juan" a menos que el nombre del profesor coincida exactamente
- **Reglas que dependen del historial**: _"si ya tuvo 3 clases esta semana"_ — el contexto actual no incluye historial semanal
- **Cálculos entre campos**: _"que la duración no supere las clases restantes por 10 minutos"_

## Límites conocidos

- El AI puede generar reglas con `confidence: "low"` cuando no está seguro. Esas reglas se saltan en la evaluación (no se usan).
- Las reglas con `ruleType` distinto de `overlap` no se evalúan en el motor de reglas general.
- Si el motor de reglas está deshabilitado (`RULES_ENGINE_ENABLED`), las reglas no se cargan.
- Las reglas allow cortan la evaluación. Cualquier regla block que deba aplicarse incluso cuando hay allow (ej: límite de alumnos) debe tener prioridad más alta (número más bajo).

## Reglas actuales en el sistema

| Prioridad | Nombre | Acción | Propósito |
|---|---|---|---|
| 1 | Deadline de reserva | block | No reservar si pasó el día anterior a las 18:00 |
| 1 | Vacaciones / Fiestas | block | Días festivos o vacaciones del profesor |
| 2 | Falta del profesor | block | Bloquear horario cuando el profesor falta |
| **5** | **Límite de doble sesión (max 2)** | **block** | **Máximo 2 alumnos por horario** |
| 10 | Solapamiento A1→A2 | allow | A1 puede compartir con A2 |
| 10 | Solapamiento A2→A1 | allow | A2 puede compartir con A1 |
| 10 | Solapamiento AM→A2 | allow | AM puede compartir con A2 |
| 10 | Solapamiento A2→AM | allow | A2 puede compartir con AM |
| 50 | Incremento de cuadrícula | warn | Si al alumno le quedan ≤3 clases, avisar |
| 60 | Restricción doble sesión | warn | Si al alumno le quedan >5 clases y dura 90min, avisar |
| 100 | Bloquear solapamientos no permitidos | block | Si hay solapamiento y ninguna allow coincidió, bloquear |

---

## 🔧 Field Registry (para desarrolladores)

El sistema usa un **Field Registry** como fuente única de verdad para los campos disponibles. Está definido en `rule-engine.service.ts`.

Cuando se agrega un campo nuevo:

1. Se añade una entrada al `FIELD_REGISTRY` con nombre, descripción, tipo y ejemplos
2. Se agrega el campo al `RuleContext` (TypeScript)
3. Se añade un resolver en el mapa del constructor
4. ✅ El prompt de la IA se genera automáticamente
5. ✅ La validación funciona sin cambios adicionales

Esto permite que el sistema sea **extensible sin tocar prompts ni switch statements**.

---

> 📝 **Para añadir una regla nueva**: Panel de administración → Reglas → "Añadir regla" → Escribir en lenguaje natural → El AI traduce automáticamente.
>
> 🔄 **Esta guía se actualiza** a medida que agregamos nuevas capacidades al sistema de reglas.
