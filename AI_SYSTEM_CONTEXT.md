# AI System Context

Este arquivo serve como contexto de alto nível para outras IAs entenderem rapidamente o sistema `pedago-shop` sem precisar reler todo o código antes de operar.

## 1. Resumo do Sistema

`pedago-shop` é uma plataforma de e-commerce de produtos pedagógicos digitais.

Funcionalidades principais:
- catálogo público de atividades pedagógicas
- autenticação de clientes e administradores
- checkout com Mercado Pago via PIX e cartão
- entrega digital por PDF ou link externo
- painel administrativo para produtos, categorias, pedidos, usuários, integrações e customização visual
- armazenamento de arquivos no Supabase Storage
- notificações de vendas via Telegram

## 2. Stack Técnica

### Frontend
- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Tailwind CSS

### Backend / Infra
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions
- Mercado Pago
- Telegram Bot API

### Monorepo
- `pnpm` workspace
- app principal em `apps/web`
- código compartilhado em `packages/shared`

## 3. Estrutura do Repositório

### Raiz
- `package.json`: scripts globais
- `pnpm-workspace.yaml`: workspace do monorepo
- `supabase-schema.sql`: schema inicial do banco
- `AI_SYSTEM_CONTEXT.md`: este documento

### Frontend
- `apps/web/src/main.ts`: bootstrap do app Vue
- `apps/web/src/App.vue`: carrega o `RouterView` e inicializa `siteConfig`
- `apps/web/src/router/index.ts`: rotas públicas, auth, cliente e admin
- `apps/web/src/lib/supabase.ts`: client Supabase do frontend
- `apps/web/src/services/api.ts`: helper para `functions.invoke`

### Stores
- `apps/web/src/stores/auth.store.ts`
- `apps/web/src/stores/cart.store.ts`
- `apps/web/src/stores/catalog.store.ts`
- `apps/web/src/stores/site-config.store.ts`

### Layouts
- `PublicLayout.vue`
- `AuthLayout.vue`
- `CustomerLayout.vue`
- `AdminLayout.vue`

### Views principais
- Públicas: `HomeView`, `CatalogView`, `ProductView`, `CheckoutView`
- Auth: `LoginView`, `RegisterView`, `ForgotPasswordView`, `ResetPasswordView`, `AdminLoginView`
- Cliente: `OrdersView`, `DownloadsView`
- Admin: `DashboardView`, `ProductsView`, `CategoriesView`, `OrdersView`, `UsersView`, `CustomizeView`, `IntegrationsView`, `ChangelogView`

### Shared package
- `packages/shared/src/enums/*`
- `packages/shared/src/types/site-config.types.ts`

### Edge Functions
- `supabase/functions/create-order`
- `supabase/functions/mp-webhook`
- `supabase/functions/reconcile-orders`
- `supabase/functions/download`
- `supabase/functions/register-user`
- `supabase/functions/create-admin`
- `supabase/functions/admin-users`

## 4. Modelo Mental da Arquitetura

O sistema usa o Supabase como backend principal.

O frontend:
- consulta tabelas diretamente com RLS
- usa Supabase Auth para login/sessão
- usa Supabase Storage para upload e leitura pública quando permitido
- usa Realtime para reagir a mudanças de status de pedido
- chama Edge Functions apenas quando precisa de privilégios de serviço ou integrações externas

As Edge Functions fazem:
- criação de pedidos com Mercado Pago
- confirmação assíncrona de pagamentos
- reconciliação manual/automática de pedidos
- criação de usuários/admins com `service_role`
- listagem administrativa de usuários a partir de `auth.users`
- entrega segura de arquivos

## 5. Fluxos Principais

### 5.1 Navegação pública
- visitante acessa home, catálogo e página de produto
- produtos ativos são buscados da tabela `products`
- categorias ativas vêm de `categories`
- customização visual vem de `site_config`

### 5.2 Carrinho
- controlado por `cart.store.ts`
- fica apenas em memória no frontend
- não persiste em banco

### 5.3 Cadastro e login

#### Cliente
- cadastro usa a Edge Function `register-user`
- depois do cadastro o frontend faz login automático via Supabase Auth
- login normal usa `supabase.auth.signInWithPassword`
- login Google usa OAuth do Supabase
- se o usuário não tiver telefone, vai para `PhoneRequiredView`

#### Admin
- login admin usa a mesma base de Auth
- autorização admin depende da role `ADMIN`
- primeiro admin pode ser criado pela Edge Function `create-admin`

### 5.4 Checkout

Arquivo central:
- `apps/web/src/views/public/CheckoutView.vue`

Fluxo:
1. usuário autenticado entra no checkout
2. frontend envia itens e método de pagamento para `create-order`
3. a função cria `orders` e `order_items`
4. se for PIX, gera cobrança imediata
5. se for cartão, gera preferência do Checkout Pro
6. frontend aguarda confirmação via polling + realtime

### 5.5 Confirmação de pagamento

