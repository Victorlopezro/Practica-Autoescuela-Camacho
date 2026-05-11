# 📋 DOCUMENTO FINAL CONSOLIDADO DEL PROYECTO

## Proyecto de Digitalización e Integración de IA para Autoescuela

| Campo | Detalle |
|-------|---------|
| **Versión** | 2.0 (Consolidada) |
| **Fecha** | Mayo 2026 |
| **Duración** | 90 horas (3 semanas) |
| **Tipo** | Prácticas curriculares |
| **Estado** | Listo para reunión de Kick Off |

---

# 1. RESUMEN EJECUTIVO

## 1.1 El Proyecto en Síntesis

La autoescuela necesita modernizar sus procesos operativos mediante digitalización e inteligencia artificial. El alcance inicial propose 10 funcionalidades, pero el límite de **90 horas** requiere una priorización extrema.

**NOTA DEL ANÁLISIS:**
> Las 90 horas son tu tiempo total de trabajo en prácticas (individual). Este límite realista es el que guía toda la priorización del proyecto.

## 1.2 Propuesta Realista

**Lo que SÍ podemos entregar en 90 horas:**
- ✅ Sistema de gestión de alumn@s completo
- ✅ Agenda y reservas de clases prácticas
- ✅ Seguimiento de progreso (lógica básica, NO IA avanzada)
- ✅ Dashboard con métricas
- ✅ Automatización de emails (gratuito)
- ✅ Base estructura para fases futuras

**Lo que NO es viable en 90 horas:**
- ❌ IA predictiva real (sin datos históricos)
- ❌ Comercial Virtual 24/7 (NLP muy complejo)
- ❌ Teórica adaptativa completa
- ❌ Facturación automatizada completa
- ❌ WhatsApp Business API (coste + complejidad)

---

# 2. CONTEXTO DEL PROYECTO

## 2.1 Requisitos Originales del Cliente (10 funcionalidades)

| # | Funcionalidad Original | Descripción |
|---|----------------------|-------------|
| 1 | **IA para predecir aprobado** | App con IA para predecir con exactitud si el alumn@ está preparado para aprobar o no |
| 2 | **Reservas y progreso** | Reservas de clases y progreso clases prácticas |
| 3 | **Agenda inteligente** | Agenda inteligente |
| 4 | **Comercial Virtual 24/7** | Comercial Virtual 24/7 vía WhatsApp para pre-matrículas |
| 5 | **WhatsApp exámenes** | Automatización de mensajes de WhatsApp con citas de exámenes teóricos (lugar y hora) |
| 6 | **Facturación** | Automatización de facturas |
| 7 | **Teórica adaptativa** | Teórica personalizada con IA adaptativa para detectar dónde falla más el alumn@ y generar más test específicos |
| 8 | **Mantenimiento vehículos** | Recordatorio mantenimiento de vehículos (ITV, revisiones, etc.) |
| 9 | **Base de conocimiento** | Base de conocimiento para atención al cliente |
| 10 | **Asistente de recepción** | Asistente de recepción y primera atención |

## 2.2 Análisis de Viabilidad

| Funcionalidad | Viabilidad | Horas estimadas | Notas |
|---------------|------------|-----------------|-------|
| IA predictiva | ⚠️ PARCIAL | 40-60h | Sin datos históricos = NO FUNCIONA. Solo lógica de reglas |
| Reservas y progreso | ✅ VIABLE | 25h | Core del sistema |
| Agenda inteligente | ✅ VIABLE | 20h | Aunque "inteligente" = simple, no optimización IA |
| Comercial Virtual 24/7 | ❌ NO VIABLE | 80-120h | NLP muy complejo, muchas horas |
| WhatsApp exámenes | ⚠️ PARCIAL | 15h | Coste API, restricciones Meta |
| Facturación | ❌ NO VIABLE | 30-40h | Complejidad legal y fiscal |
| Teórica adaptativa | ❌ NO VIABLE | 80-100h | Requiere banco de preguntas, tiempo |
| Mantenimiento vehículos | ⚠️ POSTERGABLE | 20h | No crítico para MVP |
| Base de conocimiento | ⚠️ POSTERGABLE | 20h | Mucho tiempo, poco ROI inmediato |
| Asistente recepción | ❌ NO VIABLE | 40h | Similar a Comercial Virtual |

