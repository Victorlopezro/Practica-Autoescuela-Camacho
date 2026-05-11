---
title: "MVP - Proyecto de Digitalización e Integración de IA para Autoescuela"
subtitle: "Documento de Planificación para Prácticas de 90 Horas"
author: "Victor Lopez"
date: "Mayo 2026"
version: "1.0"
---

# 📋 MVP - Proyecto de Digitalización para Autoescuela

> **Proyecto:** Digitalización e Integración de IA para Autoescuela  
> **Duración:** 90 horas (3 semanas)  
> **Versión:** 1.0 - Mayo 2026

---

# 1. ¿Qué debería incluir el MVP?

## 1.1 Gestión básica de alumnos

### Funcionalidades

| Funcionalidad | Descripción |
|--------------|-------------|
| **Alta de alumnos** | Crear nuevos registros de alumnos |
| **Edición de alumnos** | Modificar información existente |
| **Información básica** | Nombre, teléfono, email, estado, profesor asignado |
| **Estados del alumno** | Teórica, Prácticas, Examen pendiente, Aprobado |

### Campos de Alumno

```
┌─────────────────────────────────────────────┐
│           DATOS DEL ALUMNO                   │
├─────────────────────────────────────────────┤
│  • Nombre completo                           │
│  • Teléfono                                  │
│  • Email                                     │
│  • Estado actual:                            │
│      - Teórica                               │
│      - Prácticas                             │
│      - Examen pendiente                      │
│      - Aprobado                              │
│  • Profesor asignado                         │
└─────────────────────────────────────────────┘
```

---

## 1.2 Agenda y reservas de clases prácticas

### Funcionalidades mínimas

| Funcionalidad | Descripción |
|---------------|-------------|
| **Calendario simple** | Vista visual de horarios y disponibilidad |
| **Reserva manual** | Crear reservas de clases de forma manual |
| **Visualización de horarios** | Ver disponibilidad de profesores/vehículos |
| **Evitar solapamientos** | Sistema que previene double-booking |
| **Asignaciones** | Alumno, Profesor, Vehículo |

### Datos de una Reserva

```
╔══════════════════════════════════════════╗
║         RESERVA DE CLASE PRÁCTICA        ║
╠══════════════════════════════════════════╣
║  Fecha y hora: __/__/____ __:__          ║
║  Alumno: ________________________        ║
║  Profesor: _________________________     ║
║  Vehículo: _________________________     ║
║  Duración: ___ minutos                   ║
║  Estado: Pendente / Confirmada / Realizada ║
╚══════════════════════════════════════════╝
```

---

## 1.3 Seguimiento de progreso del alumno

### Funcionalidades

| Funcionalidad | Descripción |
|---------------|-------------|
| **Número de prácticas realizadas** | Contador de clases completadas |
| **Observaciones del profesor** | Comentarios y feedback post-clase |
| **Nivel estimado** | Bajo / Medio / Preparado para examen |

### Niveles de Progreso

```
┌────────────────────────────────────────────────┐
│           NIVEL DE PROGRESO                     │
├────────────────────────────────────────────────┤
│  🔴 BAJO - Iniciando prácticas                 │
│  🟡 MEDIO - Progresando adecuadamente          │
│  🟢 PREPARADO - Listo para examen               │
└────────────────────────────────────────────────┘
```

> **⚠️ IMPORTANTE:** Esto NO sería todavía IA real.
> 
> **¿Qué sería?**
> - Lógica básica
> - Reglas predefinidas
> - Estadísticas simples
> 
> **¿Por qué?**
> - Deja preparada la estructura para IA futura
> - Sin depender de datos históricos
> - Funciona desde el primer día

---

## 1.4 Automatización básica de mensajes

### Prioridad recomendada: EMAIL primero

| Ventaja | Descripción |
|---------|-------------|
| ✅ **Gratuito** | Sin coste de API |
| ✅ **Sencillo** | SMTP simple de configurar |
| ✅ **Menos restricciones** | Sin políticas estrictas como WhatsApp |

### WhatsApp como opcional

| Consideración | Detalle |
|---------------|---------|
| **Coste** | Requiere API de WhatsApp Business |
| **Restricciones** | Políticas estrictas de Meta |
| **Complejidad** | Mayor integración necesaria |

### Mensajes a automatizar

```
┌─────────────────────────────────────────┐
│     MENSAJES AUTOMÁTICOS                │
├─────────────────────────────────────────┤
│  📅 Recordatorios de clases             │
│  📅 Citas de exámenes                   │
│  📅 Confirmaciones de reserva           │
│  📅 Resumen de progreso mensual         │
└─────────────────────────────────────────┘
```

