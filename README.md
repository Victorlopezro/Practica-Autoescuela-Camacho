# Autoescuela Camacho

Sistema de gestión integral para autoescuelas. Backend en **NestJS + PostgreSQL** con frontend en **Next.js 16 + React 19 + Tailwind CSS 4**.

---

## Funcionalidades

### Gestión de usuarios y roles
Tres roles con portales independientes:

- **Admin** — gestión completa: usuarios, profesores, alumnos, vehículos, reglas, reservas y pagos.
- **Teacher** — visualización de horarios, disponibilidad y gestión de clases.
- **Student** — reserva de clases, consulta de saldo y progreso.

### Profesores y disponibilidad

- CRUD completo de profesores.
- Horarios semanales por profesor con soporte de **doble sesión** (pista + circulación simultánea).
- Overrides por fecha para días excepcionales (puentes, bajas).
- Asignación de vehículos a profesores.

### Alumnos

- Registro con tipo de carnet y subtipo (pista / circulación).
- **Sistema de saldo de clases**: recargas, descuentos, ajustes manuales, historial de transacciones.
- Visibilidad de progreso.

### Vehículos

- Inventario con tipos: moto-pista, moto-circulación, coche-manual, coche-automático.
- Estados: disponible, en uso, mantenimiento, dado de baja.
- Registro de incidencias.
- Control de ITV (fechas de caducidad).

### Reservas

- Flujo completo: **crear → confirmar → completar → cancelar**.
- Cancelación con reembolso (prorrateado o total).
- Cancelación administrativa por parte de admin.
- Validación de cruce de horarios con disponibilidad del profesor.
- Historial completo por alumno.

### Motor de reglas de planificación (Scheduling Rules)

- **Reglas de evaluación**: condiciones lógicas en lenguaje natural que la IA traduce a reglas estructuradas (disponibilidad, solapamiento, duración, vehículo).
- **Reglas de generación**: el admin describe el horario deseado en lenguaje natural, la IA genera automáticamente los bloques de disponibilidad de los profesores.
- Prioridades, filtros por tipo de profesor/licencia/vehículo.
- Sistema de **primera aplicación**: en la primera ejecución, se limpian los datos legacy; en ejecuciones posteriores, se respetan los ajustes manuales.
- Detección automática de doble sesión desde lenguaje natural.

> 📖 **Guía de reglas**: en [`guia-reglas/README.md`](guia-reglas/README.md) tenés una guía completa con los campos disponibles, operadores, acciones, prioridades, ejemplos que funcionan bien, y cosas que la IA no entiende bien. Es el documento de referencia para saber qué se le puede pedir a la IA al crear reglas desde el panel de administración.

### Pagos (Stripe) ⏳ Pendiente

> **Importante**: La integración con Stripe está planificada pero **aún no implementada**. El backend tiene los endpoints y modelos listos; el frontend usa datos mock.

- Integración con Stripe Checkout.
- Sesiones de pago para clases sueltas o paquetes.
- Webhook de confirmación.
- Reembolsos asociados a cancelaciones.

### Notificaciones (WhatsApp) ⏳ Pendiente

> **Importante**: El sistema de notificaciones por WhatsApp está planificado pero **aún no implementado**. Existe el modelo de datos y un servicio mock; la integración real con WhatsApp Business API queda pendiente.

- Canal **WhatsApp** para recordatorios y cambios de estado.
- Plantillas configurables.
- Historial de envíos.

### Seguridad

- Autenticación JWT con refresh tokens rotativos.
- Protección de rutas por rol (Admin, Teacher, Student).
- Filtro global de excepciones con logging estructurado.
- Auditoría de acciones críticas (log de cambios con valores anteriores y razones).

---

## Stack técnico

| Capa        | Tecnología                                                |
| ----------- | --------------------------------------------------------- |
| Backend     | NestJS 11, TypeScript 5, Prisma 7, Passport JWT           |
| Base de datos | **Supabase** (PostgreSQL gestionado)                    |
| Frontend    | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Axios    |
| Hosting     | **InsForge** (backend compute + frontend deployments)     |
| IA          | **InsForge AI** (OpenRouter / OpenAI-compatible)          |
| Pagos (⏳)  | Stripe Checkout + Webhooks (pendiente de implementar)     |
| Testing     | Jest (unit), Vitest (frontend), Storybook, Playwright     |
| Herramienta | pnpm 11, ESLint, Prettier                                 |

---

## Arquitectura

```
frontend/           → Next.js 16 (App Router)
backend/            → NestJS + Prisma + PostgreSQL
  ├── prisma/       → Schema + migraciones + seed
  ├── src/
  │   ├── common/   → Guards, decorators, filtros, servicios compartidos
  │   ├── modules/  → Módulos por dominio (auth, users, teachers, students,
  │   │               vehicles, reservations, scheduling, payments, notifications)
  │   └── main.ts   → Entry point
  └── test/         → E2E tests
docs/               → Documentación de arquitectura y agentes
```

