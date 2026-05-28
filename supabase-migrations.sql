-- ═══════════════════════════════════════════════════════════════════
-- PEDAGO SHOP — Todas as migrations em sequência
-- ---------------------------------------------------------------
-- Cole este arquivo no SQL Editor do Supabase e execute para criar
-- o banco do zero. Idempotente: seguro de rodar mais de uma vez.
--
-- Ordem de execução:
--   [00] Schema inicial (supabase-schema.sql)
--   [01] 20260512 — Categoria "Grátis"
--   [02] 20260513 — RLS de INSERT para orders/order_items
--   [03] 20260514 — Campos de entrega em products
--   [04] 20260515 — Correção crítica de is_admin()
--   [05] 20260516 — delivery_link e updated_at em download_tokens
--   [06] 20260517 — created_at em order_items
--   [07] 20260518 — Índices de performance
--   [08] 20260519 — Triggers de updated_at
--   [09] 20260520 — Seed do site_config global
-- ═══════════════════════════════════════════════════════════════════



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [00] SCHEMA INICIAL                                         ║
-- ╚═══════════════════════════════════════════════════════════════╝

create extension if not exists "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────
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

-- ─── categories ──────────────────────────────────────────────────
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

-- ─── products ────────────────────────────────────────────────────
create table if not exists products (
  id              uuid          primary key default uuid_generate_v4(),
  name            text          not null,
  slug            text          not null unique,
  description     text          not null default '',
  rich_content    text,
  price           numeric(10,2) not null,
  compare_price   numeric(10,2),
  cover_image_url text          not null default '',
  preview_images  text[]        not null default '{}',
  category_id     uuid          references categories(id),
  file_key        text          not null default '',
  file_size       int           not null default 0,
  page_count      int,
  tags            text[]        not null default '{}',
  is_active       boolean       not null default true,
  is_featured     boolean       not null default false,
  sort_order      int           not null default 0,
  max_downloads   int           not null default 5,
  download_count  int           not null default 0,
  sales_count     int           not null default 0,
  deleted_at      timestamptz,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- ─── orders ──────────────────────────────────────────────────────
create table if not exists orders (
  id               uuid          primary key default uuid_generate_v4(),
  order_number     text          not null unique,
  user_id          uuid          not null references profiles(id),
  status           text          not null default 'AWAITING_PAYMENT'
                                   check (status in (
                                     'PENDING','AWAITING_PAYMENT','PAID',
                                     'CANCELLED','REFUNDED','EXPIRED'
                                   )),
  total_amount     numeric(10,2) not null,
  payment_method   text          check (payment_method in ('PIX','CREDIT_CARD','DEBIT_CARD')),
  mp_preference_id text,
  mp_payment_id    text          unique,
  mp_status        text,
  paid_at          timestamptz,
  expires_at       timestamptz,
  customer_email   text          not null,
  customer_name    text          not null,
  metadata         jsonb,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now()
);

-- ─── order_items ─────────────────────────────────────────────────
create table if not exists order_items (
  id           uuid          primary key default uuid_generate_v4(),
  order_id     uuid          not null references orders(id) on delete cascade,
  product_id   uuid          not null references products(id),
  product_name text          not null,
  unit_price   numeric(10,2) not null,
  quantity     int           not null default 1
);

-- ─── download_tokens ─────────────────────────────────────────────
create table if not exists download_tokens (
  id               uuid        primary key default uuid_generate_v4(),
  token            text        not null unique default uuid_generate_v4()::text,
  order_id         uuid        not null references orders(id) on delete cascade,
  order_item_id    uuid        not null references order_items(id) on delete cascade,
  download_count   int         not null default 0,
  max_downloads    int         not null default 99999,
  expires_at       timestamptz not null,
  last_download_at timestamptz,
  last_download_ip text,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- ─── webhook_events ──────────────────────────────────────────────
create table if not exists webhook_events (
  id            uuid        primary key default uuid_generate_v4(),
  source        text        not null,
  event_id      text        not null,
  event_type    text        not null,
  payload       jsonb       not null,
  processed_at  timestamptz not null default now(),
  status        text        not null,
  error_message text,
  unique (source, event_id)
);

-- ─── site_config ─────────────────────────────────────────────────
create table if not exists site_config (
  id                  uuid        primary key default uuid_generate_v4(),
  key                 text        not null unique,
  value               jsonb       not null,
  updated_at          timestamptz not null default now(),
  updated_by_admin_id uuid        references profiles(id)
);

-- ─── RLS base ────────────────────────────────────────────────────
alter table profiles        enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;
alter table download_tokens enable row level security;
alter table webhook_events  enable row level security;
alter table site_config     enable row level security;

-- Função auxiliar (versão inicial — será substituída no passo [04])
create or replace function is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select raw_app_meta_data->>'role' = 'ADMIN' from auth.users where id = auth.uid()),
    false
  );
