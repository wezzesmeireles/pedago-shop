-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Adiciona delivery_link e updated_at em download_tokens
-- ---------------------------------------------------------------
-- Contexto:
--   Quando um pedido é confirmado (mp-webhook, reconcile-orders,
--   create-order para produtos gratuitos), os tokens são criados
--   com o campo `delivery_link` copiado do produto.
--
--   A Edge Function download verifica esse campo:
--     • Se delivery_link IS NOT NULL → retorna redirect 302 para a URL
--     • Se delivery_link IS NULL     → gera signed URL do Storage (PDF)
--
--   Esse campo estava ausente da tabela download_tokens, causando erro
--   silencioso: os tokens de produtos 'link' eram criados sem o link,
--   e a tentativa de download retornava "Arquivo não encontrado".
--
--   updated_at é adicionado para rastreabilidade (ex.: quando o token
--   foi revogado ou teve o download_count incrementado).
-- ═══════════════════════════════════════════════════════════════════

-- ─── delivery_link ───────────────────────────────────────────────
alter table download_tokens
  add column if not exists delivery_link text;

comment on column download_tokens.delivery_link is
  'URL de entrega externa, copiada de products.delivery_link no momento da criação do token. '
  'Se preenchido, a Edge Function download faz redirect 302 em vez de servir PDF do Storage.';

-- ─── updated_at ──────────────────────────────────────────────────
alter table download_tokens
  add column if not exists updated_at timestamptz not null default now();

comment on column download_tokens.updated_at is
  'Atualizado automaticamente pelo trigger tr_download_tokens_updated_at '
  '(criado na migration add_updated_at_triggers).';
