FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src/ ./src/

RUN pnpm run build

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY prisma/ ./prisma/
RUN pnpm prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
