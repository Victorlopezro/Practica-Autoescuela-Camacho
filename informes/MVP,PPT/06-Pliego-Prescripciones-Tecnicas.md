# PLIEGO DE PRESCRIPCIONES TÉCNICAS

## CONTRATO DE DESARROLLO DE SISTEMA DE GESTIÓN DIGITAL PARA AUTOESCUELA

---

**EXPEDIENTE:** PPT-AUTOESCUELA-2026-001  
**FECHA:** Mayo 2026  
**PROCEDIMIENTO:** Contratación directa - Prácticas curriculares  

---

# CAPÍTULO I - DISPOSICIONES GENERALES

## CLÁUSULA 1. - OBJETO DEL PLIEGO

El presente Pliego tiene por objeto definir las prescripciones técnicas que regirán la contratación del desarrollo, implementación y puesta en marcha de un sistema de gestión digital para una autoescuela, incluyendo módulos de gestión de alumn@s, reservas de clases prácticas, seguimiento de progreso y automatizaciones básicas.

## CLÁUSULA 2. - NATURALEZA DEL CONTRATO

El presente contrato se celebra al amparo de las siguientes características:
- **Tipo:** Contrato de servicios de desarrollo de software
- **Modalidad:** Prácticas curriculares (90 horas)
- **Alcance:** MVP (Producto Mínimo Viable)
- **Destino:** Gestión interna de autoescuela

## CLÁUSULA 3. - PARTES DEL CONTRATO

| Parte | Denominación |
|-------|--------------|
| **Contratante** | Autoescuela [NOMBRE] |
| **Contratista** | [Nombre del estudiante prácticas] |
| **Tutor académico** | [Nombre] - [Centro educativo] |
| **Tutor empresarial** | [Nombre] - [Cargo en la autoescuela] |

---

# CAPÍTULO II - OBJETO DEL CONTRATO

## CLÁUSULA 4. - DESCRIPCIÓN DEL OBJETO

### 4.1. Objeto general
Desarrollo de un sistema de gestión digital para la administración y seguimiento de las actividades de una autoescuela, incluyendo:

**Módulos incluidos en el alcance:**
a) Gestión de alumn@s (alta, edición, estados)
b) Sistema de reservas de clases prácticas
c) Seguimiento de progreso de alumn@s
d) Dashboard de métricas básicas
e) Automatización de emails (recordatorios, notificaciones)

**Módulos excluidos del alcance (para fases futuras):**
a) Comercial virtual / Chatbot 24/7
b) IA predictiva avanzada
c) Integración con WhatsApp Business API
d) Sistema de facturación automatizada
e) Teórica adaptativa con IA
f) Mantenimiento de vehículos
g) Base de conocimiento

### 4.2. Resultados esperados
El contratista deberá entregar:
1. Código fuente completo y documentado
2. Documentación técnica (arquitectura, API, base de datos)
3. Manual de usuario
4. Sistema desplegado y funcional
5. Datos de prueba (seed data)

---

# CAPÍTULO III - ÁMBITO Y ALCANCE

## CLÁUSULA 5. - ALCANCE DEL PROYECTO

### 5.1. Alcance técnico

| Componente | Descripción | Horas estimadas |
|------------|-------------|-----------------|
| Análisis y requisitos | Reuniones, documentación | 10h |
| Diseño BD y arquitectura | Modelo datos, estructura API | 8h |
| Backend (API REST) | Endpoints, lógica de negocio | 25h |
| Frontend | Interfaz de usuario | 20h |
| Agenda y reservas | Calendario, gestión horarios | 10h |
| Automatizaciones | Email SMTP, plantillas | 7h |
| Dashboard | Métricas y visualizaciones | 5h |
| Testing y documentación | Pruebas, manuales | 5h |
| **TOTAL** | | **90h** |

### 5.2. Volumen de usuarios estimados

| Tipo | Cantidad estimada |
|------|-------------------|
| Alumn@s | 30-50 activos |
| Instructores | 3-5 |
| Administradores | 1-2 |

### 5.3. Funcionalidades específicas requeridas

#### A) Gestión de alumn@s
- Registro de alumn@s (nombre, apellidos, DNI, teléfono, email)
- Estados: Teórica / Prácticas / Examen pendiente / Aprobado
- Asignación de instructor
- Histórico de clases