---

# 3. PROBLEMAS Y RIESGOS IDENTIFICADOS

## 3.1 Problemas Técnicos Críticos

### Problema #1: Falta de Datos Estructurados (MAYOR PROBLEMA)

**afecta especialmente a:**
- IA predictiva
- Teórica adaptativa
- Estadísticas de alumn@s
- Automatizaciones inteligentes

**Realidad de las autoescuelas:**
- Excel desordenados
- Datos incompletos
- Información en papel
- Sistemas antiguos
- Datos duplicados
- Falta de histórico

**Consecuencia:** La IA no puede "inventar" patrones si no hay datos suficientes.

---

### Problema #2: Integración con Software Existente

**La empresa puede usar:**
- Software cerrado
- Software antiguo
- Sin API
- O directamente no tener sistema digital

**Riesgo:** No podrás integrar automáticamente reservas, facturación, alumn@s, horarios, pagos.

---

### Problema #3: Hosting / Despliegue

**Problema:**
- Alguien tiene que alojarlo
- Mantenerlo
- Actualizarlo
- Hacer copias de seguridad

**Costes ocultos:**
- VPS/servidor cloud: ~5-10€/mes
- Dominio: ~10€/año
- SSL: gratuito
- Backups: incluidos en VPS

**Realidad:** Open source ≠ gratis en producción

---

### Problema #4: Modelos IA Locales y Hardware

**Si quieren:**
- Chatbot
- IA adaptativa
- Análisis inteligente
- Respuestas automáticas

**Necesitan:**
- Modelos IA
- Inferencia
- Recursos hardware (RAM, GPU, CPU)

**Problema:** Modelos open source consumen muchos recursos. En local puede ir lento o ser inviable.

**Alternativa:** APIs externas (OpenAI, Claude, Gemini) → Ya no es gratuito

---

### Problema #5: WhatsApp - Problema Técnico + Legal

**Problema:** Meta no quiere automatización "no oficial"

**Riesgos:**
- Herramientas no oficiales pueden romperse
- Bloquear números
- Incumplir términos de servicio

**Solución estable:**
- API oficial de WhatsApp Business
- Cuesta dinero (~0.01-0.05€/mensaje)
- Requiere validación
- Requiere mantenimiento

---

### Problema #6: RGPD y Protección de Datos

**Datos que se manejan:**
- Nombres
- Teléfonos
- Exámenes
- Progreso
- Pagos
- Posiblemente datos de menores

**Implicaciones legales:**
- Consentimiento
- Almacenamiento inseguro
- Accesos sin control
- Datos en servicios externos

---

### Problema #7: Tiempo Real vs 90 Horas

**Problema:** La lista inicial parece un producto SaaS completo, no un proyecto corto de prácticas.

**Riesgo de intentar hacer todo:**
- Chatbot + IA + Facturación + Reservas + WhatsApp + Agenda + CRM + Mantenimiento + Teórica adaptativa

**Resultado probable:**
- Muchas demos incompletas
- Nada terminado del todo

---

## 3.2 Riesgos Clasificados

| ID | Categoría | Riesgo | Prob. | Impacto | Mitigación |
|----|-----------|--------|-------|---------|------------|
| R1 | Técnico | Falta de datos para IA | ALTA | ALTO | Usar reglas simples, no ML |
| R2 | Alcance | Scope creep | ALTA | ALTO | Definir scope rígido, no aceptar cambios |
| R3 | Económico | Coste WhatsApp API | MEDIA | ALTO | Priorizar email primero |
| R4 | Legal | RGPD | MEDIA | ALTO | Anonimizar, consentimientos, GDPR compliant |
| R5 | Operativo | Dependencia infraestructura empresa | MEDIA | ALTO | Documentar requisitos mínimos |
| R6 | Técnico | Integración con software actual | MEDIA | MEDIO | Diseñar sistema independiente |
| R7 | Técnico | Complejidad hosting | BAJA | MEDIO | Usar Docker + VPS básico |
| R8 | Operativo | Mantenimiento post-prácticas | ALTA | MEDIO | Documentar todo, código limpio |
| R9 | Técnico | Calidad automatizaciones | MEDIA | MEDIO | Validaciones, logs, pruebas |
| R10 | Legal | Datos de menores | MEDIA | ALTO | Consultar tutor legal |

