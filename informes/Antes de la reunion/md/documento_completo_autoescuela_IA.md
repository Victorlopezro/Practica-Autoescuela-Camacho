# Proyecto Autoescuela IA — Documento Técnico y Estratégico

## Contexto General

La empresa desea implementar múltiples funcionalidades relacionadas con:

- automatización,
- inteligencia artificial,
- gestión de alumnos,
- reservas,
- atención al cliente,
- digitalización operativa.

El proyecto tiene una limitación crítica:
- 90 horas de prácticas.

Por tanto, es necesario:
- priorizar,
- reducir alcance,
- y enfocarse en un MVP funcional y demostrable.

---

# Funcionalidades Iniciales Propuestas

- IA predictiva para determinar si un alumno está preparado para aprobar.
- Reservas y gestión de clases prácticas.
- Agenda inteligente.
- Comercial virtual vía WhatsApp.
- Automatización de mensajes.
- Automatización de facturas.
- Teórica adaptativa mediante IA.
- Recordatorio mantenimiento vehículos.
- Base de conocimiento para atención al cliente.
- Asistente virtual de recepción.

---

# Problema Principal del Proyecto

El alcance inicial corresponde más a una plataforma SaaS completa que a un proyecto realizable en 90 horas.

El principal riesgo es:
- intentar implementar demasiadas funcionalidades,
- terminar con muchas demos incompletas,
- y no entregar un sistema funcional real.

La prioridad debe ser:
- automatización operativa,
- organización,
- gestión de alumnos,
- y estructura escalable.

---

# MVP Realista Recomendado

## El MVP recomendado debería incluir:

1. Gestión básica de alumnos.
2. Agenda y reservas de clases.
3. Seguimiento de progreso.
4. Automatización básica de mensajes.
5. Dashboard operativo simple.

## Objetivo

Crear una base sólida y escalable para futuras funciones IA.

---

# Funcionalidades del MVP

## Gestión de alumnos

- Alta y edición.
- Estado alumno.
- Profesor asignado.
- Información básica.

## Agenda y reservas

- Calendario.
- Reserva de prácticas.
- Evitar solapamientos.
- Asignación profesor/vehículo.

## Seguimiento

- Número de prácticas.
- Observaciones.
- Nivel estimado.

## Automatización

- Emails automáticos.
- Recordatorios.
- Avisos.
- Posible integración WhatsApp.

## Dashboard

- Próximas clases.
- Alumnos activos.
- Métricas simples.

---

# Funcionalidades que NO deberían incluirse en el MVP

- Comercial IA 24/7 avanzado.
- IA predictiva compleja.
- CRM completo.
- Sistema teórico adaptativo completo.
- Facturación enterprise.
- Gestión avanzada mantenimiento.
- Multiagentes IA.
- RAG complejo.

---

# Riesgos Técnicos Detectados

## Falta de datos estructurados

- Excel desordenados.
- Datos incompletos.
- Sistemas antiguos.
- Falta de histórico.

## Integraciones

- Software sin API.
- Herramientas cerradas.
- Procesos manuales.

## Infraestructura

- Hosting.
- Backups.
- SSL.
- Servidor.

## IA local

- Recursos hardware insuficientes.
- RAM/GPU limitadas.

## Seguridad

- Autenticación.
- Datos personales.
- Permisos.
- RGPD.

## Dependencia terceros

- Meta.
- APIs externas.
- SMTP.
- Hosting.

## Mantenimiento futuro

- Actualizaciones.
- Errores.
- Dependencia técnica.

---

# Riesgos Económicos

Aunque el stack sea open source, existen costes potenciales:

- Hosting/VPS.
- Dominio.
- SSL.
- WhatsApp API.
- Proveedores externos.
- Servicios cloud.
- Posibles APIs IA.

---

# WhatsApp API — Riesgos y Realidad

No existe una solución completamente:
- gratuita,
- estable,
- legal,
- y escalable.

## Opciones

### API oficial Meta

- Recomendado para empresa.
- Tiene costes.
- Requiere validación.

### Herramientas no oficiales

- Riesgo de bloqueo.
- Inestabilidad.
- Problemas legales.

## Conclusión

WhatsApp debe tratarse como integración opcional o futura.

---

# Stack Tecnológico Open Source Recomendado

## Automatización

- n8n

## Backend

- FastAPI

## Frontend

- React
- Next.js

## Base de datos

- PostgreSQL

## IA básica

- scikit-learn

## Dashboard

- Metabase

## Calendario

- FullCalendar

## OCR

- OCRmyPDF
- Tesseract

## Parsing documentos

- Apache Tika
- Unstructured

## Contenedores

- Docker

---

# Herramientas IA y Vibe Coding

## Herramientas recomendadas

- OpenCode
- Cursor
- Claude
- GPT
- Gemini

## Uso recomendado

- scaffolding,
- CRUD,
- debugging,
- documentación,
- generación frontend,
- automatizaciones.

## Riesgo

Generar demasiado código sin arquitectura coherente.

---

# Herramientas Recomendadas en Detalle

## n8n

- Automatización visual.
- Integración APIs.
- Flujos operativos.

## FastAPI

- APIs rápidas.
- Excelente para IA.
- Desarrollo ágil.

## PostgreSQL

- Robusto.
- Profesional.
- Gratuito.

## scikit-learn

- IA ligera.
- Predicción simple.
- Ideal para MVP.

## Metabase

- Dashboards rápidos.
- KPIs.
- Informes.

## Docker

- Despliegue sencillo.
- Entornos reproducibles.

---

# Herramientas que se recomienda evitar

- Kubernetes.
- Arquitecturas microservicios.
- LangChain complejo.
- Fine tuning.
- Multiagentes.
- RAG avanzado.
- Sistemas enterprise sobredimensionados.
- Frontends complejos.
- Apps móviles.

---

# Guion Estratégico para la Reunión

1. Preguntar prioridades reales negocio.
2. Validar alcance.
3. Explicar limitación 90 horas.
4. Priorizar MVP.
5. Explicar riesgos IA.
6. Hablar costes WhatsApp.
7. Definir accesos y datos.
8. Definir responsables.
9. Acordar entregables.

---

# Preguntas Clave para la Empresa

- ¿Qué problema quieren resolver primero?
- ¿Qué funcionalidad es imprescindible?
- ¿Qué software usan actualmente?
- ¿Tienen datos históricos?
- ¿Usan WhatsApp Business?
- ¿Aceptan costes API?
- ¿Quién mantendrá el sistema?
- ¿Qué esperan exactamente al finalizar?

---

# Roadmap Recomendado

## FASE 1 — MVP

- Agenda.
- Reservas.
- Gestión alumnos.
- Automatización básica.
- Dashboard.

## FASE 2

- IA básica predictiva.
- WhatsApp.
- Recomendaciones inteligentes.

## FASE 3

- Comercial virtual.
- IA avanzada.
- Base conocimiento.
- Automatizaciones complejas.

---

# Conclusión Final

La propuesta más realista consiste en desarrollar una plataforma ligera de automatización y gestión operativa, utilizando herramientas open source y minimizando complejidad técnica.

El objetivo debe ser:
- entregar un MVP funcional,
- escalable,
- demostrable,
- y útil para la empresa.

La prioridad debe centrarse en:
- organización,
- automatización,
- y estructura preparada para futuras funciones IA.
