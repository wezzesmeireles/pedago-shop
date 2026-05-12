-- Cria a categoria "Grátis" se ainda não existir
INSERT INTO categories (name, slug, description, is_active, sort_order)
VALUES (
  'Grátis',
  'gratis',
  'Atividades e materiais pedagógicos disponíveis gratuitamente.',
  true,
  0
)
ON CONFLICT (slug) DO NOTHING;