---

# 4. PRIORIZACIÓN DEFINITIVA

## 4.1 Matriz de Priorización

| Prioridad | Funcionalidad | Viabilidad | Horas | Justificación |
|-----------|---------------|------------|-------|---------------|
| **ALTA** | Gestión de alumn@s | ✅ | 15h | Core del sistema, impacto inmediato |
| **ALTA** | Agenda y Reservas | ✅ | 20h | Problema operativo principal |
| **ALTA** | Seguimiento de progreso | ✅ | 15h | Base datos para futuro |
| **ALTA** | Dashboard | ✅ | 8h | Visibilidad, métricas clave |
| **ALTA** | Email automatizado | ✅ | 7h | Gratis, rápido, efectivo |
| **MEDIA** | WhatsApp (si budget) | ⚠️ | 10h | Solo si hay presupuesto API |
| **MEDIA** | IA predictiva (POC) | ⚠️ | 10h | Solo lógica de reglas, NO ML |
| **BAJA** | Mantenimiento vehículos | ⚠️ | - | Postponer a fase 2 |
| **BAJA** | Base de conocimiento | ❌ | - | Excluir del MVP |
| **BAJA** | Teórica adaptativa | ❌ | - | Excluir del MVP |
| **BAJA** | Comercial Virtual 24/7 | ❌ | - | Excluir del MVP |
| **BAJA** | Facturación | ❌ | - | Excluir del MVP |

## 4.2 Lo que SÍ incluimos (MVP)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                         MVP - 90 HORAS                                  ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ✅ GESTIÓN DE ALUMNOS (15h)                                          ║
║     • Alta/Edición/Baja de alumn@s                                    ║
║     • Estados: Teórica/Prácticas/Examen/Aprobado                      ║
║     • Asignación de profesor                                         ║
║     • Contacto: email, teléfono                                      ║
║                                                                       ║
║  ✅ AGENDA Y RESERVAS (20h)                                           ║
║     • Calendario visual                                               ║
║     • Reserva de clases prácticas                                     ║
║     • Asignar: alumn@, profesor, vehículo                             ║
║     • Evitar solapamientos                                            ║
║     • Ver disponibilidad de profesores                               ║
║                                                                       ║
║  ✅ SEGUIMIENTO DE PROGRESO (15h)                                     ║
║     • Número de prácticas realizadas                                  ║
║     • Observaciones del profesor                                      ║
║     • Nivel: Bajo / Medio / Preparado                               ║
║     • NO es IA real - lógica de reglas + estadísticas               ║
║                                                                       ║
║  ✅ AUTOMATIZACIÓN EMAIL (7h)                                        ║
║     • Recordatorios de clases                                         ║
║     • Confirmaciones de reserva                                       ║
║     • Notificaciones de exámenes                                      ║
║     • Plantillas configurables                                        ║
║                                                                       ║
║  ✅ DASHBOARD (8h)                                                    ║
║     • Alumnos activos                                                 ║
║     • Próximas clases                                                 ║
║     • Alumnos preparados para examen                                  ║
║     • Métricas simples                                                ║
║                                                                       ║
║  ✅ INFRAESTRUCTURA (25h)                                             ║
║     • Backend API (FastAPI)                                          ║
║     • Frontend (React)                                               ║
║     • Base de datos (PostgreSQL)                                     ║
║     • Autenticación (JWT)                                            ║
║     • Docker + Despliegue                                            ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## 4.3 Lo que NO incluimos (y por qué)

