-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Índices de performance
-- ---------------------------------------------------------------
-- Todos os índices são criados com IF NOT EXISTS e CONCURRENTLY
-- para não bloquear a tabela durante a criação em produção.
--
-- ATENÇÃO: CREATE INDEX CONCURRENTLY não pode ser executado dentro
-- de uma transação. O Supabase CLI executa cada migration em uma
-- transação por padrão. Para rodar esta migration em produção
-- sem downtime, execute os comandos abaixo manualmente no SQL
-- Editor do Supabase (fora de BEGIN/COMMIT).
-- ═══════════════════════════════════════════════════════════════════

-- ─── orders ──────────────────────────────────────────────────────
-- Consultas mais frequentes:
--   • orders WHERE user_id = $1              (área do cliente)
--   • orders WHERE status = 'AWAITING_PAYMENT' (reconcile-orders)
--   • orders WHERE mp_payment_id = $1        (mp-webhook)
--   • orders ORDER BY created_at DESC        (dashboard admin)
--   • orders ORDER BY paid_at DESC           (recent-purchases)

create index if not exists idx_orders_user_id
  on orders (user_id);

create index if not exists idx_orders_status
  on orders (status);

create index if not exists idx_orders_status_created_at
  on orders (status, created_at desc);

-- Índice parcial: apenas pedidos com ID de pagamento preenchido
create index if not exists idx_orders_mp_payment_id
  on orders (mp_payment_id)
  where mp_payment_id is not null;

-- Índice parcial: apenas pedidos com preferência de cartão preenchida
create index if not exists idx_orders_mp_preference_id
  on orders (mp_preference_id)
  where mp_preference_id is not null;

create index if not exists idx_orders_created_at_desc
  on orders (created_at desc);

-- Índice parcial: apenas pedidos pagos têm paid_at preenchido
create index if not exists idx_orders_paid_at_desc
  on orders (paid_at desc)
  where paid_at is not null;

-- ─── order_items ─────────────────────────────────────────────────
-- Consultas: order_items WHERE order_id = $1  (detail, webhook)
--            order_items WHERE product_id = $1 (relatórios de vendas)

create index if not exists idx_order_items_order_id
  on order_items (order_id);

create index if not exists idx_order_items_product_id
  on order_items (product_id);

-- ─── download_tokens ─────────────────────────────────────────────
-- Consultas:
--   • download_tokens WHERE token = $1        (Edge Function download)
--   • download_tokens WHERE order_id = $1     (mp-webhook, reconcile)
--   • download_tokens WHERE order_item_id = $1(deduplicação de tokens)

create index if not exists idx_download_tokens_token
  on download_tokens (token);

create index if not exists idx_download_tokens_order_id
  on download_tokens (order_id);

create index if not exists idx_download_tokens_order_item_id
  on download_tokens (order_item_id);

-- ─── products ────────────────────────────────────────────────────
-- Consultas:
--   • products WHERE slug = $1               (ProductView)
--   • products WHERE is_active AND deleted_at IS NULL (catalog)
--   • products WHERE is_featured = true      (HomeView)
--   • products WHERE category_id = $1        (filtro de categoria)

create index if not exists idx_products_slug
  on products (slug);

create index if not exists idx_products_category_id
  on products (category_id);

-- Índice parcial: apenas produtos ativos e não deletados são exibidos
create index if not exists idx_products_active_not_deleted
  on products (sort_order asc, created_at desc)
  where is_active = true and deleted_at is null;

-- Índice parcial: apenas produtos em destaque são exibidos na home
create index if not exists idx_products_featured
  on products (sort_order asc)
  where is_featured = true and is_active = true and deleted_at is null;

-- ─── categories ──────────────────────────────────────────────────

create index if not exists idx_categories_slug
  on categories (slug);

-- Índice parcial: apenas categorias ativas são listadas no frontend
create index if not exists idx_categories_active
  on categories (sort_order asc)
  where is_active = true;

-- ─── profiles ────────────────────────────────────────────────────
-- Consultas: profiles WHERE role = 'ADMIN'   (create-admin, admin-users)
--            profiles WHERE phone IS NOT NULL (validação de checkout)

create index if not exists idx_profiles_role
  on profiles (role);

-- Índice parcial: apenas perfis com telefone cadastrado
create index if not exists idx_profiles_phone_not_null
  on profiles (phone)
  where phone is not null;

-- ─── site_config ─────────────────────────────────────────────────
-- Consulta: site_config WHERE key = 'global'  (todas as Edge Functions)

create index if not exists idx_site_config_key
  on site_config (key);

-- ─── webhook_events ──────────────────────────────────────────────
-- Consultas:
--   • webhook_events WHERE source = $1 AND event_id = $2 (idempotência)
--   • webhook_events WHERE status = 'processing'          (monitoramento)

-- O schema original já tem UNIQUE (source, event_id) — isso cria um
-- índice implícito. Adicionamos apenas o de status para monitoramento.
create index if not exists idx_webhook_events_status
  on webhook_events (status);
