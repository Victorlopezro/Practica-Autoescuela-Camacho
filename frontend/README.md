# Autoescuela Camacho — Frontend

Frontend de la aplicación de gestión de autoescuela, construido con Next.js.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 |
| UI Icons | Lucide React |
| CSS | Tailwind CSS v4 |
| Testing | Vitest + Playwright |
| Stories | Storybook |

## Requisitos

- Node.js 20+
- **pnpm** (instalar: `npm install -g pnpm` o via corepack)

## Getting Started

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tests

```bash
# Tests unitarios con Vitest
pnpm test

# Tests con Storybook
pnpm storybook
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Inicia servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Inicia servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm storybook` | Storybook dev server |
| `pnpm build-storybook` | Build de Storybook |