| Funcionalidad | Razón de exclusión |
|--------------|-------------------|
| **Comercial IA 24/7** | Requiere NLP avanzado, 80-120h mínimo |
| **IA predictiva real** | Sin datos históricos no funciona, solo lógica de reglas |
| **Teórica adaptativa** | Requiere banco de preguntas estructurado, 80-100h |
| **Facturación** | Complejidad legal, fiscal, integración contable |
| **WhatsApp API** | Coste por mensaje + validación Meta |
| **Mantenimiento vehículos** | No crítico, puede esperar fase 2 |

---

# 5. ARQUITECTURA TÉCNICA PROPUESTA

## 5.1 Stack Tecnológico (100% Open Source)

| Capa | Tecnología | Coste | Justificación |
|------|------------|-------|---------------|
| **Backend** | FastAPI | ✅ Gratis | APIs rápidas, excelente para IA, desarrollo ágil |
| **Frontend** | React / Next.js | ✅ Gratis | Gran ecosistema, componentes reutilizables |
| **Base de datos** | PostgreSQL | ✅ Gratis | Robusto, profesional, gratuito |
| **Automatización** | n8n | ✅ Gratis | Automatización visual, integración APIs, flujos operativos |
| **IA (POC)** | scikit-learn | ✅ Gratis | IA ligera, predicción simple, ideal para MVP |
| **Dashboard** | Metabase | ✅ Gratis | Dashboards rápidos, KPIs, informes |
| **Calendario** | FullCalendar | ✅ Gratis | Calendario visual para reservas |
| **Emails** | SMTP (Gmail/SendGrid) | ✅ Gratis hasta 100/día | Estándar, gratuito |
| **Despliegue** | Docker | ✅ Gratis | Entornos reproducibles, despliegue sencillo |
| **OCR (opcional)** | OCRmyPDF / Tesseract | ✅ Gratis | Extracción de texto de documentos |
| **Parsing docs** | Apache Tika / Unstructured | ✅ Gratis | Parsing de documentos |

**Coste mensual estimado: 5-10€** (solo VPS)

## 5.1.2 Herramientas a Evitar (Too Complex for 90h)

| Herramienta/Tecnología | Razón para evitarla |
|------------------------|---------------------|
| **Kubernetes** | Sobredimensionado para MVP |
| **Arquitecturas microservicios** | Complejidad innecesaria |
| **LangChain complejo** | Curva de aprendizaje alta |
| **Fine tuning** | Requiere datos y recursos |
| **Multiagentes** | Muy complejo para el tiempo |
| **RAG avanzado** | Requiere infraestructura |
| **Sistemas enterprise** | Sobredimensionados |
| **Frontends complejos** | Más tiempo de desarrollo |
| **Apps móviles** | Desarrollo dual (iOS/Android) |

> **Nota:** Estas herramientas son válidas para fases futuras o proyectos más grandes, pero no para un MVP de 90 horas.

## 5.2 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARQUITECTURA DEL MVP                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐       │
│   │   Alumno    │      │  Instructor │      │   Admin      │       │
│   │  (Frontend) │      │  (Frontend) │      │  (Panel)     │       │
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
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

# 6. COSTES Y DEPENDENCIAS

## 6.1 Costes Estimados (MVP)

| Concepto | Coste | Notas |
|----------|-------|-------|
| Dominio | 10-15€/año | Opcional para desarrollo |
| VPS (DigitalOcean/Hetzner) | 5-10€/mes | Básico, 1GB RAM basta |
| Email (SendGrid/Gmail) | **GRATIS** | Hasta 100 emails/día |
| WhatsApp API | **PAGO** | Solo si se aprueba (~50-100€/mes) |
| PostgreSQL | **GRATIS** | Open source |
| n8n | **GRATIS** | Self-hosted |
| FastAPI | **GRATIS** | Open source |
| React | **GRATIS** | Open source |

**Coste mensual REALISTA MVP: 5-10€**

## 6.2 Dependencias de Pago (Opcionales)

| Servicio | Coste aprox | Cuándo se necesita |
|----------|-------------|-------------------|
| WhatsApp Business API | 0.01-0.05€/mensaje | Si se aprueba integración |
| Twilio (alternativa) | Similar | Si WhatsApp no disponible |
| SendGrid Pro | 15€/mes si > 100 emails/día | Solo si alto volumen |
| OpenAI (para IA avanzada) | ~20-50€/mes | Solo si se quiere IA real |