Canais usados:
- webhook Mercado Pago em `mp-webhook`
- fallback manual/forçado em `reconcile-orders`

Quando um pedido é aprovado:
- `orders.status` muda para `PAID`
- `orders.mp_payment_id` e metadados são atualizados
- tokens de download são criados
- `products.sales_count` é incrementado
- Telegram recebe notificação

### 5.6 Downloads

Arquivos centrais:
- `customer/DownloadsView.vue`
- `public/CheckoutSuccessView.vue`
- `supabase/functions/download/index.ts`

Fluxo:
1. cliente vê tokens de download ligados aos pedidos pagos
2. frontend abre `/functions/v1/download?token=...`
3. a função valida token e expiração
4. gera signed URL do bucket privado `product-files`
5. faz streaming do arquivo PDF
6. incrementa `download_count`

Observação:
- alguns produtos são entregues por `delivery_link` em vez de PDF

## 6. Entidades do Domínio

### `profiles`
Representa perfil do usuário autenticado.

Campos usados no sistema:
- `id`
- `name`
- `phone`
- `avatar_url`
- `role`
- `is_active`

### `categories`
Categorias visíveis no catálogo e no admin.

Campos usados:
- `id`
- `name`
- `slug`
- `description`
- `image_url`
- `sort_order`
- `is_active`

### `products`
Produto digital vendido pela loja.

Campos usados no código:
- `id`
- `name`
- `slug`
- `description`
- `rich_content`
- `price`
- `compare_price`
- `cover_image_url`
- `preview_images`
- `category_id`
- `file_key`
- `file_size`
- `page_count`
- `tags`
- `is_active`
- `is_featured`
- `sort_order`
- `sales_count`
- `youtube_url`
- `instagram_url`
- `delivery_type`
- `delivery_link`
- `deleted_at`

### `orders`
Pedido do cliente.

Campos usados:
- `id`
- `order_number`
- `user_id`
- `status`
- `total_amount`
- `payment_method`
- `mp_preference_id`
- `mp_payment_id`
- `mp_status`
- `paid_at`
- `expires_at`
- `customer_email`
- `customer_name`
- `metadata`

### `order_items`
Itens vinculados ao pedido.

Campos usados:
- `id`
- `order_id`
- `product_id`
- `product_name`
- `unit_price`
- `quantity`

### `download_tokens`
Token de acesso para download ou entrega.

Campos usados:
- `id`
- `token`
- `order_id`
- `order_item_id`
- `download_count`
- `max_downloads`
- `expires_at`
- `last_download_at`
- `revoked_at`
- `delivery_link`

### `site_config`
Configuração global da loja.

Usado para:
- branding
- banners
- redes sociais
- SEO
- integrações
- textos institucionais

### `webhook_events`
Tabela de idempotência/observabilidade de webhooks.

## 7. Stores do Frontend

### `auth.store.ts`
Responsável por:
- inicializar sessão
- buscar usuário atual
- login/logout
- cadastro
- derivar `isLoggedIn` e `isAdmin`

Fonte da role:
- `profiles.role`
- fallback para `auth.users.app_metadata.role`

### `cart.store.ts`
Responsável por:
- itens do carrinho
- subtotal
- quantidade total
- abertura/fechamento do drawer

### `catalog.store.ts`
Responsável por:
- categorias públicas
- produtos em destaque

### `site-config.store.ts`
Responsável por:
- buscar `site_config`
- atualizar `site_config`
- aplicar tema CSS em runtime

## 8. Controle de Acesso

O sistema usa RLS no Supabase.

Regras gerais:
- leitura pública de categorias ativas
- leitura pública de produtos ativos e não deletados
- usuário lê seus próprios pedidos e downloads
- admin tem acesso amplo via policy `is_admin()`
- uploads e leituras privadas dependem de policies de storage

Rotas protegidas no frontend:
- `requiresAuth`
- `requiresAdmin`

## 9. Integrações Externas

### Mercado Pago
Usado para:
- PIX
- cartão de crédito
- webhook de confirmação
- reconciliação de pagamentos

Configuração vinda de `site_config`:
- `mercadoPagoAccessToken`
- `mercadoPagoWebhookSecret`
- `mercadoPagoPixKey`