Cada módulo sigue **CQRS** con comandos y handlers separados.

---

## Instalación y desarrollo local

### Requisitos previos

- **Node.js** >= 20
- **pnpm** >= 11 (`npm install -g pnpm@11`)
- **PostgreSQL** >= 15 (local o Docker)
- **Git**

### 1. Clonar el repositorio

```bash
git clone https://github.com/Victorlopezro/Practica-Autoescuela-Camacho.git
cd Practica-Autoescuela-Camacho
```

### 2. Backend

```bash
cd backend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores de tu base de datos local

# Crear la base de datos (PostgreSQL)
psql -U postgres -c "CREATE DATABASE autoescuela;"

# Ejecutar migraciones y seed
pnpm prisma migrate dev
pnpm prisma db seed

# Iniciar servidor de desarrollo
pnpm start:dev
```

El backend arranca en `http://localhost:3000`.

#### Variables de entorno clave (backend/.env)

| Variable               | Descripción                                    |
| ---------------------- | ---------------------------------------------- |
| `DATABASE_URL`         | Conexión a PostgreSQL                          |
| `JWT_ACCESS_SECRET`    | Secreto para tokens de acceso                  |
| `JWT_REFRESH_SECRET`   | Secreto para refresh tokens                    |
| `STRIPE_SECRET_KEY`    | Clave secreta de Stripe (sk_test_...) — ⏳ pendiente de implementar |
| `STRIPE_WEBHOOK_SECRET`| Secreto del webhook de Stripe — ⏳ pendiente de implementar         |
| `WHATSAPP_PHONE_ID`    | ID del teléfono de WhatsApp Business API — ⏳ pendiente de implementar |
| `WHATSAPP_TOKEN`       | Token de acceso de WhatsApp — ⏳ pendiente de implementar           |

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si es necesario

# Iniciar servidor de desarrollo
pnpm dev
```

El frontend arranca en `http://localhost:3001`.

#### Variables de entorno clave (frontend/.env.local)

| Variable                      | Descripción                                       |
| ----------------------------- | ------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`         | URL del backend (ej. `http://localhost:3000`)      |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Clave publicable de Stripe (pk_test_...)         |
| `NEXT_PUBLIC_USE_MOCKS`       | `true` para usar datos mock sin backend conectado |

### 4. Ejecutar tests

```bash
# Backend unit tests
cd backend && pnpm test

# Backend e2e tests
cd backend && pnpm test:e2e

# Frontend (con Vitest)
cd frontend && pnpm vitest

# Storybook (desarrollo de componentes)
cd frontend && pnpm storybook
```

---

## Despliegue (InsForge)

El proyecto está alojado en **InsForge**, que gestiona tanto el backend como el frontend.

### Requisitos previos

- Tener una cuenta en [InsForge](https://insforge.app)
- Tener el proyecto enlazado (`.insforge/project.json`)
- `flyctl` instalado en PATH (solo para despliegue del backend)

### Backend (Compute Service)

El backend es una app NestJS empaquetada en Docker. Se despliega como **compute service** de InsForge:

```bash
cd backend

# Desplegar usando el Dockerfile existente
npx @insforge/cli compute deploy . --name autoescuela-api --port 8080
```

El servicio se despliega en Fly.io a través de InsForge. El `Dockerfile` ya está configurado para construir y ejecutar la app en el puerto 8080.

### Frontend (Deployments)

El frontend Next.js se despliega a través de InsForge (Vercel bajo el capó):

```bash
cd frontend

# 1. Asegurarse de que el build local funciona
pnpm build

# 2. Configurar variables de entorno persistentes
npx @insforge/cli deployments env set NEXT_PUBLIC_API_URL https://autoescuela-api-xxxxxxxx.fly.dev

# 3. Desplegar
npx @insforge/cli deployments deploy .
```

> **Importante**: el build local debe pasar antes de desplegar para ahorrar recursos del servidor.

### Variables de entorno en producción

**Backend (compute):** se pasan con `--env` al desplegar o se gestionan con `npx @insforge/cli compute update <id> --env-set KEY=VALUE`:

```
DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN
```

**Frontend (deployment):** se configuran con `npx @insforge/cli deployments env set`:

```
NEXT_PUBLIC_API_URL
```

> Las variables `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `WHATSAPP_PHONE_ID` y `WHATSAPP_TOKEN` están definidas en el esquema pero **aún no son funcionales** — se añadirán cuando se implementen esos módulos.

---

## Licencia

UNLICENSED — uso interno de Autoescuela Camacho.
