-- ═══════════════════════════════════════════════════════════════════
-- REFERÊNCIA: Schema completo e atualizado do Pedago Shop
-- ---------------------------------------------------------------
-- Este arquivo representa o estado FINAL do banco após todas as
-- migrations terem sido aplicadas. Ele NÃO é executado pelo
-- Supabase CLI (que usa os arquivos individuais de migration).
--
-- Serve como:
--   • Documentação do schema atual
--   • Bootstrap rápido de um novo ambiente local (pode ser colado
--     no SQL Editor do Supabase antes de rodar as migrations)
--
-- Última migration incluída: 20260520_seed_initial_site_config.sql
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- EXTENSÕES
-- ─────────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- FUNÇÃO AUXILIAR: set_updated_at()
-- ─────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────
-- TABELA: profiles
-- Espelha auth.users com dados de perfil da aplicação.
-- Criada automaticamente pelo trigger handle_new_user.
-- ─────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  name        text        not null default '',
  phone       text,
  avatar_url  text,
  role        text        not null default 'CUSTOMER'
                            check (role in ('CUSTOMER', 'ADMIN')),
  is_active   boolean     not null default true,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

drop trigger if exists tr_profiles_updated_at on profiles;
create trigger tr_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- TABELA: categories
-- Categorias de produtos visíveis no catálogo.
-- ─────────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid        primary key default uuid_generate_v4(),
  name        text        not null,
  slug        text        not null unique,
  description text,
  image_url   text,
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists tr_categories_updated_at on categories;
create trigger tr_categories_updated_at
  before update on categories
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- TABELA: products
-- Produtos digitais à venda (PDF ou link externo).
-- ─────────────────────────────────────────────────────────────────
create table if not exists products (
  id              uuid        primary key default uuid_generate_v4(),
  name            text        not null,
  slug            text        not null unique,
  description     text        not null default '',
  rich_content    text,

  -- Preços
  price           numeric(10,2) not null,
  compare_price   numeric(10,2),

  -- Imagens
  cover_image_url text        not null default '',
  preview_images  text[]      not null default '{}',

  -- Categoria
  category_id     uuid references categories(id),

  -- Arquivo (delivery_type = 'pdf')
  file_key        text        not null default '',
  file_size       int         not null default 0,
  page_count      int,

  -- Entrega
  delivery_type   text        not null default 'pdf'
                                check (delivery_type in ('pdf', 'link')),
  delivery_link   text,

  -- Mídia
  youtube_url     text,
  instagram_url   text,

  -- Metadados
  tags            text[]      not null default '{}',
  is_active       boolean     not null default true,
  is_featured     boolean     not null default false,
  sort_order      int         not null default 0,
  max_downloads   int         not null default 5,   -- legado, substituído por download_tokens.max_downloads
  download_count  int         not null default 0,   -- legado, não incrementado pelas Edge Functions atuais
  sales_count     int         not null default 0,   -- incrementado pelo mp-webhook e reconcile-orders
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- Constraint: link obrigatório quando delivery_type = 'link'
  constraint chk_products_delivery_link_required
    check (
      delivery_type = 'pdf'
      or (delivery_type = 'link' and delivery_link is not null and delivery_link <> '')
    )
    deferrable initially deferred
);