#### B) Reservas de clases prácticas
- Calendario visual semanal/mensual
- Reserva manual de clases
- Asignación: alumn@, instructor, vehículo
- Prevención de solapamientos de horarios
- Visualización de disponibilidad

#### C) Seguimiento de progreso
- Registro de número de prácticas realizadas
- Observaciones del instructor por clase
- Nivel estimado: Bajo / Medio / Preparado para examen
- Histórico de progreso por alumn@

#### D) Dashboard
- Número de alumn@s activos
- Clases programadas próximas
- Alumn@s preparados para examen
- Métricas simples de gestión

#### E) Automatización de mensajes
- Envío de recordatorios de clases (email)
- Confirmaciones de reserva (email)
- Notificaciones de exámenes (email)
- Plantillas configurables

---

# CAPÍTULO IV - REQUISITOS TÉCNICOS

## CLÁUSULA 6. - REQUISITOS DEL SOFTWARE

### 6.1. Requisitos de arquitectura

| Requisito | Especificación |
|-----------|----------------|
| **Arquitectura** | REST API + Cliente web |
| **Backend** | Framework moderno (FastAPI/Django) |
| **Frontend** | Framework moderno (React/Vue) |
| **Base de datos** | PostgreSQL o SQLite (para MVP) |
| **Despliegue** | Contenedores Docker |

### 6.2. Requisitos de tecnologías

El contratista deberá utilizar tecnologías **open source** y/o gratuitas siempre que sea posible:

| Capa | Tecnología recomendada |
|------|----------------------|
| Backend | FastAPI, Django, Flask |
| Frontend | React, Vue.js |
| Base de datos | PostgreSQL, SQLite |
| Automatización | Scripts Python, n8n |
| Autenticación | JWT |
| Despliegue | Docker |

### 6.3. Requisitos de código

- Código fuente versionado en Git
- Estructura limpia y documentada
- Comentarios en funciones complejas
- README con instrucciones de instalación y ejecución
- Variables de configuración (no hardcoded)

### 6.4. Requisitos de seguridad

- Autenticación mediante JWT
- Contraseñas hasheadas (bcrypt/argon2)
- Validación de inputs
- Protección contra inyección SQL
- Gestión de sesiones segura

## CLÁUSULA 7. - REQUISITOS DE INTEGRACIÓN

### 7.1. Integraciones requeridas

| Integración | Tipo | Prioridad |
|-------------|------|-----------|
| Email (SMTP) | Saliente | REQUERIDA |
| Base de datos | Local | REQUERIDA |

### 7.2. Integraciones opcionales (no incluidas en alcance)

- WhatsApp Business API (costes adicionales)
- Google Calendar
- Sistemas de facturación externos
- APIs de terceros

## CLÁUSULA 8. - REQUISITOS NO FUNCIONALES

### 8.1. Rendimiento
- Tiempo de respuesta de API < 500ms (operaciones simples)
- Interfaz responsiva (funcione en dispositivos modernos)

### 8.2. Usabilidad
- Interfaz intuitiva y fácil de usar
- Navegación clara
- Mensajes de error comprensibles

### 8.3. Mantenibilidad
- Código modular y estructurado
- Documentación técnica actualizada
- Instrucciones claras para despliegue

### 8.4. Disponibilidad
- Sistema funcional 24/7 (en producción)
- Diseño para alta disponibilidad (objetivo, no requisito estricto)

---

# CAPÍTULO V - CONDICIONES DE EJECUCIÓN

## CLÁUSULA 9. - PLAZO DE EJECUCIÓN

### 9.1. Duración total
**Duración máxima: 90 horas de trabajo**

### 9.2. Distribución orientativa

| Fase | Duración | Entregables |
|------|-----------|-------------|
| Fase 1: Análisis y diseño | Semana 1 | Documento de requisitos, diseño BD |
| Fase 2: Desarrollo core | Semana 2 | API, Frontend base, integraciones |
| Fase 3: Completado | Semana 3 | Funcionalidades completas, testing, docs |

### 9.3. Reuniones de seguimiento
- Frecuencia: Semanal
- Duración: 30-60 minutos
- Formato: Presencial o videoconferencia
- Contenido: Revisión de avances, ajustes de alcance

## CLÁUSULA 10. - LUGAR DE EJECUCIÓN

El trabajo se realizará:
- Presencial en las instalaciones de la autoescuela (preferible)
- Remoto según acuerdo entre partes
- Combinación de ambos según necesidades

