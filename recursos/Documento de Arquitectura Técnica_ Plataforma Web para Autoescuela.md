# Documento de Arquitectura Técnica: Plataforma Web para Autoescuela

## 1. Introducción

Este documento detalla el análisis técnico y el diseño arquitectónico propuesto para una plataforma web responsive destinada a la gestión de clases prácticas en una autoescuela. El objetivo principal es establecer una base sólida y justificada para el desarrollo futuro del sistema, priorizando la simplicidad, robustez, mantenibilidad, bajo coste operativo y facilidad de ampliación.

## 2. Objetivo del Sistema

Diseñar una plataforma web responsive que permita la gestión eficiente de alumnos, profesores, vehículos, reservas, disponibilidad, automatizaciones ligeras basadas en IA y la integración con WhatsApp Business API para una autoescuela de tamaño pequeño/mediano con una única sede.

## 3. Contexto Empresarial

La autoescuela opera con 3-4 profesores y varias decenas de alumnos. El proyecto es de uso empresarial real, con infraestructura limitada, lo que subraya la necesidad de una solución simple, estable y de fácil mantenimiento.

## 4. Requisitos Funcionales Clave

### 4.1. Gestión de Usuarios y Autenticación

La plataforma gestionará tres roles principales: **Alumno**, **Profesor** y **Administrador**. El acceso al sistema se realizará mediante un sistema de login con usuario y contraseña, los cuales serán proporcionados por la administración, eliminando la necesidad de utilizar el correo electrónico para la autenticación.

### 4.2. Sistema de Reservas

El sistema permitirá la reserva de clases prácticas con una duración estándar de **1 hora**. Los usuarios podrán realizar reservas con una antelación máxima de **1 mes**. Durante el proceso de reserva, el sistema realizará una **validación simultánea** para asegurar la disponibilidad del profesor, el vehículo, la compatibilidad con el tipo de permiso del alumno y la franja horaria seleccionada.

### 4.3. Gestión de Vehículos

La plataforma gestionará diferentes **tipos de vehículos**, incluyendo moto de circulación, moto de pista, coche manual y coche automático. Cada vehículo tendrá un estado que indicará su disponibilidad, pudiendo estar **disponible**, **en mantenimiento** o **fuera de servicio**, lo que afectará su capacidad para ser reservado.

### 4.4. Gestión de Profesores

Los profesores podrán gestionar su **disponibilidad semanal de forma manual**, estableciendo los horarios en los que pueden impartir clases. Además, a cada profesor se le podrán **asignar múltiples vehículos**, lo que determinará qué tipos de clases puede ofrecer.

### 4.5. Restricciones de Reserva

El sistema aplicará restricciones estrictas para evitar la **doble reserva** de un mismo profesor o vehículo en la misma franja horaria. Los alumnos solo podrán visualizar la disponibilidad de clases que sea **compatible con su tipo de permiso** y los vehículos asociados a este.

### 4.6. Gestión de Clases Pagadas

Se implementará un **contador de clases disponibles** para cada alumno. Cada reserva exitosa **descontará una clase** de este contador. En caso de **cancelación** de una clase con más de 24 horas de antelación, la clase será **reembolsada** al alumno, incrementando su contador de clases disponibles.

### 4.7. Cancelaciones Administrativas

El sistema gestionará **cancelaciones administrativas** de forma automática. Si un horario se bloquea (por ejemplo, debido a mantenimiento de un vehículo), las clases afectadas se **cancelarán automáticamente**, se realizará un **reembolso automático** de la clase al alumno y se enviará una **notificación vía WhatsApp** a los afectados.

## 5. Requisitos No Funcionales Clave

Los requisitos no funcionales clave para la plataforma incluyen el uso de **PostgreSQL en Supabase** como base de datos, un backend **desplegado en Railway**, y un frontend **responsive y en español**. Las prioridades de diseño se centran en el uso de **tecnologías open source**, la **modularidad**, la **facilidad de mantenimiento**, una **arquitectura limpia**, una **escalabilidad razonable** y un **bajo coste operativo**.

