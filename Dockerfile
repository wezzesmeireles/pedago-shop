FROM node:20-alpine AS base
RUN npm install -g pnpm@10

# ── Install all deps ─────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ── Build shared ─────────────────────────────────────────────
FROM deps AS build
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Build API
RUN pnpm --filter api build

# Build Web
RUN pnpm --filter web build

# ── Final: API + serve web via nginx ─────────────────────────
FROM node:20-alpine AS runner
RUN npm install -g pnpm@10
RUN apk add --no-cache nginx

WORKDIR /app

# Copy pnpm workspace files for prod install
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile --prod

# Copy build outputs
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/api/prisma ./apps/api/prisma
COPY packages/shared ./packages/shared

# nginx config
RUN cat > /etc/nginx/http.d/default.conf << 'NGINXEOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    gzip on;
    client_max_body_size 50M;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

# Startup script
RUN cat > /start.sh << 'STARTEOF'
#!/bin/sh
set -e
cd /app/apps/api
npx prisma migrate deploy
node dist/main.js &
nginx -g "daemon off;"
STARTEOF
RUN chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