## CLÁUSULA 11. - MEDIOS Y RECURSOS

### 11.1. Medios del contratista
El contratista aportará:
- Su propio equipo portátil
- Licencias de software necesarias (open source)
- Conexión a internet

### 11.2. Medios de la empresa
La empresa proporcionará:
- Acceso a datos e información necesaria
- Acceso a sistemas existentes (si aplica)
- Espacio de trabajo (si presencial)
- Cuenta de email para automatizaciones (SMTP)

---

# CAPÍTULO VI - CONDICIONES DE ENTREGA

## CLÁUSULA 12. - ENTREGABLES

### 12.1. Entregables principales

| # | Entregable | Formato | Descripción |
|---|------------|---------|-------------|
| 1 | Código fuente | Git / ZIP | Repositorio completo |
| 2 | Documentación técnica | PDF/MD | Arquitectura, API, modelo datos |
| 3 | Manual de usuario | PDF | Guía de uso del sistema |
| 4 | Sistema desplegado | URL/Servidor | Aplicación funcionando |
| 5 | Datos de prueba | JSON/CSV | Seed data para pruebas |

### 12.2. Criterios de aceptación

El sistema se considerará aceptado cuando cumple TODOS los siguientes requisitos:

| Requisito | Criterio |
|-----------|----------|
| Gestión alumn@s | Alta, edición, listado y eliminación funcionan |
| Reservas | Crear, modificar, cancelar reservas funciona |
| Seguimiento | Registro y visualización de progreso funciona |
| Dashboard | Métricas básicas se muestran correctamente |
| Email | Automatizaciones de email funcionan |
| Despliegue | Sistema accesible y funcional |
| Documentación | Manual de usuario completo |

---

# CAPÍTULO VII - GARANTÍA Y MANTENIMIENTO

## CLÁUSULA 13. - PERIODO DE GARANTÍA

### 13.1. Duración
**Período de garantía: 30 días naturales** desde la entrega final

### 13.2. Cobertura de la garantía
Durante el período de garantía, el contratista corregirá:
- Errores de funcionamiento graves
- Bugs que impidan el uso normal del sistema
- Problemas de despliegue

### 13.3. Exclusiones de garantía
No se incluyen:
- Cambios request por nuevas funcionalidades
- Problemas derivados de modificaciones del contratista
- Fallos por uso inadecuado
- Actualizaciones de dependencias

## CLÁUSULA 14. - MANTENIMIENTO POSTERIOR

### 14.1. Mantenimiento fuera de alcance
El presente contrato NO incluye mantenimiento posterior a la garantía.

### 14.2. Recomendación
Se recomienda a la empresa establecer un acuerdo de mantenimiento separado tras la garantía.

---

# CAPÍTULO VIII - PROPIEDAD INTELECTUAL

## CLÁUSULA 15. - PROPIEDAD DEL CÓDIGO

### 15.1. Propiedad
El código desarrollado será propiedad de la empresa contratante.

### 15.2. Uso educativo
El contratista podrá usar el código con fines educativos (portfolio, github), mencionando que fue desarrollado para la empresa.

### 15.3. Licencia sugerida
Se recomienda licencia MIT o similar para el código.

## CLÁUSULA 16. - PROPIEDAD DE DATOS

Los datos introducidos en el sistema durante su uso serán propiedad exclusiva de la empresa.

---

# CAPÍTULO IX - CONFIDENCIALIDAD

## CLÁUSULA 17. - OBLIGACIONES DE CONFIDENCIALIDAD

### 17.1. Información confidencial
El contratista se compromete a:
- No revelar información sensible de la empresa
- No compartir datos de alumn@s con terceros
- No publicar información del proyecto sin autorización
- Devolver o destruir información al finalizar el contrato

### 17.2. Duración
Las obligaciones de confidencialidad permanecerán vigentes durante 2 años tras la finalización del contrato.

---

# CAPÍTULO X - PROTECCIÓN DE DATOS (RGPD)

## CLÁUSULA 18. - CUMPLIMIENTO NORMATIVO

### 18.1. Responsable del tratamiento
La empresa será responsable del tratamiento de datos personales.