Fallback por ambiente:
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_WEBHOOK_SECRET`

### Telegram
Usado para avisos de:
- novo pedido criado
- venda aprovada
- cancelamento
- reembolso

Configuração em `site_config`:
- `telegramBotToken`
- `telegramRecipients`

Compatibilidade legada:
- `telegramChatId`

## 10. Buckets de Storage

Buckets definidos no schema:
- `product-covers`: público
- `product-previews`: público
- `product-files`: privado

Uso:
- capas e previews podem ser expostos publicamente
- PDFs finais ficam em bucket privado

## 11. Convenções Importantes do Código

### Queries frontend
- o frontend consulta Supabase diretamente
- mapeia muitos campos `snake_case` para `camelCase` localmente

### Soft delete parcial
- `products.deleted_at` é usado no frontend e nas queries
- parte do sistema filtra por `deleted_at is null`

### Delivery híbrido
Produtos podem ser:
- `pdf`: entregue via token + bucket privado
- `link`: entregue por `delivery_link`

### Realtime
Usado principalmente para:
- detectar mudança de status do pedido em checkout/success

### Changelog interno
- existe uma view administrativa com histórico de evolução
- útil para entender decisões recentes do sistema

## 12. Desalinhamentos Importantes

Outras IAs devem saber que o arquivo `supabase-schema.sql` não representa totalmente o estado atual esperado pelo app.

O código usa colunas que não aparecem explicitamente nesse schema:
- `products.delivery_type`
- `products.delivery_link`
- `download_tokens.delivery_link`

Portanto:
- antes de alterar migrations ou schema, confirmar o estado real do banco
- não assumir que o SQL da raiz é a fonte única da verdade

## 13. Pontos Sensíveis

### 1. Checkout e pagamento
Arquivos delicados:
- `CheckoutView.vue`
- `CheckoutSuccessView.vue`
- `create-order`
- `mp-webhook`
- `reconcile-orders`

Qualquer mudança aqui pode quebrar:
- geração de cobranças
- aprovação de pedido
- entrega do download
- idempotência

### 2. Roles e autorização
Arquivos delicados:
- `auth.store.ts`
- `router/index.ts`
- RLS
- `create-admin`

### 3. Entrega de arquivos
Arquivos delicados:
- `download/index.ts`
- `ProductsView.vue`
- policies do Storage

### 4. Integrações
Arquivos delicados:
- `IntegrationsView.vue`
- `create-order`
- `mp-webhook`
- `reconcile-orders`

## 14. Como Ler o Sistema Rápido

Se outra IA precisar aprender rápido, a ordem recomendada é:

1. `apps/web/src/router/index.ts`
2. `apps/web/src/stores/auth.store.ts`
3. `apps/web/src/views/public/CheckoutView.vue`
4. `supabase/functions/create-order/index.ts`
5. `supabase/functions/mp-webhook/index.ts`
6. `supabase/functions/reconcile-orders/index.ts`
7. `apps/web/src/views/customer/DownloadsView.vue`
8. `supabase/functions/download/index.ts`
9. `apps/web/src/views/admin/ProductsView.vue`
10. `apps/web/src/views/admin/IntegrationsView.vue`

## 15. O que Já Foi Validado

Validação feita localmente:
- o monorepo compila com `pnpm build`

Resultado:
- build concluído com sucesso
- há avisos de configuração Vite/PostCSS sobre módulo CJS/ESM, mas não bloqueiam a compilação

## 16. Sugestões para Futuras IAs

Antes de editar:
- verificar se o banco real contém colunas além do `supabase-schema.sql`
- checar o fluxo inteiro se tocar em checkout, webhook ou downloads
- respeitar o padrão atual de queries diretas ao Supabase
- manter compatibilidade com `site_config` porque ele alimenta branding e integrações

Se for investigar bugs:
- começar por pedidos `AWAITING_PAYMENT`
- verificar `webhook_events`
- conferir `mp_payment_id`, `mp_status` e existência de `download_tokens`

Se for criar novas features:
- preferir reaproveitar `site_config` para flags/configurações globais
- manter `camelCase` apenas na camada de frontend; banco permanece `snake_case`

## 17. Arquivos Mais Importantes

- [apps/web/src/router/index.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/router/index.ts)
- [apps/web/src/stores/auth.store.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/stores/auth.store.ts)
- [apps/web/src/stores/site-config.store.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/stores/site-config.store.ts)
- [apps/web/src/views/public/CheckoutView.vue](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/views/public/CheckoutView.vue)
- [apps/web/src/views/public/CheckoutSuccessView.vue](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/views/public/CheckoutSuccessView.vue)
- [apps/web/src/views/customer/DownloadsView.vue](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/views/customer/DownloadsView.vue)
- [apps/web/src/views/admin/ProductsView.vue](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/views/admin/ProductsView.vue)
- [apps/web/src/views/admin/OrdersView.vue](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/views/admin/OrdersView.vue)
- [apps/web/src/views/admin/IntegrationsView.vue](/home/wesleydev/Área%20de%20trabalho/pedago-shop/apps/web/src/views/admin/IntegrationsView.vue)
- [supabase/functions/create-order/index.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/supabase/functions/create-order/index.ts)
- [supabase/functions/mp-webhook/index.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/supabase/functions/mp-webhook/index.ts)
- [supabase/functions/reconcile-orders/index.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/supabase/functions/reconcile-orders/index.ts)
- [supabase/functions/download/index.ts](/home/wesleydev/Área%20de%20trabalho/pedago-shop/supabase/functions/download/index.ts)
- [supabase-schema.sql](/home/wesleydev/Área%20de%20trabalho/pedago-shop/supabase-schema.sql)