### Alternativa realista

**Fase 1: Email automático**
- Plantillas deemail predefinidas
- Generación de mensajes basada en eventos
- Configuración SMTP sencilla

**Fase 2: Integración WhatsApp** *(si hay presupuesto)*
- API de WhatsApp Business
- Plantillasapproved por Meta
- Integración con el sistema de citas

---

## 1.5 Dashboard básico

### Métricas a mostrar

| Métrica | Descripción |
|---------|-------------|
| 👥 **Alumnos activos** | Total de alumnosen formación |
| 📅 **Próximas clases** | Clases programadas para hoy/semana |
| 🎯 **Preparados para examen** | Alumnos con nivel "preparado" |
| 📝 **Prácticas pendientes** | Clases que faltan por realizar |
| 📊 **Métricas simples** | Estadísticas básicas de progreso |

### Vista del Dashboard

```
╔═══════════════════════════════════════════════════════════╗
║                    DASHBOARD AUTOESCUELA                   ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    ║
║  │ 👥 45        │  │ 📅 12        │  │ 🎯 8         │    ║
║  │ Alumnos      │  │ Clases hoy   │  │ Preparados   │    ║
║  │ Activos      │  │              │  │ para examen  │    ║
║  └──────────────┘  └──────────────┘  └──────────────┘    ║
║                                                           ║
║  ┌─────────────────────────────────────────────────────┐ ║
║  │  PRÓXIMAS CLASES                                    │ ║
║  │  ─────────────────────────────────────────────────  │ ║
║  │  09:00 - Juan Pérez - Instructor Carlos            │ ║
║  │  10:30 - María García - Instructor Ana             │ ║
║  │  14:00 - Luis Martínez - Instructor Carlos         │ ║
║  └─────────────────────────────────────────────────────┘ ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

# 2. ¿Qué NO debería incluir el MVP?

## 2.1 No recomendable para 90 horas

### ❌ Comercial IA 24/7

| Problema | Detalle |
|----------|---------|
| **Complejidad** | Requiere NLP avanzado |
| **Contexto** | Mantener contexto de conversación |
| **APIs** | Integración compleja con servicios externos |
| **Mantenimiento** | Requiere monitoreo y ajustes constantes |

---

### ❌ IA predictiva avanzada

| Problema | Detalle |
|----------|---------|
| **Falta de datos** | No hay histórico suficiente |
| **Entrenamiento** | Requiere datasets grandes |
| **Validación** | Difícil de validar sin datos |
| **Tiempo** | Muy costoso en desarrollo |

---

### ❌ Teórica adaptativa completa

| Problema | Detalle |
|----------|---------|
| **Banco de preguntas** | Necesita estructura temática |
| **Motor adaptativo** | Algoritmo de selección de preguntas |
| **Clasificación** | Clasificación por temas y dificultad |
| **Tiempo** | Desarrollo muy extenso |

---

### ❌ Facturación automatizada completa

| Problema | Detalle |
|----------|---------|
| **Complejidad legal** | Requisitos fiscales complejos |
| **Plantillas** | Many diferentes formatos |
| **Integración contable** | Conexión con software de contabilidad |
| **Tiempo** | Muy extenso para el plazo |

---

### ❌ Gestión avanzada de mantenimiento

| Problema | Detalle |
|----------|---------|
| **Fuera de alcance** | No es crítico para el MVP |
| **Complejidad** | Requiere gestión de piezas, costes, etc. |
| **Prioridad** | Mejor como módulo futuro |

> **Decisión:** Dejar como módulo futuro, no incluir en MVP de 90h

---

# 3. Arquitectura realista (Open Source)

## 3.1 Stack Tecnológico

### Backend

| Opción | Recomendación | Uso |
|--------|---------------|-----|
| **FastAPI** | ✅ Recomendado | Rápido, moderno, ideal para APIs |
| **Django** | Alternativa | Más completo, curva de aprendizaje mayor |

---

### Frontend

| Opción | Recomendación | Uso |
|--------|---------------|-----|
| **React** | ✅ Recomendado | Flexible, ecosistema amplio |
| **Next.js** | Alternativa | SSR, mejor SEO, más features |
| **Panel Admin Simple** | Opción mínima | Si el tiempo apremia |

---

### Base de datos

| Opción | Recomendación | Uso |
|--------|---------------|-----|
| **PostgreSQL** | ✅ Recomendado | Robusto, relacional completo |
| **SQLite** | Para demo/MVP | Simple, sin instalación |

---

### Automatización

| Opción | Recomendación | Uso |
|--------|---------------|-----|
| **n8n** | ✅ Muy recomendable | Visual, fácil de mantener |
| **Scripts Python** | Alternativa | Más control, menos visual |

---

### IA (si llegas)

| Opción | Recomendación | Uso |
|--------|---------------|-----|
| **scikit-learn** | ✅ Open source ligero | Predicción básica |
| **LLMs grandes** | ❌ Evitar | Muy costosos para 90h |

---

## 3.2 Diagrama de Arquitectura

```
╔═══════════════════════════════════════════════════════════════════════╗
│                         ARQUITECTURA DEL MVP                          ║
╠═══════════════════════════════════════════════════════════════════════╣
│                                                                       │
│    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│    │   Alumno    │      │ Instructor  │      │  Admin      │         │
│    │  (Web/App)  │      │ (Web/App)   │      │  (Panel)    │         │
│    └──────┬──────┘      └──────┬──────┘      └──────┬──────┘         │
│           │                    │                    │                │
│           └────────────────────┼────────────────────┘                │
│                                │                                      │
│                                ▼                                      │
│                    ╔═══════════════════════╗                          │
│                    ║      API REST         ║                          │
│                    ║      (FastAPI)        ║                          │
│                    ╚═══════════════════════╝                          │
│                                │                                      │
│           ┌────────────────────┼────────────────────┐                 │
│           │                    │                    │                 │
│           ▼                    ▼                    ▼                 │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│    │   Gestión   │    │   Agenda    │    │  Automatiz. │            │
│    │   Alumnos   │    │   Reservas  │    │   Emails    │            │
│    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘            │
│           │                   │                   │                   │
│           └───────────────────┼───────────────────┘                   │
│                               │                                       │
│                               ▼                                       │
│                    ╔═══════════════════════╗                          │
│                    ║    PostgreSQL /SQLite ║                          │
│                    ╚═══════════════════════╝                          │
│                                                                       │
│                               │                                       │
│                               ▼                                       │
│                    ╔═══════════════════════╗                          │
│                    ║   n8n (Automatización)║                          │
│                    ║   (Email/WhatsApp)    ║                          │
│                    ╚═══════════════════════╝                          │
│                                                                       │
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 3.3 Tecnologías detalladas

