## Prompt Revisado: Desarrollo de Backend Open Source para Autoescuela

Este documento detalla los requisitos para el desarrollo del backend de una aplicación web destinada a una autoescuela. El objetivo principal es construir una arquitectura backend profesional, escalable y mantenible, utilizando exclusivamente tecnologías de código abierto, y preparada para futuras integraciones de inteligencia artificial (IA).

### Consideraciones Importantes

Es crucial adherirse a las siguientes directrices durante el desarrollo:

*   El despliegue se realizará en **Infisical/Infraforge (InsForge)**, una plataforma de backend como servicio de código abierto optimizada para desarrolladores de IA [1] [2].
*   Se priorizará la construcción de un backend robusto, modular y mantenible. Las funcionalidades de IA complejas se abordarán en una fase posterior, asegurando que la arquitectura actual esté preparada para su integración.
*   Todas las herramientas y dependencias utilizadas deben ser de **código abierto**.
*   **Modificaciones en el Frontend:** Si bien el enfoque principal es el backend, se permite realizar cambios necesarios en el frontend existente (añadir, modificar o eliminar funcionalidades) siempre y cuando no se rompa la funcionalidad actual ni la experiencia de usuario establecida.

### Stack Tecnológico Recomendado (Open Source)

Para garantizar una base sólida y alineada con los principios de código abierto, se utilizará el siguiente stack tecnológico:

*   **Lenguaje de Programación:** Node.js con TypeScript.
*   **Framework Backend:** **NestJS** es el framework preferido debido a su arquitectura modular, escalabilidad y excelente soporte para TypeScript. Como alternativa, se podría considerar Express.js, siempre y cuando se implemente con una estructura profesional y bien definida para asegurar la mantenibilidad y escalabilidad.
*   **Base de Datos:** **PostgreSQL**, una base de datos relacional de código abierto, robusta y altamente confiable.
*   **ORM (Object-Relational Mapper):** **Prisma ORM**, que ofrece una capa de abstracción moderna y segura para interactuar con la base de datos, con un enfoque en la seguridad de tipos y la facilidad de uso [3].
*   **Autenticación:** Implementación de **JWT (JSON Web Tokens)** para la autenticación de usuarios, incluyendo el uso de refresh tokens para mejorar la seguridad y la experiencia del usuario. Se utilizarán guards de roles y permisos por endpoint para controlar el acceso a los recursos.
*   **Hashing de Contraseñas:** Se empleará **Argon2** o **bcrypt** para el hashing seguro de contraseñas, garantizando que nunca se almacenen en texto plano.
*   **Arquitectura:** Se seguirá una arquitectura modular que facilite la separación de responsabilidades y la escalabilidad del sistema.
*   **Contenedorización:** Configuración completa de **Docker** para el entorno de desarrollo y producción, asegurando la portabilidad y consistencia del despliegue.
*   **Gestión de Variables de Entorno:** **Infisical**, una plataforma de gestión de secretos de código abierto, para centralizar y proteger las variables de entorno y secretos de la aplicación [4].
*   **Documentación API:** **Swagger/OpenAPI** para generar automáticamente la documentación de la API. Es fundamental utilizar decoradores como `@ApiProperty` y `@ApiOperation` para enriquecer la documentación, haciéndola legible tanto para desarrolladores como para futuras integraciones de IA.
*   **Roles y Permisos:** Un sistema granular de roles y permisos que permita definir con precisión las acciones que cada tipo de usuario puede realizar.
*   **Sistema de Notificaciones:** Se integrará **Novu**, una infraestructura de notificaciones de código abierto, para gestionar y enviar alertas y comunicaciones a los usuarios (ej. notificaciones de ITV, recordatorios de clases) [5].
*   **Logging:** Se implementará un sistema de logging robusto utilizando **Winston** o **Pino** para registrar eventos importantes, errores y actividades del sistema, facilitando la depuración y monitorización.

### Objetivo del Proyecto

Desarrollar una aplicación web para una autoescuela con las siguientes funcionalidades principales:

*   **Alumnos:** Reservar clases, consultar su historial y progreso.
*   **Profesores:** Gestionar su disponibilidad y visualizar sus clases y estadísticas.
*   **Administración:** Controlar usuarios, vehículos, clases y configuraciones generales.
*   **Futuro:** Preparación para la integración de IA para predicción y automatización.

### Requisitos Funcionales Detallados

#### Autenticación y Autorización

Se definirán tres roles principales:

*   **ADMIN:** Acceso total al sistema, con capacidad para modificar manualmente cualquier dato.
*   **PROFESOR:** Gestión de disponibilidad, visualización de clases y estadísticas.
*   **ALUMNO:** Acceso a la reserva de clases, historial y progreso. Los alumnos no se registran por sí mismos; sus cuentas son creadas por la administración y se les proporciona un usuario/contraseña. El login no se realizará con email.

La implementación incluirá:

*   Autenticación basada en JWT con refresh tokens.
*   Guards de roles para proteger rutas específicas.
*   Permisos detallados por endpoint para un control de acceso granular.

#### Gestión de Alumnos

Cada alumno tendrá las siguientes propiedades y funcionalidades:

*   **Profesor Asignado:** Un profesor fijo asignado.
*   **Tipo de Permiso/Vehículo:** El tipo de licencia o vehículo para el que está tomando clases.
*   **Clases Pagadas Disponibles:** Un campo `remainingClasses` que indica el número de clases que el alumno tiene disponibles. Este campo debe ser modificable manualmente por la administración.
*   **Historial de Clases:** Registro de todas las clases tomadas.
*   **Progreso:** Seguimiento del avance del alumno.

Para la gestión de `remainingClasses`, se requiere un sistema de auditoría que registre:

*   `userId` del administrador que realizó la modificación.
*   `action` (ej. 'increment', 'decrement').
*   `entityId` (ID del alumno afectado).
*   `oldValue` y `newValue` del saldo de clases.
*   `timestamp` de la modificación.
*   `reason` (motivo opcional de la modificación).

#### Reservas y Calendario

*   **Duración de Clases:** Las clases estándar duran 45 minutos. El sistema debe soportar duraciones configurables y la posibilidad de reservar sesiones dobles (90 minutos) automáticamente para profesores que lo requieran.
*   **Bloqueo de Slots:** El sistema debe bloquear automáticamente los slots de tiempo ocupados para evitar reservas duplicadas.
*   **Cancelación de Clases:** Las clases solo pueden cancelarse antes de las 18:00 del día anterior a la clase. Se implementará una lógica backend robusta para:
    *   Impedir cancelaciones fuera de este plazo.
    *   Validar y manejar correctamente las zonas horarias (se recomienda almacenar todas las fechas y horas en **UTC** y realizar las conversiones necesarias en el backend).
    *   Devolver errores claros al usuario en caso de cancelación fallida.
    *   Definir qué sucede con los créditos de las clases canceladas dentro del plazo (ej. si se devuelven automáticamente al saldo del alumno).

#### Gestión de Profesores

Cada alumno tendrá siempre el mismo profesor asignado. Los profesores podrán:

*   Configurar su disponibilidad de manera dinámica, incluyendo horarios variables, excepciones, vacaciones y bloqueos de tiempo específicos. El sistema debe ser flexible y no tener la disponibilidad hardcodeada.

#### Tipos de Vehículos

El sistema debe diferenciar entre tipos de vehículos, ya que esto afecta la disponibilidad, los profesores asignados y los vehículos específicos:

*   **Moto:** Pista, Circulación.
*   **Coche:** Manual, Automático.

#### Gestión de Vehículos

Los profesores tendrán acceso a un panel de vehículos. Cada vehículo tendrá los siguientes atributos:

*   Matrícula, Tipo, Estado, Fecha de ITV, Disponibilidad, Observaciones.

Los profesores podrán:

*   Actualizar el estado del vehículo.
*   Marcar incidencias.
*   Modificar la fecha de ITV.

Se implementará un sistema de notificaciones (a través de Novu) para la ITV:

*   Alerta cuando la ITV esté próxima (ej. 30 días antes, configurable).
*   El backend debe estar preparado para futuras notificaciones.

#### Estadísticas del Profesor

Cada profesor podrá visualizar estadísticas relevantes, incluyendo:

*   Número de clases impartidas por vehículo, con desglose por tipo de vehículo.
*   Filtrado mensual de las estadísticas.

Se requerirán endpoints agregados y consultas optimizadas para garantizar la eficiencia en la recuperación de estas estadísticas.

#### Panel de Administración

El panel de administración tendrá control total sobre el sistema, incluyendo:

*   Creación de alumnos y asignación de profesores.
*   Modificación manual de clases restantes de alumnos.
*   Gestión completa de vehículos.
*   Gestión de disponibilidad de profesores y bloqueo de fechas.
*   Modificación y cancelación de reservas.
*   Creación de horarios especiales.

### Fase Futura IA (Preparación de Arquitectura)

Aunque la lógica de IA no se implementará en esta fase, la arquitectura debe estar preparada para futuras integraciones, tales como:

*   Agentes de IA para optimización de horarios.
*   Predicción de aprobados.
*   Cancelación automática de clases por condiciones climáticas (ej. lluvia).
*   Gestión inteligente de festivos.
*   Reorganización inteligente de clases.

Para ello, se enfatizará una arquitectura con módulos desacoplados y, si es posible, un enfoque **event-driven** (utilizando patrones como **CQRS** o librerías como **EventEmitter2**) para facilitar la integración de servicios de IA como consumidores de eventos del sistema.

### Arquitectura Técnica a Generar

Se espera la generación de los siguientes componentes técnicos:

1.  **Arquitectura Backend Completa:** Diseño de la estructura general del backend.
2.  **Estructura de Carpetas Profesional:** Organización lógica y escalable del código fuente.
3.  **Modelado de Base de Datos:** Diseño detallado del esquema de la base de datos.
4.  **Prisma Schema:** Definición del esquema de la base de datos utilizando Prisma.
5.  **Relaciones entre Entidades:** Definición clara de las relaciones entre todas las entidades (ej. `Student` y `Teacher` con `User` para autenticación).
6.  **Endpoints REST:** Implementación de todos los endpoints necesarios para las funcionalidades descritas.
7.  **Guards y Middlewares:** Implementación de lógica de seguridad y procesamiento de solicitudes.
8.  **DTOs (Data Transfer Objects):** Definición de DTOs para la entrada y salida de datos, con validaciones robustas utilizando `class-validator` y `pipes` globales.
9.  **Validaciones:** Implementación de validaciones a nivel de aplicación para asegurar la integridad de los datos.
10. **Sistema de Auditoría:** Implementación del sistema de registro de cambios para `remainingClasses` y otras operaciones críticas.
11. **Sistema de Notificaciones Preparado:** Integración inicial con Novu y definición de los flujos de notificación.
12. **Configuración Docker:** Archivos Dockerfile y Docker Compose para el entorno de desarrollo y producción.
13. **Configuración para Despliegue en InsForge:** Archivos de configuración y scripts necesarios para el despliegue en InsForge, siguiendo el flujo canónico (`npx @insforge/cli signup`, `link`, `deploy`).
14. **Variables de Entorno:** Gestión de variables de entorno a través de Infisical.
15. **Seeds Iniciales:** Scripts para poblar la base de datos con datos iniciales de prueba.
16. **Roles y Permisos:** Implementación del sistema de roles y permisos.
17. **Sistema Modular Limpio:** Asegurar que el código esté organizado en módulos bien definidos y desacoplados.

### Entidades Principales

Las entidades principales a modelar son:

*   `User`
*   `Student`
*   `Teacher`
*   `Vehicle`
*   `Reservation`
*   `Availability`
*   `VehicleIncident`
*   `Notification`
*   `ClassBalanceHistory`
*   `VehicleITV`
*   `AuditLog`

### Importante: Qué NO Generar y Qué SÍ

**NO generar:**

*   Código frontend o pantallas de interfaz de usuario.
*   Lógica de IA funcional en esta fase.
*   Lógica 'fake' o mocks innecesarios.

**SÍ generar:**

*   Un backend real y funcional.
*   Una arquitectura sólida y escalable.
*   Código mantenible y de alta calidad.
*   Un sistema preparado para producción y crecimiento futuro.

### Orden de Implementación Sugerido

Se recomienda seguir el siguiente orden de implementación:

1.  Creación de la estructura base del backend.
2.  Modelado completo de la base de datos y generación del Prisma schema.
3.  Desarrollo de los módulos NestJS para las entidades base.
4.  Implementación del sistema de autenticación.
5.  Desarrollo del sistema de reservas.
6.  Continuar con los módulos restantes de forma iterativa.

### Referencias

[1] InsForge. (n.d.). *The backend platform for AI-native developers*. Recuperado de [https://insforge.dev/](https://insforge.dev/)
[2] InsForge. (n.d.). *InsForge/InsForge: The all-in-one, open-source backend platform for agentic coding*. GitHub. Recuperado de [https://github.com/InsForge/InsForge](https://github.com/InsForge/InsForge)
[3] Prisma. (n.d.). *The Next-Generation ORM for Node.js & TypeScript*. Recuperado de [https://www.prisma.io/](https://www.prisma.io/)
[4] Infisical. (n.d.). *Open-source secret management platform*. Recuperado de [https://infisical.com/](https://infisical.com/)
[5] Novu. (n.d.). *The open-source notification infrastructure*. Recuperado de [https://novu.co/](https://novu.co/)