drop trigger if exists tr_products_updated_at on products;
create trigger tr_products_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- TABELA: orders
-- Pedidos criados no checkout. Status gerenciado pelas Edge Functions.
-- ─────────────────────────────────────────────────────────────────
create table if not exists orders (
  id               uuid        primary key default uuid_generate_v4(),
  order_number     text        not null unique,         -- formato: ORD-YYYY-NNNNNN
  user_id          uuid        not null references profiles(id),
  status           text        not null default 'AWAITING_PAYMENT'
                                 check (status in (
                                   'PENDING',
                                   'AWAITING_PAYMENT',
                                   'PAID',
                                   'CANCELLED',
                                   'REFUNDED',
                                   'EXPIRED'
                                 )),
  total_amount     numeric(10,2) not null,
  payment_method   text        check (payment_method in ('PIX', 'CREDIT_CARD', 'DEBIT_CARD')),

  -- Mercado Pago
  mp_preference_id text,                               -- Checkout Pro (cartão)
  mp_payment_id    text unique,                        -- ID do pagamento (PIX e cartão confirmado)
  mp_status        text,                               -- status retornado pelo MP na última consulta

  -- Timestamps de negócio
  paid_at          timestamptz,
  expires_at       timestamptz,                        -- expiração do PIX (30 min após criação)

  -- Snapshot do cliente no momento da compra
  customer_email   text        not null,
  customer_name    text        not null,

  -- Dados extras (ex.: qr_code, qr_code_base64 do PIX)
  metadata         jsonb,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists tr_orders_updated_at on orders;
create trigger tr_orders_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- TABELA: order_items
-- Itens de cada pedido. Snapshot de nome e preço no momento da compra.
-- ─────────────────────────────────────────────────────────────────
create table if not exists order_items (
  id           uuid        primary key default uuid_generate_v4(),
  order_id     uuid        not null references orders(id) on delete cascade,
  product_id   uuid        not null references products(id),
  product_name text        not null,                   -- snapshot do nome no momento da compra
  unit_price   numeric(10,2) not null,                 -- snapshot do preço no momento da compra
  quantity     int         not null default 1,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────
-- TABELA: download_tokens
-- Tokens de acesso ao conteúdo após pagamento confirmado.
-- Um token por order_item; validade de 30 anos; ilimitados por padrão.
-- ─────────────────────────────────────────────────────────────────
create table if not exists download_tokens (
  id               uuid        primary key default uuid_generate_v4(),
  token            text        not null unique default uuid_generate_v4()::text,
  order_id         uuid        not null references orders(id) on delete cascade,
  order_item_id    uuid        not null references order_items(id) on delete cascade,

  -- Controle de acesso
  download_count   int         not null default 0,
  max_downloads    int         not null default 99999, -- 99999 = ilimitado na prática
  expires_at       timestamptz not null,
  revoked_at       timestamptz,                        -- revogação em caso de reembolso

  -- Rastreamento
  last_download_at timestamptz,
  last_download_ip text,

  -- Entrega: link externo (copiado de products.delivery_link na criação do token)
  delivery_link    text,                               -- null = PDF do Storage; preenchido = redirect

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists tr_download_tokens_updated_at on download_tokens;
create trigger tr_download_tokens_updated_at
  before update on download_tokens
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- TABELA: webhook_events
-- Log de eventos recebidos via webhook para garantir idempotência.
-- Impede que o mesmo pagamento seja processado duas vezes.
-- ─────────────────────────────────────────────────────────────────
create table if not exists webhook_events (
  id            uuid        primary key default uuid_generate_v4(),
  source        text        not null,                  -- ex.: 'mercadopago'
  event_id      text        not null,                  -- ID do pagamento MP (deduplicação)
  event_type    text        not null,                  -- ex.: 'payment'
  payload       jsonb       not null,                  -- corpo completo do webhook
  status        text        not null,                  -- processing | processed | skipped | failed
  error_message text,                                  -- preenchido quando status = 'failed'
  processed_at  timestamptz not null default now(),    -- data de criação/última atualização
  unique (source, event_id)
);

-- ─────────────────────────────────────────────────────────────────
-- TABELA: site_config
-- Configuração global da loja. Sempre uma linha com key = 'global'.
-- ─────────────────────────────────────────────────────────────────
create table if not exists site_config (
  id                  uuid        primary key default uuid_generate_v4(),
  key                 text        not null unique,
  value               jsonb       not null,
  updated_at          timestamptz not null default now(),
  updated_by_admin_id uuid        references profiles(id)
);

drop trigger if exists tr_site_config_updated_at on site_config;
create trigger tr_site_config_updated_at
  before update on site_config
  for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════════
alter table profiles        enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table download_tokens enable row level security;
alter table webhook_events  enable row level security;
alter table site_config     enable row level security;

-- ─── Função auxiliar: is_admin() ─────────────────────────────────
-- SECURITY DEFINER: evita recursão infinita ao ser chamada dentro de
-- policies da tabela profiles (a função lê profiles com bypass de RLS).
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select role = 'ADMIN' from profiles where id = auth.uid()),
    false
  );
$$;

-- ─── profiles ────────────────────────────────────────────────────
create policy "profiles_read_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

create policy "profiles_admin_all"
  on profiles for all
  using (is_admin());

-- ─── categories ──────────────────────────────────────────────────
create policy "categories_public_read"
  on categories for select
  using (is_active = true);

create policy "categories_admin_all"
  on categories for all
  using (is_admin());

-- ─── products ────────────────────────────────────────────────────
create policy "products_public_read"
  on products for select
  using (is_active = true and deleted_at is null);

create policy "products_admin_all"
  on products for all
  using (is_admin());

-- ─── orders ──────────────────────────────────────────────────────
create policy "orders_read_own"
  on orders for select
  using (auth.uid() = user_id);

create policy "orders_insert_own"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "orders_admin_all"
  on orders for all
  using (is_admin());

-- ─── order_items ─────────────────────────────────────────────────
create policy "order_items_read_own"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where id = order_items.order_id
        and user_id = auth.uid()
    )
  );