## 6. Arquitectura Recomendada General

Se propone una arquitectura **monolítica modular** o **microservicios ligeros** para el backend, dada la prioridad de simplicidad y mantenibilidad para una autoescuela pequeña/mediana. La elección final dependerá de la granularidad deseada para los módulos y la capacidad del equipo de desarrollo. Sin embargo, para mantener la simplicidad inicial, un enfoque monolítico modular es preferible.

### 6.1. Capas de la Arquitectura

La arquitectura se estructurará en varias capas diferenciadas para una clara separación de responsabilidades. La **Capa de Presentación (Frontend)** será una aplicación web responsive, desarrollada con un framework moderno de JavaScript (como React, Vue o Angular), para ofrecer una experiencia de usuario dinámica y adaptable a diversos dispositivos. La **Capa de Lógica de Negocio (Backend)**, un servidor de aplicaciones, albergará la lógica central del negocio, gestionando usuarios, reservas, vehículos, profesores e integrando servicios externos. Se optará por un framework robusto y maduro para esta capa. La **Capa de Datos** se basará en PostgreSQL, gestionado por Supabase, para asegurar la persistencia, integridad y seguridad de la información. Finalmente, se incluirá una capa de **Servicios Externos** para la integración con la WhatsApp Business API y los módulos de IA ligeros.

### 6.2. Diagrama de Arquitectura (Conceptual)

Para una representación visual de la arquitectura del sistema, consulte el diagrama de arquitectura en la sección de anexos o el archivo `diagramas.png` adjunto.

