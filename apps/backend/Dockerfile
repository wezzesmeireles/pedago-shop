# Build context: raiz do monorepo
# Exemplo: docker build -f apps/backend/Dockerfile -t pedago-api .

# ── Stage 1: build ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@11.1.1

# Manifests do workspace primeiro (cache de camadas)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Fontes
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

WORKDIR /app/apps/backend
ENV PATH="/app/node_modules/.bin:/app/apps/backend/node_modules/.bin:$PATH"

RUN prisma generate
RUN nest build

# ── Stage 2: produção ───────────────────────────────────────────
FROM node:22-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app

RUN npm install -g pnpm@11.1.1

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Build compilado + schema Prisma
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY apps/backend/prisma ./apps/backend/prisma

EXPOSE 3000

WORKDIR /app/apps/backend
ENV PATH="/app/node_modules/.bin:/app/apps/backend/node_modules/.bin:$PATH"
RUN prisma generate
CMD ["sh", "-c", "prisma migrate deploy && node dist/main"]
