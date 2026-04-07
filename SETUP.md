# Pedago Shop — Guia de Instalação

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker & Docker Compose

## 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

## 2. Subir banco de dados e Redis

```bash
docker compose up -d
```

## 3. Instalar dependências

```bash
pnpm install
```

## 4. Gerar Prisma Client e rodar migrations

```bash
pnpm db:migrate
# Quando pedir o nome da migration: init
```

## 5. Popular dados iniciais (seed)

```bash
pnpm db:seed
```

Isso cria:
- **Admin:** `admin@pedago.shop` / `Admin@123`
- Categorias padrão
- Config inicial do site

## 6. Rodar em desenvolvimento

```bash
pnpm dev
```

- API: http://localhost:3000
- Frontend: http://localhost:5173
- Prisma Studio: `pnpm db:studio`

---

## Variáveis obrigatórias para funcionar

| Variável | Onde obter |
|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | [console.cloud.google.com](https://console.cloud.google.com) |
| `R2_*` | [dash.cloudflare.com](https://dash.cloudflare.com) — R2 Object Storage |
| `SMTP_*` | Gmail App Password ou [resend.com](https://resend.com) |

## Configurar Webhook do Mercado Pago

1. No painel MP Developers → Webhooks → Adicionar
2. URL: `https://SEU_DOMINIO/webhooks/mercadopago`
3. Copie o **segredo** para `MERCADO_PAGO_WEBHOOK_SECRET` no `.env`

Para desenvolvimento local use [ngrok](https://ngrok.com):
```bash
ngrok http 3000
```

## Estrutura do projeto

```
pedago-shop/
├── apps/
│   ├── api/          # NestJS — porta 3000
│   └── web/          # Vue 3 — porta 5173
└── packages/
    └── shared/       # Tipos TypeScript compartilhados
```