| Área | Tecnología | Justificación |
|------|------------|---------------|
| **Backend** | FastAPI | Rápido, moderno, documentación automática |
| **Frontend** | React | Flexible, gran comunidad |
| **Base de datos** | PostgreSQL | Robusto, escalable |
| **Automatización** | n8n | Visual, fácil de mantener |
| **IA básica** | scikit-learn | Ligero, sin coste |
| **Emails** | SMTP | Simple, estándar |
| **Hosting** | Docker + VPS | Portable, profesional |
| **Auth** | JWT/Simple login | Seguro, rápido de implementar |

---

# 4. IA realista para 90h

## 4.1 Lo que SÍ podrías hacer

### Sistema de reglas simple

```
┌─────────────────────────────────────────────────────┐
│         LÓGICA DE PREDICCIÓN BÁSICA                 │
├─────────────────────────────────────────────────────┤
│  SI:                                                │
│    ✓ Muchas prácticas (>20)                        │
│    ✓ Pocos errores (<5)                             │
│    ✓ Progreso estable                               │
│  ENTONCES:                                          │
│    → "Probabilidad ALTA de aprobar"                 │
├─────────────────────────────────────────────────────┤
│  SI:                                                │
│    ✓ Pocas prácticas (<10)                          │
│    ✓ Muchos errores (>10)                          │
│    ✓ Progreso irregular                            │
│  ENTONCES:                                          │
│    → "Probabilidad MEDIA-BAJA de aprobar"          │
└─────────────────────────────────────────────────────┘
```

> **Resultado:** Sistema funcional que funciona desde el día 1, sin depender de datos históricos.

---

## 4.2 Lo que NO deberías intentar

| Evitar | Razón |
|--------|-------|
| ❌ Entrenar modelos complejos | Requiere datos y tiempo |
| ❌ Chatbots avanzados | Muy costoso |
| ❌ IA generativa seria | Necesita APIs externas costosas |
| ❌ Modelos deep learning | Excesivo para MVP |

---

# 5. Reparto realista de horas

## 5.1 Distribución por tarea

