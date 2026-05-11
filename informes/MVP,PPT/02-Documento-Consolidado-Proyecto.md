# 📋 DOCUMENTO CONSOLIDADO DEL PROYECTO

## Proyecto de Digitalización e Integración de IA para Autoescuela

| Campo | Detalle |
|-------|---------|
| **Versión** | 1.0 |
| **Fecha** | Mayo 2026 |
| **Duración** | 90 horas (3 semanas) |
| **Tipo** | Prácticas curriculares |

---

# 1. INTRODUCCIÓN

Este documento consolida toda la información recopilada para el proyecto de digitalización de una autoescuela mediante automatización e inteligencia artificial. El objetivo principal es transformar los procesos manuales de gestión en un sistema digitalizado que optimice la operativa diaria.

**Premisas fundamentales:**
- El proyecto tiene un límite REAL de 90 horas
- Debe usar herramientas OPEN SOURCE y gratuitas
- Debe ser realista y viable técnicamente
- Debe priorizar impacto operativo sobre cantidad de features

---

# 2. OBJETIVOS DEL PROYECTO

## 2.1 Objetivo Principal
Desarrollar un MVP funcional de gestión para la autoescuela que permita:
- Gestionar alumnos y su progreso
- Reservar clases prácticas
- Automatizar recordatorios básicos
- Visualizar métricas clave

## 2.2 Objetivos Específicos
1. Centralizar la información de alumnos
2. Digitalizar el proceso de reservas
3. Reducir trabajo manual mediante automatizaciones
4. Preparar estructura para futura IA
5. Generar informes básicos de gestión

---

# 3. PROBLEMAS DETECTADOS

## 3.1 Problemas Operativos
| Problema | Impacto | Prioridad |
|----------|---------|-----------|
| Gestión manual de reservas | Alto | ALTA |
| Seguimiento de progreso en papel | Medio | MEDIA |
| Recordatorios manuales | Medio | MEDIA |
| Falta de visibilidad de métricas | Bajo | BAJA |

## 3.2 Problemas de Alcance
- El alcance inicial es **demasiado amplio** para 90 horas
- Funcionalidades de IA requieren datos históricos que probablemente no existen
- Integraciones externas (WhatsApp, facturación) añaden complejidad significativa

## 3.3 Problemas Técnicos Potenciales
- Posible falta de datos históricos para IA
- Integraciones con APIs externas pueden fallar
- Tiempo limitado para pruebas exhaustivas

---

# 4. NECESIDADES DE LA EMPRESA (Por confirmar)

Basado en el análisis, las necesidades potenciales son:

| Necesidad | Descripción |
|-----------|-------------|
| **Gestión de alumnos** | Centralizar información de alumn@s |
| **Agenda digital** | Reservar clases sin papel |
| **Seguimiento** | Ver progreso de cada alumn@ |
| **Automatización** | Recordatorios automáticos |
| **Métricas** | Dashboard con información clave |
| **IA (futuro)** | Predicción de aprobado (solo si hay datos) |

---

# 5. FUNCIONALIDADES INICIALES PROPUESTAS

原始功能列表 (Lista original de funcionalidades):

1. **Predicción mediante IA** - Probabilidad de aprobado/suspenso
2. **Reservas de clases prácticas** - Seguimiento del progreso
3. **Agenda inteligente** - Organización de horarios
4. **Comercial virtual 24/7** - WhatsApp
5. **Automatización de WhatsApp** - Para exámenes
6. **Automatización de facturación**
7. **Teórica personalizada** - IA adaptativa
8. **Mantenimiento de vehículos** - ITV, revisiones
9. **Base de conocimiento** - Atención al cliente
10. **Asistente de recepción** - Primera atención

---

# 6. PRIORIZACIÓN DEFINITIVA

## 6.1 Matriz de Priorización