---

# 7. PREGUNTAS PARA LA REUNIÓN

## 7.1 Preguntas Vitales (Contexto)

1. **Software actual:** ¿Qué software utilizan actualmente para gestión de alumn@s, reservas o facturación?

2. **Datos históricos:** ¿Tienen datos históricos de alumn@s (en papel, Excel, otro sistema)?

3. **Prioridad:** ¿Qué funcionalidad es más urgente para ustedes actualmente?

4. **Problema principal:** ¿Qué proceso les roba más tiempo o genera más problemas?

5. **Volumen:** ¿Cuántos alumn@s gestionan al mes aproximadamente?

## 7.2 Preguntas de Recursos

6. **Infraestructura:** ¿Qué acceso técnico pueden proporcionar durante las prácticas?

7. **Personal:** ¿Cuántos instructores y vehículos tienen?

8. **Usuario:** ¿Quién validará los avances y será la persona de contacto?

9. **Comunicación:** ¿Cómo prefieren comunicarse? (email, teléfono, presencial)

## 7.3 Preguntas de Expectativas

10. **Alcance:** ¿Prefieren un POC funcional entregable o un sistema más completo (aunque sea en fases)?

11. **Presupuesto:** ¿Tienen presupuesto para APIs externas como WhatsApp Business?

12. **Mínimo imprescindible:** ¿Qué parte del proyecto consideran absolutamente indispensable?

## 7.4 Preguntas Legales

13. **RGPD:** ¿Tienen política de protección de datos (RGPD)?

14. **Menores:** ¿Los alumn@s son menores de edad? (requiere consentimiento parental)

15. **Datos de examenes:** ¿Tienen registro de resultados de exámenes anteriores?

---

# 8. GUIÓN PARA LA REUNIÓN DE KICK OFF

## 8.1 Estructura (20-30 minutos)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                    REUNIÓN DE KICK OFF - 30 MIN                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  [0-3 min]     PRESENTACIÓN                                           ║
║                • Tu nombre y rol                                      ║
║                • Explicar naturaleza de prácticas (90h / 3 semanas)   ║
║                • Objetivo: crear un MVP funcional                    ║
║                                                                       ║
║  [3-10 min]    CONTEXTO DEL PROYECTO                                  ║
║                • Explicar las 10 funcionalidades propuestas           ║
║                • Mencionar limitaciones de tiempo                      ║
║                • Mostrar visión de transformación digital              ║
║                                                                       ║
║  [10-18 min]   PREGUNTAS CLAVE (escuchar activamente)                 ║
║                • Cuál es el problema más urgente?                     ║
║                • Qué software usan actualmente?                      ║
║                • Tienen datos históricos de alumn@s?                   ║
║                • Cuántos alumn@s gestionan al mes?                     ║
║                                                                       ║
║  [18-25 min]   PROPUESTA DE MVP                                       ║
║                • Explicar qué es un MVP (mínimo viable)               ║
║                • Presentar alcance propuesto (gestión + reservas)   ║
║                • Resaltar: email antes de WhatsApp (gratis)          ║
║                • Resaltar: NO es IA avanzada, es lógica básica       ║
║                • Explicar qué se deja para fases futuras              ║
║                                                                       ║
║  [25-30 min]   CIERRE Y PRÓXIMOS PASOS                               ║
║                • Resumir acuerdos                                     ║
║                • Confirmar prioridades                                ║
║                • Establecer canal de comunicación                    ║
║                • Definir siguiente reunión                            ║
║                • Agradecer por su tiempo                              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

## 8.2 Cómo Hablar de las Limitaciones

**❌ NO DIGAS:** "Solo tengo 90 horas, no puedo hacer mucho"

**✅ DIGA:** "He diseñado un MVP realista que asegura un sistema funcional y entregable. Las funcionalidades avanzadas pueden desarrollarse en fases futuras con más tiempo y presupuesto."

---

