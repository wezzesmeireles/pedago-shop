-- ═══════════════════════════════════════════════════════
-- PEDAGO SHOP — Schema SQL para Supabase
-- Cole este arquivo no SQL Editor do Supabase e execute
-- ═══════════════════════════════════════════════════════

-- Extensão para UUID
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- PROFILES (estende auth.users do Supabase)
-- ─────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  phone       text,
  avatar_url  text,
  role        text not null default 'CUSTOMER' check (role in ('CUSTOMER', 'ADMIN')),
  is_active   boolean not null default true,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Trigger: cria profile automaticamente ao registrar
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

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
create table if not exists products (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  slug            text not null unique,
  description     text not null default '',
  rich_content    text,
  price           numeric(10,2) not null,
  compare_price   numeric(10,2),
  cover_image_url text not null default '',
  preview_images  text[] not null default '{}',
  category_id     uuid references categories(id),
  file_key        text not null default '',
  file_size       int not null default 0,
  page_count      int,
  tags            text[] not null default '{}',
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  sort_order      int not null default 0,
  max_downloads   int not null default 5,
  download_count  int not null default 0,
  sales_count     int not null default 0,
  deleted_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
create table if not exists orders (
  id               uuid primary key default uuid_generate_v4(),
  order_number     text not null unique,
  user_id          uuid not null references profiles(id),
  status           text not null default 'AWAITING_PAYMENT'
                   check (status in ('PENDING','AWAITING_PAYMENT','PAID','CANCELLED','REFUNDED','EXPIRED')),
  total_amount     numeric(10,2) not null,
  payment_method   text check (payment_method in ('PIX','CREDIT_CARD','DEBIT_CARD')),
  mp_preference_id text,
  mp_payment_id    text unique,
  mp_status        text,
  paid_at          timestamptz,
  expires_at       timestamptz,
  customer_email   text not null,
  customer_name    text not null,
  metadata         jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────
create table if not exists order_items (
  id           uuid primary key default uuid_generate_v4(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid not null references products(id),
  product_name text not null,
  unit_price   numeric(10,2) not null,
  quantity     int not null default 1
);

-- ─────────────────────────────────────────
-- DOWNLOAD TOKENS
-- ─────────────────────────────────────────
create table if not exists download_tokens (
  id               uuid primary key default uuid_generate_v4(),
  token            text not null unique default uuid_generate_v4()::text,
  order_id         uuid not null references orders(id) on delete cascade,
  order_item_id    uuid not null references order_items(id) on delete cascade,
  download_count   int not null default 0,
  max_downloads    int not null default 99999,
  expires_at       timestamptz not null,
  last_download_at timestamptz,
  last_download_ip text,
  revoked_at       timestamptz,
  created_at       timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- WEBHOOK EVENTS (idempotência)
-- ─────────────────────────────────────────
create table if not exists webhook_events (
  id            uuid primary key default uuid_generate_v4(),
  source        text not null,
  event_id      text not null,
  event_type    text not null,
  payload       jsonb not null,
  processed_at  timestamptz not null default now(),
  status        text not null,
  error_message text,
  unique (source, event_id)
);

-- ─────────────────────────────────────────
-- SITE CONFIG
-- ─────────────────────────────────────────
create table if not exists site_config (
  id                  uuid primary key default uuid_generate_v4(),
  key                 text not null unique,
  value               jsonb not null,
  updated_at          timestamptz not null default now(),
  updated_by_admin_id uuid references profiles(id)
);

-- ─────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────
-- O backend usa service_role key (bypassa RLS)
-- Habilitamos RLS mas o backend tem acesso total

alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table download_tokens enable row level security;
alter table webhook_events enable row level security;
alter table site_config enable row level security;

-- Policies públicas para leitura de categories e products
create policy "categories_public_read" on categories for select using (is_active = true);
create policy "products_public_read" on products for select using (is_active = true and deleted_at is null);

-- ─────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('product-covers', 'product-covers', true),
  ('product-previews', 'product-previews', true),
  ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- Policy: leitura pública dos buckets públicos
create policy "public_covers_read" on storage.objects
  for select using (bucket_id = 'product-covers');

create policy "public_previews_read" on storage.objects
  for select using (bucket_id = 'product-previews');