| Prioridad | Funcionalidad | Viabilidad | Justificación |
|-----------|---------------|------------|---------------|
| **ALTA** | Gestión de Alumnos | ✅ VIABLE | Core del sistema, simple de implementar |
| **ALTA** | Agenda y Reservas | ✅ VIABLE | Impacto directo, funcionalidad esencial |
| **ALTA** | Seguimiento de Progreso | ✅ VIABLE | Lógica básica, estructura para IA |
| **ALTA** | Dashboard | ✅ VIABLE | Métricas simples, alto valor |
| **ALTA** | Email Automatizado | ✅ VIABLE | SMTP gratuito, fácil implementación |
| **MEDIA** | WhatsApp Automatizado | ⚠️ PARCIAL | Requiere API, costes potenciales |
| **MEDIA** | IA Predictiva (POC) | ⚠️ CONDICIONAL | Solo si hay datos históricos |
| **MEDIA** | Facturación | ⚠️ COMPLEJO | Legalidad, integraciones |
| **BAJA** | Teórica Adaptativa | ❌ NO VIABLE | Requiere banco de preguntas, tiempo |
| **BAJA** | Comercial Virtual 24/7 | ❌ NO VIABLE | NLP complejo, muchas horas |
| **BAJA** | Mantenimiento Vehículos | ❌ NO VIABLE | Fuera de scope, no crítico |
| **BAJA** | Base de Conocimiento | ❌ NO VIABLE | Mucho tiempo, poco impacto |

---

# 7. MVP DEFINITIVO (90 HORAS)

## 7.1 Scope del MVP

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         MVP - 90 HORAS                                ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ✅ GESTIÓN DE ALUMNOS (15h)                                          ║
║     • Alta/Edición/Baja de alumn@s                                    ║
║     • Estados: Teórica/Prácticas/Examen/Aprobado                      ║
║     • Asignación de profesor                                         ║
║                                                                       ║
║  ✅ AGENDA Y RESERVAS (20h)                                           ║
║     • Calendario visual                                               ║
║     • Reserva de clases prácticas                                     ║
║     • Asignación: alumn@, profesor, vehículo                          ║
║     • Evitar solapamientos                                            ║
║                                                                       ║
║  ✅ SEGUIMIENTO DE PROGRESO (15h)                                     ║
║     • Número de prácticas                                             ║
║     • Observaciones del profesor                                      ║
║     • Nivel: Bajo/Medio/Preparado                                    ║
║     • NO es IA real - lógica básica + estadísticas                   ║
║                                                                       ║
║  ✅ AUTOMATIZACIÓN EMAIL (7h)                                        ║
║     • Recordatorios de clases                                        ║
║     • Confirmaciones de reserva                                       ║
║     • Notificaciones de exámenes                                     ║
║                                                                       ║
║  ✅ DASHBOARD (8h)                                                    ║
║     • Alumnos activos                                                ║
║     • Próximas clases                                                ║
║     • Preparados para examen                                         ║
║     • Métricas simples                                               ║
║                                                                       ║
║  ✅ INFRAESTRUCTURA (25h)                                             ║
║     • Backend API (FastAPI)                                          ║
║     • Frontend (React)                                               ║
║     • Base de datos (PostgreSQL)                                     ║
║     • Autenticación (JWT)                                            ║
║     • Despliegue (Docker)                                            ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## 7.2 Distribución de Horas

| Componente | Horas | % |
|------------|-------|---|
| Backend (API + DB + Auth) | 25h | 28% |
| Agenda y Reservas | 20h | 22% |
| Gestión de Alumnos | 15h | 17% |
| Seguimiento de Progreso | 15h | 17% |
| Dashboard | 8h | 9% |
| Automatización Email | 7h | 8% |

**TOTAL: 90h**

---

# 8. FUNCIONALIDADES FUTURAS (FASE 2+)

Las siguientes funcionalidades NO están incluidas en el MVP pero podrían svilupparsi en el futuro:

| Funcionalidad | Estimación | Dependencias |
|---------------|------------|--------------|
| WhatsApp Automatizado | 20-30h | API de WhatsApp Business |
| IA Predictiva (real) | 40-60h | Datos históricos, entrenamiento |
| Facturación Automatizada | 30-40h | Integración contable |
| Teórica Adaptativa | 80-100h | Banco de preguntas estructurado |
| Comercial Virtual 24/7 | 80-120h | NLP avanzado, APIs |
| Mantenimiento de Vehículos | 20-30h | - |

