FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── Install deps ────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ── Build ───────────────────────────────────────────────────
FROM deps AS build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
RUN pnpm --filter web build

# ── Serve with nginx ─────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