| Tarea | Horas aprox | Porcentaje |
|-------|-------------|------------|
| **Análisis y requisitos** | 10 h | 11% |
| **Diseño BD y arquitectura** | 8 h | 9% |
| **Backend** | 25 h | 28% |
| **Frontend** | 20 h | 22% |
| **Agenda/reservas** | 10 h | 11% |
| **Automatizaciones** | 7 h | 8% |
| **Dashboard** | 5 h | 6% |
| **Testing/documentación** | 5 h | 5% |
| **TOTAL** | **90 h** | **100%** |

---

## 5.2 Distribución visual

```
╔═══════════════════════════════════════════════════════════════════════╗
│                    DISTRIBUCIÓN DE 90 HORAS                          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Backend          ████████████████████          25h (28%)            ║
║  Frontend         ██████████████████             20h (22%)            ║
║  Análisis         ██████                          10h (11%)            ║
║  Agenda/Reservas  ██████                          10h (11%)            ║
║  Diseño BD        █████                           8h (9%)              ║
║  Automatizaciones ███                             7h (8%)              ║
║  Dashboard        ██                              5h (6%)              ║
║  Testing/Docs     ██                              5h (5%)              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 5.3 Cronograma semanal sugerido

| Semana | Foco | Entregable |
|--------|------|------------|
| **Semana 1** | Análisis, diseño, backend base | Estructura, API, DB |
| **Semana 2** | Frontend, agenda, reservas | UI funcional |
| **Semana 3** | Automatizaciones, dashboard, testing | MVP completo |

---

# 6. Resultado esperado del MVP

## 6.1 Al finalizar deberías poder enseñar

| Entregable | Descripción |
|------------|-------------|
| ✅ **Panel funcional** | Interfaz de administración operativa |
| ✅ **Alumnos gestionados** | CRUD completo de alumnos |
| ✅ **Reservas funcionando** | Sistema de reservas operativo |
| ✅ **Seguimiento de progreso** | Registro y visualización de progreso |
| ✅ **Recordatorios automáticos** | Emails automáticos funcionando |
| ✅ **Dashboard básico** | Métricas clave visibles |
| ✅ **Estructura ampliable** | Código preparado para fases futuras |

---

## 6.2 Vista previa del MVP

```
┌───────────────────────────────────────────────────────────────────────┐
│                         MVP - AUTOESCUELA                             │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────┬─────────────┬─────────────┬─────────────┐          │
│   │  👥 Alumnos │  📅 Reservas │  📊 Dashboard│  ⚙️ Ajustes│          │
│   └─────────────┴─────────────┴─────────────┴─────────────┘          │
│                                                                       │
│   ╔═══════════════════════════════════════════════════════════╗      │
│   ║  BIENVENIDO AL PANEL DE AUTOESCUELA                        ║      │
│   ╠═══════════════════════════════════════════════════════════╣      │
│   ║                                                           ║      │
│   ║  Alumnos activos: 45  |  Clases hoy: 12  |  Preparados: 8║      │
│   ║                                                           ║      │
│   ║  [+] Nuevo Alumno  [+] Nueva Reserva  [📧 Enviar Recordatorio]  ║      │
│   ║                                                           ║      │
│   ╚═══════════════════════════════════════════════════════════╝      │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

# 7. Resumen ejecutivo

## 7.1 MVP en síntesis

| Aspecto | Definición |
|---------|------------|
| **Objetivo** | Sistema funcional de gestión para autoescuela |
| **Alcance** | Alumnos, reservas, seguimiento, dashboard, automatizaciones |
| **Tecnologías** | FastAPI + React + PostgreSQL + n8n |
| **IA** | Lógica de reglas básica (NO ML complejo) |
| **Duración** | 90 horas distribuidas en 3 semanas |

---

## 7.2 Claves del éxito

1. **Enfocarse en lo esencial** - MVP significa mínimo viable
2. **Priorizar funcionalidad** - UI limpia pero funcional
3. **Automatizar lo básico** - Emails antes que WhatsApp
4. **Preparar la IA** - Estructura para futuro, no implementación
5. **Documentar siempre** - Facilita mantenimiento y explicación

---

## 7.3 Siguientes pasos

- [ ] Revisar con el tutor/empresa
- [ ] Confirmar prioridades
- [ ] Ajustar estimación de horas
- [ ] Iniciar desarrollo

---

> **Documento preparado para reunión de Kick Off**  
> **Fecha:** Mayo 2026  
> **Versión:** 1.0

---

*Este documento define el alcance realista del MVP para las prácticas de 90 horas. Cualquier cambio en el alcance deberá ser consensuado con el tutor de la empresa.*