---

# 9. ANÁLISIS DE RIESGOS

## 9.1 Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Falta de datos para IA | ALTA | ALTO | Usar lógica de reglas en lugar de ML |
| Integración con APIs externas | MEDIA | MEDIO | Implementar fallbacks |
| Problemas de rendimiento | BAJA | MEDIO | Optimizar queries, caching básico |
| Complejidad de autenticación | BAJA | BAJO | Usar JWT simple |

## 9.2 Riesgos Económicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Coste de WhatsApp API | MEDIA | ALTO | Priorizar email primero |
| Coste de hosting/VPS | MEDIA | MEDIO | Usar plan básico, escalar si needed |
| Coste de servicios cloud | BAJA | MEDIO | Priorizar open source |

## 9.3 Riesgos Legales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| RGPD - Tratamiento de datos | MEDIA | ALTO | Anonimizar datos, consentimientos |
| Automatización de mensajes | BAJA | MEDIO | Incluir opt-out, GDPR compliant |
| Almacenamiento de datos de menores | BAJA | ALTO | Consultar con tutor legal |

## 9.4 Riesgos Operativos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Dependencia de infraestructura de empresa | MEDIA | ALTO | Documentar requisitos técnicos |
| Falta de acceso a datos históricos | ALTA | ALTO | Diseñar sin dependencia de histórico |
| Cambios en requisitos durante desarrollo | MEDIA | MEDIO | Validar alcance frecuentemente |

## 9.5 Riesgos de Alcance

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Scope creep | ALTA | ALTO | Definir scope claro, no aceptar cambios |
| Sobreestimación de capacidad | MEDIA | ALTO | Buffer de tiempo, priorizar features |
| Falta de testing | MEDIA | ALTO | Incluir tiempo de testing en estimación |

---

# 10. ARQUITECTURA TÉCNICA PROPUESTA

## 10.1 Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Backend** | FastAPI | Moderno, rápido, documentación automática, open source |
| **Frontend** | React | Gran ecosistema, componentes reutilizables |
| **Base de datos** | PostgreSQL | Robusto, relacional, open source |
| **Automatización** | n8n | Visual, fácil de mantener, open source |
| **IA (si llega)** | scikit-learn | Ligero, sin coste, para lógica básica |
| **Emails** | SMTP (SendGrid/Gmail) | Gratuito, estándar |
| **Despliegue** | Docker + VPS | Portable, profesional, bajo coste |

## 10.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA DEL MVP                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│   │   Alumno    │      │  Instructor │      │   Admin     │       │
│   │  (Frontend) │      │  (Frontend) │      │  (Panel)    │       │
│   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘       │
│          │                    │                    │               │
│          └────────────────────┼────────────────────┘               │
│                               │                                      │
│                               ▼                                      │
│                    ╔═══════════════════════╗                        │
│                    ║     API REST          ║                        │
│                    ║     (FastAPI)         ║                        │
│                    ╠═══════════════════════╣                        │
│                    ║  • /alumnos           ║                        │
│                    ║  • /reservas          ║                        │
│                    ║  • /progreso          ║                        │
│                    ║  • /dashboard         ║                        │
│                    ║  • /auth              ║                        │
│                    ╚═══════════════════════╝                        │
│                               │                                      │
│         ┌─────────────────────┼─────────────────────┐               │
│         │                     │                     │               │
│         ▼                     ▼                     ▼               │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│  │   Gestión   │      │   Agenda    │      │  Automatiz. │         │
│  │   Alumnos   │      │   Reservas  │      │   Emails    │         │
│  └──────┬──────┘      └──────┬──────┘      └──────┬──────┘         │
│         │                     │                     │               │
│         └─────────────────────┼─────────────────────┘               │
│                               │                                       │
│                               ▼                                       │
│                    ╔═══════════════════════╗                        │
│                    ║    PostgreSQL         ║                        │
│                    ╚═══════════════════════╝                        │
│                               │                                      │
│                               ▼                                       │
│                    ╔═══════════════════════╗                        │
│                    ║   n8n (opcional)       ║                        │
│                    ║   Automatización      ║                        │
│                    ╚═══════════════════════╝                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 10.3 Modelo de Datos (Entidades Principales)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Alumno     │     │   Instructor    │     │    Vehículo     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ nombre          │     │ nombre          │     │ matricula       │
│ apellido1       │     │ apellido1       │     │ modelo          │
│ apellido2       │     │ apellido2       │     │ marca           │
│ email           │     │ email           │     │ tipo            │
│ telefono        │     │ telefono       │     │ proxima_itv     │
│ dni             │     │ licencia       │     │ proxima_revision│
│ estado          │     └────────┬────────┘     └────────┬────────┘
│ fecha_alta      │              │                     │
│ instructor_id   │              │                     │
└────────┬────────┘              │                     │
         │          ┌────────────┴────────────┐        │
         │          │                        │        │
         ▼          ▼                        ▼        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Reserva       │     │  Clase Practica │     │    Progreso    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ fecha_hora      │     │ fecha_hora      │     │ clase_id (FK)   │