### 18.2. Obligaciones del contratista
El contratista se compromete a:
- Tratar los datos únicamente según instrucciones de la empresa
- No transferir datos a terceros
- Aplicar medidas técnicas y organizativas de seguridad
- Notificar breaches de seguridad inmediatamente
- Devolver o eliminar datos al finalizar el contrato

### 18.3. Datos a tratar
El sistema tratará los siguientes datos personales:
- Datos identificativos de alumn@s (nombre, DNI, contacto)
- Datos de progreso académico
- Datos de horarios y reservas

---

# CAPÍTULO XI - RESPONSABILIDADES

## CLÁUSULA 19. - RESPONSABILIDADES DEL CONTRATISTA

El contratista será responsable de:
- Ejecutar el trabajo según el alcance acordado
- Cumplir los plazos establecidos
- Entregar la documentación requerida
- Mantener informada a la empresa de incidencias
- Corrección de errores durante la garantía

## CLÁUSULA 20. - RESPONSABILIDADES DE LA EMPRESA

La empresa será responsable de:
- Proporcionar acceso a información necesaria
- Facilitar recursos acordados
- Validar entregables en plazos razonables
- Proporcionar feedback timely
- Respetar el alcance acordado

---

# CAPÍTULO XII - PENALIDADES

## CLÁUSULA 21. - PENALIDADES POR INCUMPLIMIENTO

### 21.1. Retraso en entrega
Si el contratista no entrega en fecha, se aplicarán las siguientes considérations:
- Comunicación inmediata a la empresa
- Justificación documentada del retraso
- Ajuste de plazos si es necesario

### 21.2. No entrega del sistema
Si por causas imputables al contratista no se entrega el sistema funcional, se evaluará la situación para determinar acciones correctivas.

---

# CAPÍTULO XIII - RESOLUCIÓN DEL CONTRATO

## CLÁUSULA 22. - CAUSAS DE RESOLUCIÓN

El contrato podrá resolverse por:
- Mutuo acuerdo de ambas partes
- Incumplimiento grave de obligaciones
- Imposibilidad de ejecución del objeto
- Finalización del período de prácticas

---

# CAPÍTULO XIV - DISPOSICIONES FINALES

## CLÁUSULA 23. - DOCUMENTOS DEL CONTRATO

Forman parte del contrato:
1. El presente Pliego de Prescripciones Técnicas
2. Los anexos que se adjunten
3. Las modificaciones acordadas durante la ejecución

## CLÁUSULA 24. - LEGISLACIÓN APLICABLE

Este contrato se regirá por la legislación española aplicable a contratos de servicios y prácticas curriculares.

---

# ANEXO I: PRESUPUESTO ESTIMADO

| Concepto | Estimación |
|----------|-------------|
| Desarrollo (90h) | Prácticas curriculares - sin coste |
| Hosting/VPS (mensual) | ~5-10€/mes |
| Dominio (anual) | ~10€/año |
| Email (SMTP) | Gratuito (hasta 100/día) |
| WhatsApp API | No incluido (coste opcional) |

**Nota:** Este proyecto se desarrolla en el marco de prácticas curriculares, por lo que no conlleva coste directo para la empresa más allá de los gastos de hosting opcionales.

---

# ANEXO II: TECNOLOGÍAS PROPUESTAS

| Capa | Tecnología | Alternativas |
|------|------------|--------------|
| Backend | FastAPI | Django, Flask |
| Frontend | React | Vue.js |
| Base de datos | PostgreSQL | SQLite (MVP) |
| Automatización | Python scripts | n8n |
| Despliegue | Docker | Manual |

---

# ANEXO III: PLAN DE TRABAJO

| Semana | Foco | Entregable |
|--------|------|-------------|
| 1 | Análisis y diseño | Requisitos, diseño BD |
| 2 | Desarrollo | API, Frontend |
| 3 | Completado | Funcionalidades, docs |

---

**FIRMAS**

| | |
|---|---|
| **Por la empresa:** | **Por el contratista:** |
| | |
| Firma: _____________________ | Firma: _____________________ |
| Nombre: _____________________ | Nombre: _____________________ |
| Fecha: _____________________ | Fecha: _____________________ |
| | |
| **Tutor empresarial:** | **Tutor académico:** |
| | |
| Firma: _____________________ | Firma: _____________________ |
| Nombre: _____________________ | Nombre: _____________________ |

---

*Documento elaborado en Mayo 2026*
*Pliego de Prescripciones Técnicas - Proyecto Autoescuela Digital*