$$;

-- policies: profiles
create policy "profiles_read_own"    on profiles for select using (auth.uid() = id);
create policy "profiles_update_own"  on profiles for update using (auth.uid() = id);
create policy "profiles_admin_all"   on profiles for all    using (is_admin());

-- policies: categories
create policy "categories_public_read" on categories for select using (is_active = true);
create policy "categories_admin_all"   on categories for all    using (is_admin());

-- policies: products
create policy "products_public_read" on products for select using (is_active = true and deleted_at is null);
create policy "products_admin_all"   on products for all    using (is_admin());

-- policies: orders
create policy "orders_read_own"   on orders for select using (auth.uid() = user_id);
create policy "orders_admin_all"  on orders for all    using (is_admin());

-- policies: order_items
create policy "order_items_read_own"  on order_items for select
  using (exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid()));
create policy "order_items_admin_all" on order_items for all using (is_admin());

-- policies: download_tokens
create policy "download_tokens_read_own"  on download_tokens for select
  using (exists (select 1 from orders where id = download_tokens.order_id and user_id = auth.uid()));
create policy "download_tokens_admin_all" on download_tokens for all using (is_admin());

-- policies: site_config
create policy "site_config_public_read"  on site_config for select using (true);
create policy "site_config_admin_write"  on site_config for all    using (is_admin());

-- policies: webhook_events
create policy "webhook_events_admin_all" on webhook_events for all using (is_admin());

-- ─── Storage ─────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values
  ('product-covers',   'product-covers',   true),
  ('product-previews', 'product-previews', true),
  ('product-files',    'product-files',    false)
on conflict (id) do nothing;

create policy "public_covers_read"   on storage.objects for select using (bucket_id = 'product-covers');
create policy "public_previews_read" on storage.objects for select using (bucket_id = 'product-previews');
create policy "admin_storage_all"    on storage.objects for all    using (is_admin());
create policy "admin_files_read"     on storage.objects for select using (bucket_id = 'product-files' and is_admin());



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [01] 20260512 — Categoria "Grátis"                          ║
-- ╚═══════════════════════════════════════════════════════════════╝

insert into categories (name, slug, description, is_active, sort_order)
values (
  'Grátis',
  'gratis',
  'Atividades e materiais pedagógicos disponíveis gratuitamente.',
  true,
  0
)
on conflict (slug) do nothing;



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [02] 20260513 — RLS de INSERT para orders e order_items     ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- Permite que clientes autenticados criem pedidos para si mesmos
drop policy if exists "orders_insert_own" on orders;
create policy "orders_insert_own" on orders
  for insert with check (auth.uid() = user_id);

-- Permite que clientes autenticados adicionem itens a pedidos próprios
drop policy if exists "order_items_insert_for_own_order" on order_items;
create policy "order_items_insert_for_own_order" on order_items
  for insert with check (
    exists (select 1 from orders where id = order_items.order_id and user_id = auth.uid())
  );



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [03] 20260514 — Campos de entrega em products               ║
-- ║                                                               ║
-- ║  Colunas usadas pelas Edge Functions create-order,           ║
-- ║  mp-webhook e reconcile-orders, ausentes do schema original. ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- delivery_type: 'pdf' (arquivo no Storage) ou 'link' (URL externa)
alter table products
  add column if not exists delivery_type text not null default 'pdf'
    check (delivery_type in ('pdf', 'link'));

-- delivery_link: URL de entrega para produtos do tipo 'link'
alter table products
  add column if not exists delivery_link text;

-- youtube_url: embed do player na página de detalhe do produto
alter table products
  add column if not exists youtube_url text;

-- instagram_url: embed do post/reels na página de detalhe do produto
alter table products
  add column if not exists instagram_url text;

-- Garante que delivery_link seja obrigatório quando delivery_type = 'link'
alter table products
  drop constraint if exists chk_products_delivery_link_required;

