-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION: Corrige a função is_admin() — BUG CRÍTICO
-- ---------------------------------------------------------------
-- Problema:
--   A implementação original lia `raw_app_meta_data->>'role'` da
--   tabela `auth.users`. Porém, nenhuma parte da aplicação escreve
--   nesse campo — o papel do usuário é gravado APENAS em
--   `profiles.role` (pelo register-user, create-admin e admin-users).
--
--   Consequência: TODAS as políticas RLS que chamam is_admin()
--   retornavam false mesmo para admins reais, bloqueando:
--     • Escrita em produtos, categorias, orders via frontend
--     • Upload/download de arquivos no Storage
--     • Leitura de webhook_events no painel admin
--
-- Solução:
--   Ler profiles.role em vez de auth.users.raw_app_meta_data.
--   A função usa SECURITY DEFINER para evitar recursão infinita:
--   sem SECURITY DEFINER, ao avaliar a policy "profiles_admin_all"
--   o Postgres chamaria is_admin() que tentaria ler profiles, que
--   acionaria a mesma policy — deadlock de RLS.
--   Com SECURITY DEFINER a função executa como o dono (postgres),
--   que ignora RLS e lê profiles diretamente.
-- ═══════════════════════════════════════════════════════════════════

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

comment on function is_admin() is
  'Retorna true se o usuário autenticado tem role = ADMIN em profiles. '
  'Usada por todas as políticas RLS de escrita. '
  'SECURITY DEFINER evita recursão ao ser chamada dentro de policies da própria tabela profiles.';

-- ─── Verificação de sanidade ─────────────────────────────────────
-- Garante que a função existe e tem as flags corretas antes de continuar.
do $$
declare
  fn_exists bool;
begin
  select exists(
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) into fn_exists;

  if not fn_exists then
    raise exception '[MIGRATION] Falha ao criar is_admin() — função não encontrada após CREATE OR REPLACE';
  end if;
end;
$$;