│ duracion        │     │ duracion        │     │ instructor_id  │
│ estado          │     │ estado          │     │ habilidades    │
│ alumnoid (FK)   │     │ alumnoid (FK)   │     │ errores         │
│ instructor_id   │     │ instructor_id   │     │ comentarios    │
│ vehiculo_id     │     │ vehiculo_id     │     │ nivel           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

# 11. COSTES Y DEPENDENCIAS EXTERNAS

## 11.1 Costes Estimados (MVP)

| Concepto | Coste | Notas |
|----------|-------|-------|
| Dominio | 10-15€/año | Opcional para desarrollo |
| VPS (DigitalOcean/Hetzner) | 5-10€/mes | Básico, 1GB RAM basta |
| Email (SendGrid/Gmail) | **GRATIS** | Hasta 100 emails/día |
| WhatsApp API | **PAGO** | Solo si se aprueba |
| PostgreSQL | **GRATIS** | Open source |
| n8n | **GRATIS** | Self-hosted |
| FastAPI | **GRATIS** | Open source |
| React | **GRATIS** | Open source |

**Coste mensual estimado MVP: 5-10€** (solo VPS)

## 11.2 Dependencias de Pago Potenciales

| Servicio | Coste aprox | Cuando se necesita |
|----------|-------------|-------------------|
| WhatsApp Business API | 0.01-0.05€/mensaje | Si se aprueba integración |
| Twilio (alternativa) | Similar | Si WhatsApp no disponible |
| SendGrid Pro | 15€/mes si > 100 emails/día | Solo si alto volumen |

---

# 12. REQUISITOS PENDIENTES POR CONFIRMAR

Antes de iniciar el desarrollo, es necesario confirmar:

| Requisito | Pregunta | Prioridad |
|-----------|----------|-----------|
| **Infraestructura** | ¿Qué equipo/software usan actualmente? | ALTA |
| **Datos** | ¿Tienen datos históricos de alumn@s? | ALTA |
| **Acceso** | ¿Qué acceso técnico pueden proporcionar? | ALTA |
| **Prioridad** | ¿Qué funcionalidad es más urgente? | ALTA |
| **Usuario** | ¿Quién validará avances? | MEDIA |
| **Horario** | ¿Cuándo pueden hacer reuniones? | MEDIA |
| **Problemas** | ¿Qué proceso les roba más tiempo? | ALTA |
| **Volumen** | ¿Cuántos alumn@s gestionan al mes? | MEDIA |
| **Personal** | ¿Cuántos instructores y vehículos? | MEDIA |
| **Legal** | ¿Tienen política de privacidad? | BAJA |

---

# 13. PREGUNTAS PARA LA EMPRESA

## 13.1 Preguntas de Contexto (Vitales)

1. ¿Qué funcionalidad consideran más importante actualmente?
2. ¿Qué problema operativo les genera más pérdidas de tiempo?
3. ¿Qué software utilizan actualmente para gestión?
4. ¿Tienen datos históricos de alumn@s (en papel o digital)?
5. ¿Cómo gestionan actualmente las clases prácticas y horarios?