alter table products
  add constraint chk_products_delivery_link_required
    check (
      delivery_type = 'pdf'
      or (delivery_type = 'link' and delivery_link is not null and delivery_link <> '')
    )
    deferrable initially deferred;



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [04] 20260515 — Correção crítica de is_admin()              ║
-- ║                                                               ║
-- ║  PROBLEMA: a versão original lia raw_app_meta_data que nunca ║
-- ║  é populado pela aplicação. Todas as policies RLS de escrita ║
-- ║  estavam retornando false para admins reais.                 ║
-- ║                                                               ║
-- ║  SOLUÇÃO: ler profiles.role com SECURITY DEFINER para evitar ║
-- ║  recursão infinita quando a função é chamada dentro de       ║
-- ║  policies da própria tabela profiles.                        ║
-- ╚═══════════════════════════════════════════════════════════════╝

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



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [05] 20260516 — delivery_link e updated_at em              ║
-- ║        download_tokens                                        ║
-- ║                                                               ║
-- ║  Sem delivery_link, tokens de produtos 'link' eram criados   ║
-- ║  sem URL → Edge Function download retornava 404.             ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- URL de entrega copiada de products.delivery_link na criação do token.
-- null = servir PDF do Storage; preenchido = redirect 302 para URL.
alter table download_tokens
  add column if not exists delivery_link text;

-- Campo de rastreamento adicionado para o trigger de updated_at.
alter table download_tokens
  add column if not exists updated_at timestamptz not null default now();



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [06] 20260517 — created_at em order_items                   ║
-- ╚═══════════════════════════════════════════════════════════════╝

alter table order_items
  add column if not exists created_at timestamptz not null default now();



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [07] 20260518 — Índices de performance                      ║
-- ╚═══════════════════════════════════════════════════════════════╝

-- orders
create index if not exists idx_orders_user_id           on orders (user_id);
create index if not exists idx_orders_status            on orders (status);
create index if not exists idx_orders_status_created_at on orders (status, created_at desc);
create index if not exists idx_orders_mp_payment_id     on orders (mp_payment_id)    where mp_payment_id is not null;
create index if not exists idx_orders_mp_preference_id  on orders (mp_preference_id) where mp_preference_id is not null;
create index if not exists idx_orders_created_at_desc   on orders (created_at desc);
create index if not exists idx_orders_paid_at_desc      on orders (paid_at desc)     where paid_at is not null;

-- order_items
create index if not exists idx_order_items_order_id   on order_items (order_id);
create index if not exists idx_order_items_product_id on order_items (product_id);

-- download_tokens
create index if not exists idx_download_tokens_token         on download_tokens (token);
create index if not exists idx_download_tokens_order_id      on download_tokens (order_id);
create index if not exists idx_download_tokens_order_item_id on download_tokens (order_item_id);

-- products
create index if not exists idx_products_slug         on products (slug);
create index if not exists idx_products_category_id  on products (category_id);
create index if not exists idx_products_active       on products (sort_order asc, created_at desc) where is_active = true and deleted_at is null;
create index if not exists idx_products_featured     on products (sort_order asc)                  where is_featured = true and is_active = true and deleted_at is null;

-- categories
create index if not exists idx_categories_slug   on categories (slug);
create index if not exists idx_categories_active on categories (sort_order asc) where is_active = true;

-- profiles
create index if not exists idx_profiles_role           on profiles (role);
create index if not exists idx_profiles_phone_not_null on profiles (phone) where phone is not null;

-- site_config
create index if not exists idx_site_config_key on site_config (key);

-- webhook_events
create index if not exists idx_webhook_events_status on webhook_events (status);



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [08] 20260519 — Triggers de updated_at                      ║
-- ║                                                               ║
-- ║  Garante que updated_at seja sempre mantido pelo banco,      ║
-- ║  independente do código das Edge Functions.                  ║
-- ╚═══════════════════════════════════════════════════════════════╝

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_profiles_updated_at        on profiles;
drop trigger if exists tr_categories_updated_at      on categories;
drop trigger if exists tr_products_updated_at        on products;
drop trigger if exists tr_orders_updated_at          on orders;
drop trigger if exists tr_site_config_updated_at     on site_config;
drop trigger if exists tr_download_tokens_updated_at on download_tokens;

create trigger tr_profiles_updated_at
  before update on profiles        for each row execute function set_updated_at();
create trigger tr_categories_updated_at
  before update on categories      for each row execute function set_updated_at();
create trigger tr_products_updated_at
  before update on products        for each row execute function set_updated_at();
create trigger tr_orders_updated_at
  before update on orders          for each row execute function set_updated_at();
create trigger tr_site_config_updated_at
  before update on site_config     for each row execute function set_updated_at();
create trigger tr_download_tokens_updated_at
  before update on download_tokens for each row execute function set_updated_at();



-- ╔═══════════════════════════════════════════════════════════════╗
-- ║  [09] 20260520 — Seed do site_config global                  ║
-- ║                                                               ║
-- ║  Sem esta linha todas as Edge Functions retornam config       ║
-- ║  vazia: sem cores, sem integrações, sem nome de loja.        ║
-- ║  ON CONFLICT DO NOTHING preserva configurações existentes.   ║
-- ╚═══════════════════════════════════════════════════════════════╝

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
