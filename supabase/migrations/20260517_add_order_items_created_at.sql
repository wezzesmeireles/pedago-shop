-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Adiciona created_at em order_items
-- ---------------------------------------------------------------
-- Contexto:
--   A tabela order_items foi criada sem timestamp de criação,
--   dificultando auditoria e ordenação dos itens.
--   O campo é adicionado com default now() — linhas existentes
--   receberão o momento desta migration como valor.
-- ═══════════════════════════════════════════════════════════════════

alter table order_items
  add column if not exists created_at timestamptz not null default now();

comment on column order_items.created_at is
  'Data de criação do item. Linhas anteriores a esta migration '
  'receberam a data de execução da migration como valor.';
