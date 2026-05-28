-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Triggers para atualização automática de updated_at
-- ---------------------------------------------------------------
-- Contexto:
--   As tabelas têm coluna updated_at mas ela era atualizada apenas
--   manualmente pelas Edge Functions (ex.: `updated_at: new Date().toISOString()`).
--   Isso é frágil: qualquer UPDATE que esqueça de incluir updated_at
--   deixa o campo desatualizado.
--
--   Esta migration cria uma função genérica e triggers BEFORE UPDATE
--   em todas as tabelas com updated_at, garantindo que o campo seja
--   sempre atualizado pelo banco, independente do cliente.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Função genérica ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function set_updated_at() is
  'Trigger function genérica: atualiza updated_at para now() em qualquer UPDATE. '
  'Usada por todas as tabelas com coluna updated_at.';

-- ─── profiles ────────────────────────────────────────────────────
drop trigger if exists tr_profiles_updated_at on profiles;
create trigger tr_profiles_updated_at
  before update on profiles
  for each row
  execute function set_updated_at();

-- ─── categories ──────────────────────────────────────────────────
drop trigger if exists tr_categories_updated_at on categories;
create trigger tr_categories_updated_at
  before update on categories
  for each row
  execute function set_updated_at();

-- ─── products ────────────────────────────────────────────────────
drop trigger if exists tr_products_updated_at on products;
create trigger tr_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- ─── orders ──────────────────────────────────────────────────────
-- Nota: as Edge Functions também definem updated_at manualmente
-- (ex.: `updated_at: new Date().toISOString()`). O trigger não
-- conflita com isso — simplesmente sobrescreve com now(), que é
-- o mesmo resultado.
drop trigger if exists tr_orders_updated_at on orders;
create trigger tr_orders_updated_at
  before update on orders
  for each row
  execute function set_updated_at();

-- ─── site_config ─────────────────────────────────────────────────
drop trigger if exists tr_site_config_updated_at on site_config;
create trigger tr_site_config_updated_at
  before update on site_config
  for each row
  execute function set_updated_at();

-- ─── download_tokens ─────────────────────────────────────────────
-- A coluna updated_at foi adicionada pela migration
-- 20260516_add_download_token_delivery_link.sql
drop trigger if exists tr_download_tokens_updated_at on download_tokens;
create trigger tr_download_tokens_updated_at
  before update on download_tokens
  for each row
  execute function set_updated_at();