## 13.2 Preguntas de Recursos

6. ¿Cuántos alumn@s gestionan al mes aproximadamente?
7. ¿Cuántos vehículos e instructores tienen?
8. ¿Utilizan actualmente WhatsApp Business?
9. ¿Qué acceso técnico podrán proporcionar durante las prácticas?

## 13.3 Preguntas de Expectativas

10. ¿Prefieren un POC funcional o un sistema más completo?
11. ¿Qué parte del proyecto consideran imprescindible?
12. ¿Tienen presupuesto para APIs externas (WhatsApp)?
13. ¿Quién será el responsable de validar avances?

## 13.4 Preguntas Legales

14. ¿Tienen política de protección de datos (RGPD)?
15. ¿Los alumn@s menores de edad requieren consentimiento parental?

---

# 14. GUIÓN PARA LA REUNIÓN DE KICK OFF

## 14.1 Estructura de la Reunión (20-30 minutos)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    REUNIÓN DE KICK OFF                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  [0-3 min]     PRESENTACIÓN                                          │
│                • Presentarse                                         │
│                • Explicar naturaleza de prácticas                    │
│                • Duración: 90 horas / 3 semanas                     │
│                                                                      │
│  [3-10 min]    CONTEXTO DEL PROYECTO                                 │
│                • Explicar alcance inicial propuesto                  │
│                • Mencionar limitaciones de tiempo                    │
│                • Mostrar visión de transformación digital            │
│                                                                      │
│  [10-18 min]   PREGUNTAS CLAVE                                       │
│                • Cuál es el problema más urgente?                   │
│                • Qué software usan actualmente?                      │
│                • Tienen datos históricos?                           │
│                • Qué priorizan?                                     │
│                                                                      │
│  [18-25 min]   PROPUESTA DE MVP                                      │
│                • Explicar qué es un MVP                              │
│                • Presentar alcance propuesto                        │
│                • Resaltar: email antes de WhatsApp                  │
│                • Resaltar: lógica básica, NO IA avanzada            │
│                                                                      │
│  [25-30 min]   CIERRE Y PRÓXIMOS PASOS                              │
│                • Confirmar prioridades                               │
│                • Establecer canal de comunicación                   │
│                • Definir siguiente reunión                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## 14.2 Cómo Hablar de las Limitaciones

**NO DECIR:** "Solo tengo 90 horas, no puedo hacer mucho"

**DECIR:** "He diseñado un MVP realista que asegura un sistema funcional entregable. Las funcionalidades avanzadas pueden svilupparsi en fases futuras."

**Para IA predictiva:**
"Para la predicción de aprobado, precisamos datos históricos de alumn@s que ya han fatto el examen. Si no hay datos, puedo implementar un sistema de reglas básico que funcione desde el primer día y dejar la estructura lista para IA futura."

**Para WhatsApp:**
"Recomiendo empezar con email automático porque es gratuito y no tiene restricciones. WhatsApp Business API tiene costes por mensaje y requiere aprobación de Meta. Si el presupuesto lo permite, podemos incluirlo después."

## 14.3 Cómo Cerrar la Reunión

1. **Resumir acuerdos** - Repasar lo decidido
2. **Confirmar prioridades** - Qué se hace primero
3. **Establecer comunicación** - Canal y frecuencia
4. **Definir siguiente paso** - Fecha de próxima reunión
5. **Agradecer** - Por su tiempo y disposición

---

# 15. PRESENTACIÓN POWERPOINT (ESTRUCTURA)

## Diapositivas Sugeridas

