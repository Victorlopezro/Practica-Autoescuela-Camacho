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

### Pagos (Stripe)

- Integración con Stripe Checkout.
- Sesiones de pago para clases sueltas o paquetes.
- Webhook de confirmación.
- Reembolsos asociados a cancelaciones.

### Notificaciones

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

| Capa       | Tecnología                                               |
| ---------- | -------------------------------------------------------- |
| Backend    | NestJS 11, TypeScript 5, Prisma 7, PostgreSQL, Passport   |
| Frontend   | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, Axios   |
| Pagos      | Stripe Checkout + Webhooks                                |
| IA         | OpenAI-compatible AI para traducción de lenguaje natural  |
| Testing    | Jest (unit), Vitest (frontend), Storybook, Playwright     |
| Herramienta| pnpm 11, ESLint, Prettier                                 |

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
| `STRIPE_SECRET_KEY`    | Clave secreta de Stripe (sk_test_...)          |
| `STRIPE_WEBHOOK_SECRET`| Secreto del webhook de Stripe                  |
| `WHATSAPP_PHONE_ID`    | ID del teléfono de WhatsApp Business API       |
| `WHATSAPP_TOKEN`       | Token de acceso de WhatsApp                    |

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

## Despliegue

El proyecto está preparado para desplegarse en **Railway** (backend) y **Vercel** (frontend).

### Backend (Railway)

El `Procfile` en la raíz usa `pnpm start:prod`. Variables de entorno requeridas:

```
DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET,
CORS_ORIGIN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

### Frontend (Vercel)

```bash
cd frontend
pnpm build
```

Variables de entorno requeridas: `NEXT_PUBLIC_API_URL`.

---

## Licencia

UNLICENSED — uso interno de Autoescuela Camacho.
