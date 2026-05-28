-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Seed da configuração inicial do site
-- ---------------------------------------------------------------
-- Contexto:
--   Todas as Edge Functions (create-order, mp-webhook, reconcile-orders)
--   e o store Vue (site-config.store.ts) consultam:
--     SELECT value FROM site_config WHERE key = 'global'
--
--   Sem esta linha, a loja arranca sem configuração: nenhuma cor,
--   sem nome de loja, e todas as integrações retornam undefined —
--   causando falha silenciosa nas notificações Telegram e nos
--   pagamentos Mercado Pago.
--
--   ON CONFLICT DO NOTHING garante idempotência:
--   em produção (onde o admin já salvou as configs pelo painel)
--   esta linha não sobrescreve nada.
-- ═══════════════════════════════════════════════════════════════════

insert into site_config (key, value, updated_at)
values (
  'global',
  jsonb_build_object(
    -- ── Identidade ────────────────────────────────────────────────
    'storeName',            'Pedago Shop',
    'storeDescription',     'Materiais pedagógicos digitais de qualidade para professores e educadores',
    'logoUrl',              null,
    'faviconUrl',           null,

    -- ── Cores ─────────────────────────────────────────────────────
    'primaryColor',         '#7C3AED',
    'secondaryColor',       '#EC4899',
    'accentColor',          '#F59E0B',

    -- ── Banner principal ──────────────────────────────────────────
    'bannerEnabled',        false,
    'bannerImageUrl',       null,
    'bannerTitle',          'Materiais Pedagógicos de Qualidade',
    'bannerSubtitle',       'Recursos educacionais digitais para professores e educadores',
    'bannerCtaText',        'Ver Catálogo',
    'bannerCtaLink',        '/catalogo',

    -- ── Carousel de banners ───────────────────────────────────────
    'banners',              '[]'::jsonb,

    -- ── Destaques ─────────────────────────────────────────────────
    'highlightedProductIds',   '[]'::jsonb,
    'highlightedCategoryIds',  '[]'::jsonb,

    -- ── Barra de anúncio ──────────────────────────────────────────
    'announcementBarText',  null,
    'announcementBarColor', '#7C3AED',

    -- ── Rodapé e social ───────────────────────────────────────────
    'footerText',           '© 2025 Pedago Shop. Todos os direitos reservados.',
    'socialLinks',          jsonb_build_object(
                              'instagram', null,
                              'whatsapp',  null,
                              'facebook',  null,
                              'youtube',   null,
                              'tiktok',    null
                            ),

    -- ── SEO ───────────────────────────────────────────────────────
    'seoTitle',             'Pedago Shop — Materiais Pedagógicos Digitais',
    'seoDescription',       'Encontre atividades, planos de aula e materiais pedagógicos digitais de alta qualidade.',

    -- ── PIX ───────────────────────────────────────────────────────
    'pixMessage',           'Pague com PIX e receba o acesso instantaneamente!',

    -- ── Sistema ───────────────────────────────────────────────────
    'maintenanceMode',      false,

    -- ── Integrações (preenchidas pelo painel /admin/integracoes) ──
    -- Esses campos são null por padrão e NUNCA devem ser expostos
    -- ao frontend não-admin (a RLS de site_config é pública para
    -- leitura — o admin deve filtrar esses campos no frontend).
    'mercadoPagoAccessToken',    null,
    'mercadoPagoWebhookSecret',  null,
    'mercadoPagoPixKey',         null,
    'telegramBotToken',          null,
    'telegramRecipients',        '[]'::jsonb
  ),
  now()
)
on conflict (key) do nothing;

-- ─── Verificação de sanidade ─────────────────────────────────────
do $$
declare
  cfg_exists bool;
begin
  select exists(
    select 1 from site_config where key = 'global'
  ) into cfg_exists;

  if not cfg_exists then
    raise exception '[MIGRATION] Falha ao inserir site_config global — linha não encontrada após INSERT';
  end if;
end;
$$;