**Para IA predictiva:**
> "Para predecir si un alumn@ aprobará, precisamos datos históricos de alumn@s que ya han fatto el examen. Si no hay datos disponibles, puedo implementar un sistema de reglas básico que funcione desde el primer día y dejar la estructura lista para IA futura."

---

**Para WhatsApp:**
> "Recomiendo empezar con email automático porque es gratuito, no tiene restricciones y funciona inmediatamente. WhatsApp Business API tiene costes por mensaje (aproximadamente X euros al mes dependiendo del volumen) y requiere aprobación de Meta. Si el presupuesto lo permite, podemos incluirlo después."

---

## 8.3 Cómo Cerrar la Reunión

1. **Resumir acuerdos** - Repasar lo decidido verbalmente
2. **Confirmar prioridades** - Qué funcionalidad se hace primero
3. **Establecer comunicación** - Canal y frecuencia de reuniones
4. **Definir siguiente paso** - Fecha de próxima reunión
5. **Agradecer** - Por su tiempo y disposición

---

# 9. ROADMAP REALISTA

## Fase 1: Fundamentos (Semana 1) - ~30h

```
Semana 1 - Fundamentos
├── Día 1-2: Análisis y requisitos (8h)
│   ├── Reunión kick-off completa
│   ├── Confirmar alcance
│   └── Documentar decisiones
├── Día 3-4: Diseño BD y arquitectura (10h)
│   ├── Modelo de datos
│   ├── Estructura de API
│   └── Diseño de componentes
└── Día 5: Setup entorno (6h)
    ├── Repositorio Git
    ├── Docker
    ├── PostgreSQL
    └── FastAPI base
```

## Fase 2: Desarrollo Core (Semana 2) - ~30h

```
Semana 2 - Desarrollo Core
├── Backend API (15h)
│   ├── Endpoints alumn@s
│   ├── Endpoints reservas
│   ├── Endpoints progreso
│   └── Endpoints dashboard
├── Frontend (10h)
│   ├── Login y autenticación
│   ├── Navegación y layout
│   └── Componentes base
└── Integración básica (5h)
    └── Conectar frontend con API
```

## Fase 3: Funcionalidades y Cierre (Semana 3) - ~30h

```
Semana 3 - Completar
├── Agenda y reservas (10h)
│   ├── Calendario visual
│   ├── Gestión de horarios
│   └── Evitar solapamientos
├── Automatización (7h)
│   ├── Email SMTP
│   ├── Plantillas
│   └── Configuración
├── Dashboard (5h)
│   └── Métricas y visualizaciones
├── Testing y docs (5h)
│   ├── Pruebas funcionales
│   ├── README técnico
│   └── Manual de usuario
└── Entrega y ajustes (3h)
    ├── Demo final
    └── Ajustes menores
```

---

# 10. RESULTADO ESPERADO

## Al finalizar el MVP deberías poder enseñar:

| Entregable | Descripción | Estado |
|------------|-------------|--------|
| ✅ **Panel funcional** | Interfaz de administración operativa | |
| ✅ **Alumnos gestionados** | CRUD completo de alumn@s | |
| ✅ **Reservas funcionando** | Sistema de reservas con calendario | |
| ✅ **Seguimiento de progreso** | Registro y visualización | |
| ✅ **Recordatorios automáticos** | Emails funcionando | |
| ✅ **Dashboard básico** | Métricas clave visibles | |
| ✅ **Estructura ampliable** | Preparado para fases futuras | |

---

# 11. CONCLUSIONES

## Puntos Clave

1. **El proyecto es viable** - 90 horas son suficientes para un MVP funcional
2. **Scope realista** - Priorizar gestión de alumn@s, reservas y automatizaciones básicas
3. **Email > WhatsApp** - Gratuito, simple, sin dependencias de pago
4. **IA como POC** - Solo lógica de reglas, no ML complejo
5. **Stack open source** - FastAPI, React, PostgreSQL
6. **Coste mínimo** - Solo VPS (~5-10€/mes)

## Warning Final

⚠️ **NO intentar en 90 horas:**
- Comercial IA 24/7
- IA predictiva real (sin datos)
- Teórica adaptativa
- Facturación automatizada completa
- WhatsApp Business API