create policy "order_items_insert_for_own_order"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where id = order_items.order_id
        and user_id = auth.uid()
    )
  );

create policy "order_items_admin_all"
  on order_items for all
  using (is_admin());

-- ─── download_tokens ─────────────────────────────────────────────
create policy "download_tokens_read_own"
  on download_tokens for select
  using (
    exists (
      select 1 from orders
      where id = download_tokens.order_id
        and user_id = auth.uid()
    )
  );

create policy "download_tokens_admin_all"
  on download_tokens for all
  using (is_admin());

-- ─── site_config ─────────────────────────────────────────────────
-- Leitura pública: o frontend precisa das cores e configs visuais
-- sem autenticação. Os campos sensíveis (tokens MP, Telegram) ficam
-- em site_config.value mas o frontend admin deve filtrar.
create policy "site_config_public_read"
  on site_config for select
  using (true);

create policy "site_config_admin_write"
  on site_config for all
  using (is_admin());

-- ─── webhook_events ──────────────────────────────────────────────
create policy "webhook_events_admin_all"
  on webhook_events for all
  using (is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-covers',   'product-covers',   true,  5242880,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('product-previews', 'product-previews', true,  5242880,  array['image/jpeg','image/png','image/webp','image/gif']),
  ('product-files',    'product-files',    false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

-- Leitura pública de capas e previews
create policy "public_covers_read"
  on storage.objects for select
  using (bucket_id = 'product-covers');

create policy "public_previews_read"
  on storage.objects for select
  using (bucket_id = 'product-previews');

-- Admins podem fazer tudo no Storage (upload, delete, listagem)
create policy "admin_storage_all"
  on storage.objects for all
  using (is_admin());

-- Admins podem ler os arquivos PDF (para gestão, não para download de clientes)
-- Downloads de clientes são servidos pela Edge Function 'download' com service_role
create policy "admin_files_read"
  on storage.objects for select
  using (bucket_id = 'product-files' and is_admin());

-- ═══════════════════════════════════════════════════════════════════
-- ÍNDICES DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════

-- orders
create index if not exists idx_orders_user_id            on orders (user_id);
create index if not exists idx_orders_status             on orders (status);
create index if not exists idx_orders_status_created_at  on orders (status, created_at desc);
create index if not exists idx_orders_mp_payment_id      on orders (mp_payment_id)    where mp_payment_id is not null;
create index if not exists idx_orders_mp_preference_id   on orders (mp_preference_id) where mp_preference_id is not null;
create index if not exists idx_orders_created_at_desc    on orders (created_at desc);
create index if not exists idx_orders_paid_at_desc       on orders (paid_at desc)     where paid_at is not null;

-- order_items
create index if not exists idx_order_items_order_id   on order_items (order_id);
create index if not exists idx_order_items_product_id on order_items (product_id);

-- download_tokens
create index if not exists idx_download_tokens_token         on download_tokens (token);
create index if not exists idx_download_tokens_order_id      on download_tokens (order_id);
create index if not exists idx_download_tokens_order_item_id on download_tokens (order_item_id);

-- products
create index if not exists idx_products_slug          on products (slug);
create index if not exists idx_products_category_id   on products (category_id);
create index if not exists idx_products_active        on products (sort_order asc, created_at desc) where is_active = true and deleted_at is null;
create index if not exists idx_products_featured      on products (sort_order asc)                  where is_featured = true and is_active = true and deleted_at is null;

-- categories
create index if not exists idx_categories_slug   on categories (slug);
create index if not exists idx_categories_active on categories (sort_order asc) where is_active = true;

-- profiles
create index if not exists idx_profiles_role          on profiles (role);
create index if not exists idx_profiles_phone_not_null on profiles (phone) where phone is not null;

-- site_config
create index if not exists idx_site_config_key on site_config (key);

-- webhook_events
create index if not exists idx_webhook_events_status on webhook_events (status);

-- ═══════════════════════════════════════════════════════════════════
-- SEED INICIAL
-- ═══════════════════════════════════════════════════════════════════

-- Categoria "Grátis" (migration 20260512)
insert into categories (name, slug, description, is_active, sort_order)
values ('Grátis', 'gratis', 'Atividades e materiais pedagógicos disponíveis gratuitamente.', true, 0)
on conflict (slug) do nothing;

-- Configuração global da loja (migration 20260520)
insert into site_config (key, value, updated_at)
values (
  'global',
  jsonb_build_object(
    'storeName',                 'Pedago Shop',
    'storeDescription',          'Materiais pedagógicos digitais de qualidade para professores e educadores',
    'logoUrl',                   null,
    'faviconUrl',                null,
    'primaryColor',              '#7C3AED',
    'secondaryColor',            '#EC4899',
    'accentColor',               '#F59E0B',
    'bannerEnabled',             false,
    'bannerImageUrl',            null,
    'bannerTitle',               'Materiais Pedagógicos de Qualidade',
    'bannerSubtitle',            'Recursos educacionais digitais para professores e educadores',
    'bannerCtaText',             'Ver Catálogo',
    'bannerCtaLink',             '/catalogo',
    'banners',                   '[]'::jsonb,
    'highlightedProductIds',     '[]'::jsonb,
    'highlightedCategoryIds',    '[]'::jsonb,
    'announcementBarText',       null,
    'announcementBarColor',      '#7C3AED',
    'footerText',                '© 2025 Pedago Shop. Todos os direitos reservados.',
    'socialLinks',               jsonb_build_object(
                                   'instagram', null,
                                   'whatsapp',  null,
                                   'facebook',  null,
                                   'youtube',   null,
                                   'tiktok',    null
                                 ),
    'pixMessage',                'Pague com PIX e receba o acesso instantaneamente!',
    'seoTitle',                  'Pedago Shop — Materiais Pedagógicos Digitais',
    'seoDescription',            'Encontre atividades, planos de aula e materiais pedagógicos digitais de alta qualidade.',
    'maintenanceMode',           false,
    'mercadoPagoAccessToken',    null,
    'mercadoPagoWebhookSecret',  null,
    'mercadoPagoPixKey',         null,
    'telegramBotToken',          null,
    'telegramRecipients',        '[]'::jsonb
  ),
  now()
)
on conflict (key) do nothing;