![Diagrama de Arquitectura](https://private-us-east-1.manuscdn.com/sessionFile/nsAvvE9F4g8sZ0mvBewM8v/sandbox/KKHdBeNI7Nw9jXmi0PcEJC-images_1778607753562_na1fn_L2hvbWUvdWJ1bnR1L2RpYWdyYW1hcw.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvbnNBdnZFOUY0ZzhzWjBtdkJld004di9zYW5kYm94L0tLSGRCZU5JN053OWpYbWkwUGNFSkMtaW1hZ2VzXzE3Nzg2MDc3NTM1NjJfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnBZV2R5WVcxaGN3LnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ZSsX9gkMFTNTKVOMkf3lHTHrUuScTVLlzvS0diXbitpsSaTQVGguX~KYY9V7mYW5cdnlWLw~xsZBd36a5TXk6U5G6KPUFNMSRQrnbmlsFzAfa4mVzd~PPjueRRAlQRAuiKBRkAdpZXmiqTJOegtNThjgZvJceHGgzaXLd9qaPtSpGXRUVooJoUkNrrchVp2Lt7ICPPVBry0QllCo5cLJ5suVuFDT~WZVytgBCxKJxqt4e2mb7AUvKmexrXjW8HgGrF5UXsNqjfuFtbvdGX8ryEXYvsUkNSXbKonRPJ4pWsd7pfg9IBBn6hNWsxa0HheJOd5yJYEWV4EEwr-CcByzhA__)

## 7. Stack Tecnológico Recomendado (General)

Considerando los requisitos técnicos y las prioridades, se recomienda el siguiente stack tecnológico:

Para la **Base de Datos**, se optará por **PostgreSQL**, gestionado a través de **Supabase**, que ofrece una solución robusta y escalable. En cuanto al **Backend**, se consideran dos opciones principales: **Python con FastAPI** o **Node.js con Express/NestJS**. Ambas son excelentes, pero dada la prioridad de simplicidad y mantenimiento, se propone **Node.js con NestJS** por su arquitectura modular integrada y fuerte tipado con TypeScript, facilitando el mantenimiento a largo plazo. Como alternativa ligera, se considera Python con FastAPI por su simplicidad y velocidad. El **Frontend** se desarrollará con **React.js**, utilizando TypeScript y Tailwind CSS para un desarrollo rápido, mantenible y responsive, aprovechando el amplio ecosistema y comunidad de React. La **Infraestructura Backend** se desplegará en **Railway**, una plataforma PaaS que facilita despliegues rápidos y sencillos, ideal para proyectos de este tamaño. Finalmente, la **Infraestructura de Base de Datos** será **Supabase**, que proporciona PostgreSQL gestionado con características adicionales que aceleran el desarrollo.

## 8. Comparativa de Tecnologías Posibles

| Componente | Opción 1 (Recomendada) | Opción 2 (Alternativa) | Justificación de la Recomendación |
| :--- | :--- | :--- | :--- |
| **Backend** | Node.js + NestJS (TypeScript) | Python + FastAPI | NestJS impone una arquitectura modular y limpia desde el principio, ideal para mantener el código ordenado a medida que crece. FastAPI es excelente y más ligero, pero requiere más disciplina para mantener la estructura en proyectos medianos. |
| **Frontend** | React.js + Tailwind CSS | Vue.js + Tailwind CSS | React tiene un ecosistema más grande y es más fácil encontrar recursos/desarrolladores. Tailwind CSS permite un diseño rápido y consistente sin salir del HTML/JSX. |
| **Base de Datos** | PostgreSQL (Supabase) | MySQL (Railway) | Supabase ofrece PostgreSQL gestionado con herramientas adicionales útiles, y PostgreSQL es generalmente superior en características avanzadas y cumplimiento de estándares SQL. |
| **Despliegue** | Railway | Render / Heroku | Railway ofrece una experiencia de desarrollador superior, precios predecibles y despliegues muy rápidos desde GitHub. |

## 9. Diseño Modular del Sistema

El sistema se estructurará en módulos lógicos para garantizar una clara separación de responsabilidades y facilitar el mantenimiento. El **Módulo de Autenticación y Autorización (Auth)** se encargará de la gestión del login mediante usuario y contraseña, la generación y validación de tokens JWT, y el control de acceso basado en roles (RBAC) para Alumnos, Profesores y Administradores.

El **Módulo de Usuarios (Users)** gestionará los perfiles de alumnos, profesores y administradores, así como el saldo de clases disponibles para cada alumno. El **Módulo de Recursos (Resources)** se ocupará de la gestión de vehículos (alta, baja, mantenimiento, tipo), la disponibilidad semanal de los profesores y la asignación de vehículos a estos.

El **Módulo de Reservas (Bookings)** será el núcleo del sistema, conteniendo la lógica para la creación, modificación y cancelación de reservas, además de la validación de reglas de negocio como la disponibilidad, concurrencia y el saldo de clases. El **Módulo de Notificaciones (Notifications)** integrará la WhatsApp Business API para el envío de recordatorios, confirmaciones y avisos de cancelación.

Finalmente, el **Módulo de IA Ligera (AI)** integrará APIs de clima y festivos, y contendrá la lógica para la detección de festivos, la generación de sugerencias de reorganización y la creación de mensajes personalizados para WhatsApp.

---
*(Fin de la Fase 1)*
## 10. Modelo Entidad-Relación (Conceptual)

El diseño de la base de datos se centrará en la simplicidad y la eficiencia, utilizando PostgreSQL en Supabase. A continuación, se presenta un modelo entidad-relación conceptual con las entidades principales y sus relaciones. Para una representación visual detallada, consulte el diagrama ER en la sección de anexos o el archivo `diagramas.png` adjunto.

![Diagrama Entidad-Relación](https://private-us-east-1.manuscdn.com/sessionFile/nsAvvE9F4g8sZ0mvBewM8v/sandbox/KKHdBeNI7Nw9jXmi0PcEJC-images_1778607753562_na1fn_L2hvbWUvdWJ1bnR1L2RpYWdyYW1hcw.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvbnNBdnZFOUY0ZzhzWjBtdkJld004di9zYW5kYm94L0tLSGRCZU5JN053OWpYbWkwUGNFSkMtaW1hZ2VzXzE3Nzg2MDc3NTM1NjJfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnBZV2R5WVcxaGN3LnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ZSsX9gkMFTNTKVOMkf3lHTHrUuScTVLlzvS0diXbitpsSaTQVGguX~KYY9V7mYW5cdnlWLw~xsZBd36a5TXk6U5G6KPUFNMSRQrnbmlsFzAfa4mVzd~PPjueRRAlQRAuiKBRkAdpZXmiqTJOegtNThjgZvJceHGgzaXLd9qaPtSpGXRUVooJoUkNrrchVp2Lt7ICPPVBry0QllCo5cLJ5suVuFDT~WZVytgBCxKJxqt4e2mb7AUvKmexrXjW8HgGrF5UXsNqjfuFtbvdGX8ryEXYvsUkNSXbKonRPJ4pWsd7pfg9IBBn6hNWsxa0HheJOd5yJYEWV4EEwr-CcByzhA__)


## 11. Diseño de APIs

Se propone una API RESTful para la comunicación entre el frontend y el backend, utilizando JSON como formato de intercambio de datos. Los endpoints principales se estructurarán de la siguiente manera:

### 11.1. Autenticación

Para la autenticación, se dispondrá de dos endpoints principales: `POST /auth/login` para autenticar a un usuario y obtener un token JWT, y `POST /auth/refresh-token` para refrescar un token JWT expirado, asegurando la continuidad de la sesión.

### 11.2. Usuarios

Los endpoints de usuario permitirán `GET /users/{id}` para obtener los detalles de un usuario específico y `PUT /users/{id}` para actualizar dicha información. Adicionalmente, se podrá consultar `GET /students/{id}` para obtener los detalles de un alumno, incluyendo sus clases disponibles, y `GET /professors/{id}` para acceder a la información de un profesor y su disponibilidad.

### 11.3. Vehículos

La gestión de vehículos se realizará a través de `GET /vehicles` para listar todos los vehículos, y `GET /vehicles/{id}` para obtener los detalles de uno en particular. Los administradores tendrán permisos para `POST /vehicles` (crear un nuevo vehículo) y `PUT /vehicles/{id}` (actualizar los detalles de un vehículo existente).

### 11.4. Profesores

Para los profesores, se podrá utilizar `GET /professors` para listar todos los profesores y `PUT /professors/{id}/availability` para que un profesor actualice su disponibilidad semanal.

### 11.5. Reservas

El sistema de reservas ofrecerá `GET /bookings/available` para consultar las franjas horarias disponibles, con filtros por alumno, profesor, vehículo y tipo de permiso. Para crear una nueva reserva, se utilizará `POST /bookings`. Los detalles de una reserva específica se obtendrán con `GET /bookings/{id}`, y `PUT /bookings/{id}/cancel` permitirá cancelar una reserva, aplicando la lógica de reembolso correspondiente. Además, se podrá listar las reservas de un alumno con `GET /bookings/student/{student_id}` y las de un profesor con `GET /bookings/professor/{professor_id}`.

### 11.6. Notificaciones

El envío de mensajes de WhatsApp, utilizado internamente por el sistema de automatización, se realizará a través del endpoint `POST /notifications/send-whatsapp`.

### 11.7. IA Ligera

Para las funcionalidades de IA ligera, se dispondrá de `GET /weather/check-rain` para consultar el clima y detectar lluvia (uso interno). La gestión de festivos incluirá `GET /holidays` para listar los festivos, `POST /holidays` para añadir un nuevo festivo (exclusivo para administradores), y `PUT /holidays/{id}` para actualizar un festivo existente (también para administradores).

## 12. Flujo de Reservas

El flujo de reservas es crítico para el sistema y se diseñará para ser intuitivo y robusto. Para una representación visual detallada del proceso, consulte el diagrama de flujo de reservas en la sección de anexos o el archivo `diagramas.png` adjunto.

![Flujo de Reserva de Clases](https://private-us-east-1.manuscdn.com/sessionFile/nsAvvE9F4g8sZ0mvBewM8v/sandbox/KKHdBeNI7Nw9jXmi0PcEJC-images_1778607753562_na1fn_L2hvbWUvdWJ1bnR1L2RpYWdyYW1hcw.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvbnNBdnZFOUY0ZzhzWjBtdkJld004di9zYW5kYm94L0tLSGRCZU5JN053OWpYbWkwUGNFSkMtaW1hZ2VzXzE3Nzg2MDc3NTM1NjJfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyUnBZV2R5WVcxaGN3LnBuZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=ZSsX9gkMFTNTKVOMkf3lHTHrUuScTVLlzvS0diXbitpsSaTQVGguX~KYY9V7mYW5cdnlWLw~xsZBd36a5TXk6U5G6KPUFNMSRQrnbmlsFzAfa4mVzd~PPjueRRAlQRAuiKBRkAdpZXmiqTJOegtNThjgZvJceHGgzaXLd9qaPtSpGXRUVooJoUkNrrchVp2Lt7ICPPVBry0QllCo5cLJ5suVuFDT~WZVytgBCxKJxqt4e2mb7AUvKmexrXjW8HgGrF5UXsNqjfuFtbvdGX8ryEXYvsUkNSXbKonRPJ4pWsd7pfg9IBBn6hNWsxa0HheJOd5yJYEWV4EEwr-CcByzhA__)

El proceso se inicia con la solicitud de reserva por parte del alumno o administrador. El sistema consulta la disponibilidad de profesores, vehículos y verifica festivos. Una vez seleccionada la franja horaria, se realizan validaciones finales de disponibilidad y saldo de clases. Si la validación es exitosa, se crea la reserva, se descuenta la clase del alumno y se envía una notificación de confirmación vía WhatsApp. En caso de fallo en la validación, se informa al usuario con un mensaje de error.

## 13. Estrategia de Concurrencia

La concurrencia en el sistema de reservas es un punto crítico para evitar dobles reservas y garantizar la integridad de los datos. Se implementará una estrategia basada en **bloqueo optimista** o **transacciones de base de datos**. El bloqueo optimista utilizará un campo `version` o `updated_at` en las tablas `RESERVA`, `PROFESOR` y `VEHICULO` para verificar que el registro no haya cambiado desde su lectura. Las transacciones de base de datos encapsularán todas las operaciones de reserva para asegurar la atomicidad. Para manejar las condiciones de carrera, se confiará en las restricciones de unicidad de la base de datos y el manejo transaccional, evitando la necesidad de bloqueos a nivel de aplicación para este tamaño de proyecto.

## 14. Sistema de Permisos

El sistema de permisos se basará en **Roles (RBAC)** y se implementará en el backend. Cada usuario tendrá uno o más roles (`Alumno`, `Profesor`, `Administrador`), y cada rol tendrá permisos específicos para acceder a diferentes recursos y realizar acciones. Los administradores tendrán acceso completo, los profesores gestionarán su disponibilidad y verán sus reservas, y los alumnos podrán ver su perfil, clases disponibles, y reservar/cancelar sus propias clases. La verificación de permisos se realizará en cada endpoint de la API para asegurar la autorización.

---
*(Fin de la Fase 2)*
## 15. Arquitectura IA Ligera

La implementación de IA se centrará en módulos simples y ampliables, evitando arquitecturas complejas de agentes, y se integrará directamente en el backend. Los módulos propuestos son:

### 15.1. Módulo de Clima

Este módulo detectará condiciones climáticas adversas, específicamente lluvia, para sugerir cancelaciones de clases de moto. Se integrará con una API de clima externa (ej. OpenWeatherMap, AccuWeather) para obtener pronósticos. Si se detecta lluvia significativa, el sistema generará una sugerencia de cancelación que se notificará a administradores y profesores, pero la decisión final de cancelar recaerá en ellos, nunca se cancelará automáticamente.

### 15.2. Módulo de Festivos

Este módulo detectará festivos locales automáticamente y permitirá la edición manual. Se utilizará una API de festivos (ej. Calendarific, Abstract API) para obtener una lista de festivos, que se almacenará en la tabla `FESTIVO`. Los administradores podrán añadir, modificar o eliminar festivos manualmente a través de la interfaz de administración, anulando la detección automática para esas fechas específicas.

### 15.3. Módulo de Reorganización de Clases

Este módulo sugerirá horarios alternativos para clases canceladas o conflictivas. Analizará la disponibilidad de profesores y vehículos, así como las preferencias del alumno, para proponer nuevas franjas horarias. Tras una cancelación o un conflicto, el sistema buscará las mejores opciones de reubicación y las presentará al administrador o al alumno para su consideración, siempre con confirmación manual.

### 15.4. Módulo WhatsApp IA (Mensajería Personalizada)

Este módulo generará recordatorios personalizados, mensajes de cancelación y sugerencias a través de WhatsApp. Utilizará modelos de lenguaje ligero (LLMs) o plantillas inteligentes para generar mensajes dinámicos basados en el contexto de la reserva. Se activará por eventos del sistema y enviará mensajes concisos y claros a través de la integración con WhatsApp Business API.

## 16. Integración WhatsApp Business API

La integración con WhatsApp Business API es crucial para la comunicación con alumnos y profesores. Se utilizará un proveedor de soluciones empresariales (BSP) de WhatsApp (ej. Twilio, MessageBird, 360dialog) para gestionar la API. El backend se comunicará con el BSP a través de su API, utilizando plantillas de mensajes pre-aprobadas para mensajes transaccionales y webhooks para recibir notificaciones de entrega. Los casos de uso incluyen confirmaciones de reserva, recordatorios de clase, notificaciones de cancelación y sugerencias de reorganización.

## 17. Estrategia de Notificaciones

La estrategia de notificaciones se centrará principalmente en WhatsApp para eventos transaccionales y urgentes, complementada con notificaciones dentro de la aplicación web para avisos importantes o para usuarios que no utilicen WhatsApp. Los mensajes de WhatsApp tendrán prioridad para eventos críticos que requieran atención inmediata.

## 18. Gestión de Disponibilidad

La gestión de disponibilidad es un pilar fundamental del sistema. Cada profesor podrá definir su disponibilidad semanal con excepciones puntuales. Cada vehículo tendrá un estado (`disponible`, `en_mantenimiento`, `fuera_de_servicio`) y los administradores podrán programar mantenimientos. La lógica de cálculo de disponibilidad en el backend combinará la disponibilidad del profesor, del vehículo, las restricciones de concurrencia, los festivos y las condiciones climáticas.

## 19. Gestión de Vehículos

La gestión de vehículos permitirá a los administradores mantener un control exhaustivo de la flota de la autoescuela. Se implementará un CRUD completo para vehículos, permitiendo añadir, leer, actualizar y eliminar información de los mismos, incluyendo su estado. Los administradores también podrán asignar uno o varios vehículos a cada profesor, determinando qué vehículos pueden utilizar para impartir clases.

## 20. Riesgos Técnicos y Cuellos de Botella Posibles

### 20.1. Riesgos Técnicos

Los principales riesgos técnicos incluyen la complejidad de la lógica de disponibilidad, la integración y mantenimiento de la WhatsApp Business API, la gestión de concurrencia en el sistema de reservas y la seguridad de la autenticación y autorización. Una implementación deficiente en cualquiera de estas áreas podría llevar a errores o vulnerabilidades.

### 20.2. Cuellos de Botella Posibles

Los posibles cuellos de botella se encuentran en las consultas de disponibilidad si el número de usuarios crece significativamente, la dependencia de APIs externas para clima y festivos que podrían introducir latencia o fallos, y el volumen de mensajes de WhatsApp que podría saturar la integración o generar costes elevados.

## 21. Estrategia de Escalabilidad

La escalabilidad inicial se centrará en la **escalabilidad vertical** y una **escalabilidad horizontal** limitada. Railway facilitará la escalabilidad del backend, mientras que Supabase gestionará la escalabilidad de PostgreSQL. El frontend se desplegará a través de una CDN para una entrega rápida y escalable. Los servicios externos (clima, festivos, WhatsApp) ya están diseñados para escalar, requiriendo principalmente la gestión de límites de tasa y costes.

## 22. Seguridad Mínima Recomendable

La seguridad se abordará desde el diseño, incluyendo autenticación segura con hashing robusto y tokens JWT, autorización basada en roles (RBAC), validación y sanitización de todas las entradas de usuario, uso de HTTPS para toda la comunicación, protección contra ataques comunes (fuerza bruta, CSRF, clickjacking), copias de seguridad automáticas de la base de datos y registro de eventos de seguridad para auditoría.

---
*(Fin de la Fase 3)*
## 23. Estructura de Carpetas Sugerida

Para un proyecto basado en **Node.js con NestJS** en el backend y **React** en el frontend, se sugiere una estructura de carpetas que promueva la modularidad y el orden. La raíz del proyecto, `autoescuela-plataforma/`, contendrá dos directorios principales: `backend/` para la aplicación NestJS y `frontend/` para la aplicación React. El directorio `backend/` incluirá una carpeta `src/` con módulos dedicados a la autenticación (`auth/`), usuarios (`users/`), alumnos (`students/`), profesores (`professors/`), vehículos (`vehicles/`), reservas (`bookings/`), notificaciones (`notifications/`), y funcionalidades de IA (`ai/` para clima, festivos y reorganización). También contendrá directorios para elementos comunes (`common/`) y la configuración de la base de datos (`database/`), junto con los archivos de configuración de NestJS y TypeScript. Por su parte, el directorio `frontend/` (React + Vite) tendrá una carpeta `src/` con subdirectorios para las llamadas a la API (`api/`), componentes reutilizables (`components/`), páginas (`pages/` como Login, Dashboard, Reservas, Admin), hooks personalizados (`hooks/`), gestión del estado global (`store/`), y utilidades (`utils/`), además de los archivos de configuración de React y Tailwind CSS. Se incluirán también directorios para la documentación técnica y diagramas (`docs/`) y un archivo `docker-compose.yml` para facilitar el desarrollo local.

## 24. Roadmap de Implementación por Fases

Se propone un desarrollo incremental dividido en cuatro fases principales para minimizar riesgos y asegurar entregas de valor constantes:

| Fase | Título | Descripción | Hitos Clave |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Cimientos y Autenticación | Configuración de infraestructura, base de datos y sistema de login por roles. | Supabase configurado, login funcional, gestión básica de usuarios. |
| **Fase 2** | Gestión de Recursos y Disponibilidad | Implementación de módulos de vehículos, profesores y su disponibilidad. | CRUD de vehículos, gestión de horarios de profesores. |
| **Fase 3** | Núcleo de Reservas y Pagos | Desarrollo del motor de reservas, validaciones de concurrencia y saldo de clases. | Reservas funcionales, descuento de clases, reembolsos por cancelación. |
| **Fase 4** | Automatización IA e Integración WhatsApp | Implementación de módulos de clima, festivos, sugerencias de reorganización y notificaciones de WhatsApp. | Alertas de lluvia, festivos automáticos, mensajes de WhatsApp transaccionales. |

## 25. Conclusión y Recomendaciones Finales

La arquitectura propuesta para la plataforma de la autoescuela es sólida, modular y está diseñada para ser mantenida y escalada con facilidad. El uso de tecnologías modernas como NestJS, React, Supabase y Railway garantiza un alto rendimiento con un coste operativo contenido.

Se recomienda comenzar con la **Fase 1** y realizar pruebas de usuario constantes con profesores y administradores para asegurar que la interfaz y los flujos de trabajo se adaptan a sus necesidades reales. La integración con WhatsApp Business API debe tratarse con especial cuidado, asegurando la aprobación de las plantillas de mensajes antes de la fase de despliegue final.

---
**Documento generado por Manus AI**
Fecha: 12 de mayo de 2026