| # | Título | Contenido |
|---|--------|-----------|
| 1 | Portada | Proyecto, tu nombre, fecha |
| 2 | Contexto | Por qué digitalización |
| 3 | Problemas actuales | Los 3-4 problemas principales |
| 4 | Objetivos | Qué queremos lograr |
| 5 | Funcionalidades propuestas | Lista completa |
| 6 | Priorización | Matriz Alta/Media/Baja |
| 7 | MVP - Lo que haremos | Lista de funcionalidades MVP |
| 8 | MVP - Lo que NO haremos | Funcionalidades excluidas |
| 9 | Arquitectura | Diagrama de componentes |
| 10 | Stack tecnológico | Tecnologías propuestas |
| 11 | Roadmap | Fases del proyecto |
| 12 | Riesgos | Tabla de riesgos principales |
| 13 | Costes | Estimación económica |
| 14 | Próximos pasos | Qué necesitamos confirmar |

---

# 16. ROADMAP REALISTA

## Fase 1: MVP (Semana 1) - 30h aprox
```
Semana 1 (30h)
├── Día 1-2: Análisis y requisitos (8h)
│   └── Reunión kick-off, confirmar alcance
├── Día 3-4: Diseño BD y arquitectura (10h)
│   └── Modelo de datos, estructura API
└── Día 5: Setup entorno (6h)
    └── Repositorio, Docker, PostgreSQL
```

## Fase 2: Desarrollo Core (Semana 2) - 30h aprox
```
Semana 2 (30h)
├── Backend API (15h)
│   └── Endpoints: alumn@s, reservas, progreso
├── Frontend base (10h)
│   └── Login, navegación, layout
└── Integración básica (5h)
    └── Conectar frontend con API
```

## Fase 3: Funcionalidades y Cierre (Semana 3) - 30h aprox
```
Semana 3 (30h)
├── Agenda y reservas (10h)
│   └── Calendario, gestión de horarios
├── Automatización (7h)
│   └── Email SMTP, plantillas
├── Dashboard (5h)
│   └── Métricas y visualizaciones
├── Testing y docs (5h)
│   └── Pruebas, README, usuario
└── Entrega y ajustes (3h)
    └── Demo final, ajustes menores
```

---

# 17. CONCLUSIONES

## 17.1 Puntos Clave

1. **El proyecto es viable** - 90 horas son suficientes para un MVP funcional
2. **Scope realista** - Priorizar gestión de alumn@s, reservas y automatizaciones básicas
3. **Email > WhatsApp** - Gratuito, simple, sin dependencias de pago
4. **IA como POC** - Solo lógica de reglas, no ML complejo
5. **Stack open source** - FastAPI, React, PostgreSQL, n8n
6. **Coste mínimo** - Solo VPS (~5-10€/mes)

## 17.2 Éxito del Proyecto

**El MVP será exitoso si al final:**
- ✅ Se puede gestionar alumn@s (alta, edición, estados)
- ✅ Se pueden reservar clases prácticas
- ✅ Se puede ver el progreso de cada alumn@
- ✅ Se envían recordatorios automáticos por email
- ✅ Hay un dashboard con métricas básicas
- ✅ El sistema está desplegado y funcional

## 17.3 Warning Final

⚠️ **NO intentar incluir:**
- Comercial IA 24/7
- IA predictiva real (sin datos)
- Teórica adaptativa
- Facturación automatizada completa

Estos requerirían varias veces las 90 horas disponibles.

---

# ANEXO: Tabla de Riesgos Consolidada

| ID | Categoría | Riesgo | Prob. | Imp. | Mitigación |
|----|-----------|--------|-------|------|------------|
| R1 | Técnico | Falta de datos para IA | ALTA | ALTO | Usar reglas, no ML |
| R2 | Alcance | Scope creep | ALTA | ALTO | Definir scope, no aceptar cambios |
| R3 | Económico | Coste WhatsApp API | MEDIA | ALTO | Priorizar email |
| R4 | Legal | RGPD | MEDIA | ALTO | Anonimizar, consentimientos |
| R5 | Operativo | Dependencia de infraestructura | MEDIA | ALTO | Documentar requisitos |
| R6 | Técnico | Integración APIs | MEDIA | MEDIO | Fallbacks, mocks |
| R7 | Alcance | Sobreestimación | MEDIA | ALTO | Buffer, priorizar |

---

*Documento consolidado - Mayo 2026*
*Versión 1.0*