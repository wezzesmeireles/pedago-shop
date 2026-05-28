-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Adiciona campos de entrega nos produtos
-- ---------------------------------------------------------------
-- Contexto:
--   As Edge Functions create-order, mp-webhook e reconcile-orders
--   consultam `products.delivery_type` e `products.delivery_link`
--   para determinar como entregar o conteúdo após pagamento.
--   Esses campos estavam ausentes do schema original.
--
--   Também são adicionados youtube_url e instagram_url, usados pela
--   view de detalhe do produto para embeds de mídia.
-- ═══════════════════════════════════════════════════════════════════

-- ─── delivery_type ───────────────────────────────────────────────
-- 'pdf'  → arquivo armazenado no bucket product-files (Supabase Storage)
-- 'link' → URL externa (Google Drive, Hotmart, etc.)
alter table products
  add column if not exists delivery_type text not null default 'pdf'
    check (delivery_type in ('pdf', 'link'));

comment on column products.delivery_type is
  'Modo de entrega do produto: pdf = arquivo no Storage; link = URL externa';

-- ─── delivery_link ───────────────────────────────────────────────
-- Preenchido apenas quando delivery_type = 'link'.
-- Armazenado também em download_tokens.delivery_link no momento
-- da criação do token, para que a Edge Function download possa
-- fazer redirect sem precisar re-consultar o produto.
alter table products
  add column if not exists delivery_link text;

comment on column products.delivery_link is
  'URL de entrega para produtos com delivery_type = ''link'' (ex.: Google Drive, Hotmart)';

-- ─── youtube_url ─────────────────────────────────────────────────
-- URL completa do vídeo (ex.: https://www.youtube.com/watch?v=...)
-- Exibida como player embed na página de detalhe do produto.
alter table products
  add column if not exists youtube_url text;

comment on column products.youtube_url is
  'URL do vídeo YouTube exibido como embed na página do produto';

-- ─── instagram_url ───────────────────────────────────────────────
-- URL do post/reels do Instagram para embed na página do produto.
alter table products
  add column if not exists instagram_url text;

comment on column products.instagram_url is
  'URL do post/reels Instagram exibido na página do produto';

-- ─── Constraint de integridade ───────────────────────────────────
-- Garante que produtos do tipo 'link' sempre tenham a URL preenchida.
-- Aplicada com DEFERRABLE para não bloquear atualizações parciais.
alter table products
  drop constraint if exists chk_products_delivery_link_required;

alter table products
  add constraint chk_products_delivery_link_required
    check (
      delivery_type = 'pdf'
      or (delivery_type = 'link' and delivery_link is not null and delivery_link <> '')
    )
    deferrable initially deferred;
