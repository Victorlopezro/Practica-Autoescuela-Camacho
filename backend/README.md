# Autoescuela Camacho — Backend API

API RESTful para la gestión de autoescuela. Monolito modular con NestJS + CQRS + Prisma.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 |
| Patrón | CQRS (`@nestjs/cqrs`) |
| ORM | Prisma 7 + PostgreSQL 16 |
| Auth | JWT (access + refresh rotation) + Argon2 |
| Docs | Swagger `/api/docs` |
| Logs | Pino (JSON estructurado) |
| Contenedores | Docker + docker-compose |

## Módulos

| Módulo | Estado | Endpoints |
|--------|--------|-----------|
| Auth | ✅ | `POST /v1/auth/login`, `POST /v1/auth/refresh`, `POST /v1/auth/logout` |
| Users | ✅ | `GET/POST/PATCH/DELETE /v1/users` (admin-only) |
| Teachers | 🔜 | — |
| Students | 🔜 | — |
| Vehicles | 🔜 | — |
| Reservations | 🔜 | — |
| Payments | 🔜 | Stripe |
| Notifications | 🔜 | WhatsApp |
| Audit Log | 🔜 | — |

## Variables de Entorno

Copiar `.env.example` a `.env`:

```bash
cp .env.example .env
```

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://postgres:postgres@localhost:5432/autoescuela` |
| `JWT_ACCESS_SECRET` | Secreto access token (min 32 chars) | |
| `JWT_REFRESH_SECRET` | Secreto refresh token (min 32 chars) | |
| `JWT_ACCESS_EXPIRES` | TTL access token | `15m` |
| `JWT_REFRESH_EXPIRES` | TTL refresh token | `7d` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` |
| `WHATSAPP_PHONE_ID` | Meta WhatsApp phone ID | |
| `WHATSAPP_TOKEN` | Meta WhatsApp token | |
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno | `development` / `production` |
| `CORS_ORIGIN` | Orígenes CORS permitidos | `http://localhost:5173` |

## Requisitos

- Node.js 20+
- **pnpm** (instalar: `npm install -g pnpm` o via corepack)
- PostgreSQL 16
- Docker (opcional)

## Instalación

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm run seed
```

## Desarrollo

```bash
# Iniciar en modo watch
pnpm run start:dev

# Build
pnpm run build
```

## Tests

```bash
# Tests unitarios
pnpm test

# Coverage
pnpm run test:cov
```

22 tests — todos los handlers de Auth y Users, guards, y PrismaService.

## API Docs

Con el servidor corriendo, ir a:

```
http://localhost:3000/api/docs
```

## Docker

```bash
docker compose -f docker/docker-compose.yml up -d
```

## Arquitectura

```
src/
├── main.ts                    # Bootstrap: pipes, swagger, cors, helmet, pino
├── app.module.ts              # Módulo raíz
├── common/
│   ├── guards/                # JwtAuthGuard (global), RolesGuard
│   ├── decorators/            # @CurrentUser, @Roles, @Public
│   ├── filters/               # GlobalExceptionFilter
│   ├── interfaces/            # PaymentProvider, NotificationProvider
│   ├── dto/                   # PaginatedResponse, ApiError
│   ├── services/              # PrismaService + PrismaModule (global)
│   └── strategies/            # JwtStrategy (passport)
└── modules/
    ├── auth/                  # Login, refresh, logout con CQRS
    ├── users/                 # CRUD usuarios con CQRS
    ├── teachers/              # Pendiente
    ├── students/              # Pendiente
    ├── vehicles/              # Pendiente
    ├── reservations/          # Pendiente
    ├── payments/              # Pendiente
    ├── notifications/         # Pendiente
    └── audit-log/             # Pendiente
```

Cada módulo sigue el patrón:

```
Controller → CommandBus → CommandHandler → Service → Prisma
                              ↓
                           EventBus → EventHandlers
```

La comunicación entre módulos es SOLO vía EventBus (eventos de dominio).

## Seed

```bash
pnpm run seed
```

Crea un usuario admin por defecto:

- **Username**: `admin`
- **Password**: `admin123`

## Deploy (InsForge)

1. Install CLI: `npm install -g @insforge/cli`
2. Login: `npx @insforge/cli login`
3. Link: `npx @insforge/cli link`
4. Set env vars (DATABASE_URL, JWT secrets, etc.)
5. Deploy: `npx @insforge/cli deploy`
