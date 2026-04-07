# ── Stage 1: Install dependencies ──────────────────────────
FROM node:20-alpine AS deps
RUN npm install -g pnpm@10
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build everything ───────────────────────────────
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web
RUN pnpm --filter api build
RUN pnpm --filter web build

# ── Stage 3: Production image ───────────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@10 && apk add --no-cache nginx

WORKDIR /app

# Install all deps (including prisma CLI for migrations)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy built files
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/api/prisma ./apps/api/prisma
COPY packages/shared/src ./packages/shared/src

# Copy config files
COPY nginx.prod.conf /etc/nginx/http.d/default.conf
COPY start.sh /start.sh

EXPOSE 80
CMD ["/start.sh"]