Estos requerirían varias veces las 90 horas disponibles.

---

# 12. ANEXO: Tabla de Riesgos Consolidada

| ID | Categoría | Riesgo | Prob. | Impacto | Mitigación |
|----|-----------|--------|-------|---------|------------|
| R1 | Técnico | Falta de datos para IA | ALTA | ALTO | Usar reglas, no ML |
| R2 | Alcance | Scope creep | ALTA | ALTO | Definir scope, no aceptar cambios |
| R3 | Económico | Coste WhatsApp API | MEDIA | ALTO | Priorizar email |
| R4 | Legal | RGPD | MEDIA | ALTO | Anonimizar, consentimientos |
| R5 | Operativo | Dependencia infraestructura | MEDIA | ALTO | Documentar requisitos |
| R6 | Técnico | Integración APIs | MEDIA | MEDIO | Fallbacks, sistema independiente |
| R7 | Alcance | Sobreestimación | MEDIA | ALTO | Buffer, priorizar |
| R8 | Operativo | Mantenimiento post-prácticas | ALTA | MEDIO | Documentar todo |

---

# ANEXO B: Necesidades de Registro de Datos

Para la implementación del sistema, se deberán gestionar las siguientes categorías de datos:

## B.1. Datos de Alumnos
- Información personal: nombre, apellidos, DNI, fecha de nacimiento, contacto
- Historial de clases (teóricas y prácticas)
- Resultados de exámenes (teóricos y prácticos)
- Progreso de aprendizaje (áreas de mejora identificadas por la IA)
- Preferencias de horario y disponibilidad

## B.2. Datos de Instructores
- Información personal: nombre, apellidos, DNI, contacto
- Disponibilidad y horarios
- Vehículos asignados
- Historial de clases impartidas

## B.3. Datos de Vehículos
- Marca, modelo, matrícula
- Fechas de ITV y próximas revisiones
- Historial de mantenimiento y reparaciones
- Disponibilidad

## B.4. Datos de Clases y Reservas
- Tipo de clase (teórica, práctica)
- Fecha, hora, duración
- Instructor asignado
- Alumno(s) participante(s)
- Estado de la reserva (confirmada, cancelada, completada)

## B.5. Datos de Exámenes
- Tipo de examen (teórico, práctico)
- Fecha, hora, lugar
- Resultados
- Notas y observaciones

## B.6. Datos de Facturación
- Servicios facturados (matrícula, clases, tasas)
- Importes
- Fechas de emisión y vencimiento
- Estado de pago

## B.7. Datos de Leads (Comercial Virtual)
- Nombre, contacto
- Interés (tipo de carnet, preguntas)
- Estado del lead (nuevo, contactado, matriculado)

## B.8. Base de Conocimiento
- Preguntas frecuentes
- Respuestas estandarizadas
- Categorías y etiquetas

---

# ANEXO C: Consideraciones Adicionales

| Consideración | Descripción |
|---------------|-------------|
| **Privacidad RGPD** | Asegurar cumplimiento de la normativa vigente en el tratamiento de datos personales |
| **Integración** | Evaluar compatibilidad con sistemas existentes (CRM, contabilidad, etc.) |
| **Escalabilidad** | Diseñar soluciones que puedan crecer con las necesidades de la autoescuela |
| **Seguridad** | Implementar medidas de seguridad robustas para proteger la información |

---

# ANEXO D: Resumen de Priorización (90h totales)

## Lo que SÍ incluimos (MVP)
- Gestión de alumn@s
- Agenda y reservas
- Seguimiento de progreso
- Dashboard
- Email automatizado
- Infraestructura completa

## Lo que NO incluimos (por limitación de tiempo)
- Comercial Virtual 24/7
- IA predictiva real (sin datos históricos)
- Teórica adaptativa
- Facturación completa
- WhatsApp API (costes)
- Mantenimiento vehículos (no crítico)

---

*Documento consolidado - Mayo 2026*
*Versión 2.1 (Actualizado con análisis completo)*
*Listo para revisión y reunión de Kick Off*