# Pedago Shop — Migração Supabase → Appwrite (Documentação Completa)

> Última atualização: 2026-05-31
> Status: **Migração completa e funcional**

---

## 1. Visão Geral

E-commerce de atividades pedagógicas digitais (PDFs). Migrado integralmente de
Supabase (Auth + PostgreSQL + Storage + Edge Functions) para Appwrite
self-hosted, preservando todos os usuários (com senhas), dados, arquivos e
funcionalidades.

**Stack:**
- Frontend: Vue 3 + Vite + Pinia + Vue Router + TailwindCSS (`apps/web/`)
- Backend: Appwrite 1.7.4 (self-hosted via Coolify)
- SDK Web: `appwrite@18.2.0` (alinhado ao servidor 1.7.x)
- Functions: Node.js 20 (`appwrite/functions/`)
- Scripts: `node-appwrite@13` (`scripts/`)
- Pagamento: Mercado Pago (PIX + Cartão de Crédito)
- Notificações: Telegram Bot

---

## 2. Infraestrutura Appwrite

| Item | Valor |
|------|-------|
| Endpoint (produção) | `https://appwrite.wsgestao.digital/v1` |
| Endpoint (dev, via proxy Vite) | `http://localhost:5173/v1` |
| Project ID | `6a1bc2b1000d09c3f5f1` |
| Project Name | `site pedego` |
| Database ID | `pedago-db` |
| Server IP | `207.244.250.180` |

> ⚠️ O projeto Appwrite foi **reinstalado** durante a migração. O ID antigo
> (`6a1af05e0030b967a508`) está obsoleto. Sempre use `6a1bc2b1000d09c3f5f1`.

### Coleções (Database `pedago-db`)

| Coleção | Permissões | Descrição |
|---------|-----------|-----------|
| `profiles` | read(any), create(users), update/delete(label:admin) | Perfil do usuário (role, phone, etc.) |
| `categories` | read(any), create/update/delete(label:admin) | Categorias de produtos |
| `products` | read(any), create/update/delete(label:admin) | Produtos (PDFs) |
| `orders` | read/update/delete(label:admin), create(users) + doc-level user | Pedidos |
| `order_items` | read/update/delete(label:admin) + doc-level user | Itens de cada pedido |
| `download_tokens` | read/update/delete(label:admin) + doc-level user | Tokens de download |
| `site_config` | read(any), create/update(label:admin) | Configuração global da loja |
| `webhook_events` | read/update(label:admin) | Log de webhooks (idempotência MP) |

Todas com `documentSecurity = true` — permissões a nível de documento garantem
que cada cliente só vê os próprios pedidos/itens/tokens.

### Storage Buckets

| Bucket | Acesso | Uso |
|--------|--------|-----|
| `product-files` | privado (read: users) | PDFs entregues após compra |
| `product-covers` | público (read: any) | Capas de produtos, logo, banners |

### Auth Labels

Usuários têm labels que controlam permissões:
- `admin` → acesso ao painel administrativo (role ADMIN no profile)
- `customer` → cliente normal (role CUSTOMER)

Sincronizados a partir do `profiles.role` via `scripts/sync-user-labels.mjs`.
O `fetchMe()` no frontend também busca o profile por email como fallback (para
usuários OAuth que recebem novo ID).

---

## 3. Appwrite Functions (8)

Todas em `appwrite/functions/<nome>/src/main.js`, runtime `node-20.0`.
Variáveis de ambiente configuradas via Console ou `scripts/set-function-vars.mjs`.

| Function | execute | Descrição |
|----------|---------|-----------|
| `register-user` | any | Cria usuário Auth + profile (com rollback se profile falhar) |
| `create-order` | users | Cria pedido, integra MP (PIX/cartão), gera QR, notifica Telegram |
| `mp-webhook` | **any** | Recebe notificações do Mercado Pago (idempotente) |
| `download` | users | Valida token e entrega o arquivo/link |
| `admin-users` | users | Lista usuários (admin) com paginação |
| `create-admin` | users | Cria primeiro admin (checa se já existe) |
| `recent-purchases` | **any** | Compras recentes para a home (com fallback sample) |
| `reconcile-orders` | users | Reconcilia pedidos pendentes com o MP (cron `0 */6 * * *`) |

> `mp-webhook` e `recent-purchases` precisam ser `execute=any` — o primeiro é
> chamado pelo servidor do Mercado Pago (sem sessão), o segundo via fetch sem auth.

### Variáveis de ambiente das functions

```
APPWRITE_ENDPOINT            = https://appwrite.wsgestao.digital/v1
APPWRITE_FUNCTION_PROJECT_ID = (auto-set pelo runtime)
APPWRITE_API_KEY             = <chave com todos os escopos>
APPWRITE_DATABASE_ID         = pedago-db
FRONTEND_URL                 = http://localhost:5173  (⚠️ trocar p/ domínio em prod)
MERCADO_PAGO_ACCESS_TOKEN    = <fallback; principal vem do site_config>
MERCADO_PAGO_WEBHOOK_SECRET  = <validação de assinatura>
```

> As credenciais do Mercado Pago são lidas primariamente do `site_config`
> (documento `global`), então atualizar pela tela de Integrações tem efeito
> imediato sem precisar redeployar.

---

## 4. Padrão de retorno do `create-order`

O frontend (`CheckoutView.vue`) espera um objeto `payment` plano:

```js
payment: {
  qrCode,          // PIX copia-e-cola
  qrCodeBase64,    // imagem do QR (base64)
  initPoint,       // URL checkout cartão
  sandboxInitPoint,
  id,              // payment/preference ID do MP
  status,
}
```

> ⚠️ Não retornar o `mpResult` cru — ele aninha o QR em
> `point_of_interaction.transaction_data.*` e o frontend não acha.

---

## 5. Migração de Dados (concluída)

Scripts em `scripts/`, configurados via `scripts/.env.migration`.

| Etapa | Script | Resultado |
|-------|--------|-----------|
| Provisionar estrutura | `provision-appwrite.mjs` | 8 coleções + bucket criados |
| Migrar usuários | `migrate-users.mjs` | 1.580 usuários (senhas bcrypt preservadas) |
| Migrar banco | `migrate-db.mjs` | 7 cats, 115 produtos, 1.660 pedidos, 1.948 items, 1.922 tokens, 2 configs |
| Migrar storage | `migrate-storage.mjs` | 121 PDFs |
| Deploy functions | `deploy-functions.mjs` | 8 functions (faz `npm install` antes de empacotar) |

### Scripts pós-migração (correções)

| Script | O que faz |
|--------|-----------|
| `sync-user-labels.mjs` | Aplica labels admin/customer + telefone E.164 no Auth |
| `sync-user-ids.mjs` | Sincroniza userId quando OAuth gera ID novo (casa por email) |
| `fix-permissions.mjs` | Adiciona permissões doc-level (admin + dono) em orders/items/tokens |
| `set-function-vars.mjs` | Configura variáveis de ambiente das 8 functions |

> **Importante:** Usuários OAuth (Google) recebem um **novo ID** no Appwrite ao
> logar. O `fetchMe()` detecta isso, busca o profile por email e sincroniza o
> `userId`. Pedidos antigos já têm o ID correto pois foram migrados com o mesmo
> UUID do Supabase.

---

## 6. Configurações Externas (manuais)

### Google OAuth
1. **Appwrite Console → Auth → OAuth2 → Google:** habilitar + Client ID/Secret
2. **Google Cloud Console → Credenciais → URIs de redirecionamento:**
   ```
   https://appwrite.wsgestao.digital/v1/account/sessions/oauth2/callback/google/6a1bc2b1000d09c3f5f1
   ```
3. Frontend usa `account.createOAuth2Token()` (não Session) — funciona
   cross-domain. O callback troca `userId+secret` da URL por sessão.

### Plataformas Web (CORS)
**Appwrite Console → Overview → Platforms → Add Web:**
- `localhost` (dev)
- domínio de produção (quando hospedar)

> Em dev usamos proxy no Vite (`/v1` → appwrite), então CORS não bloqueia.

### Mercado Pago
- Webhook URL: `https://appwrite.wsgestao.digital/v1/functions/mp-webhook/executions`
- Configurado na tela de Integrações; credenciais salvas no `site_config`.

---

## 7. QA — 60+ Bugs Corrigidos (3 rodadas)

### Críticos
- `ResetPasswordView`: `updateRecovery` com assinatura errada (reset nunca funcionava)
- `create-order`: faltava `userId` na chamada → bloqueava todo checkout
- `create-order`: `mpStatus` numérico quebrava o save (coerção p/ String + truncate 50)
- `create-order`: sem detecção de erro do MP → criava pedido quebrado
- **`products`/`categories`/`site_config` sem permissão `create`** → admin não cadastrava nada
- `mp-webhook`: sem idempotência (tokens duplicados em retry) + sem `execute=any`
- `mp-webhook`: `JSON.parse` sem try/catch
- `create-admin`: checava só 25 profiles → permitia 2º admin
- `CheckoutSuccessView`: IDOR (qualquer user via outro pedido) + `router` não importado
- `download`: usava `res.redirect()` (não existe no SDK) → retorna `{redirectUrl}`

### Altos
- `auth.store`: `fetchMe().catch()` silencioso → todo login ia p/ phone-required
- `auth.store`: `functions.createExecution` com objeto em vez de args posicionais
- `create-order`: token MP lido de env em vez de `site_config`
- `create-order`: Telegram usava `telegramChatId` em vez de `telegramRecipients[]`
- `create-order`: `mpPaymentId` = `mpPreferenceId` (webhook não achava pedidos cartão)
- **`create-order`: retorno cru do MP → QR code não renderizava** (normalizado)
- `recent-purchases`: `execute=users` mas chamado via fetch sem sessão → 401
- `router`: phone-guard bloqueava páginas públicas (escopado a requiresAuth)
- `RegisterView`: open redirect via query param
- `admin/OrdersView`: `Query.contains` (quebrado em string) → `Query.startsWith`
- `customer/OrdersView`: só mostrava PAID → mostra todos os status
- `DownloadsView`: limite padrão 25 → `Query.limit(500)`; botão sem checar maxDownloads
- `reconcile-orders`: cap de 100 → paginação completa
- `register-user`/`create-admin`: rollback de usuário órfão se profile falhar

### Médios/Baixos
- Imagens em bucket privado → bucket público `product-covers`
- Cart sem persistência → localStorage
- `cardInitPoint` não restaurado do sessionStorage no retorno do MP
- `recent-purchases`: `customerName.split` sem null-safety
- `HomeView`: `paidAt` sem null-safety; parse de `{purchases:[]}` em vez de array
- `ProductView`: removido `v-html` (XSS) + null-guard no `buyNow`
- `CatalogView`: estado de erro no fetch
- SDK v25 (p/ 1.9.5) → v18.2.0 (alinhado ao servidor 1.7.4) — elimina warnings

---

## 8. Comandos Úteis

```bash
# Rodar localmente (dev, com proxy CORS)
cd "apps/web" && pnpm dev          # ou: pnpm dev na raiz
# → http://localhost:5173  |  rede: http://192.168.15.5:5173

# Build de produção
pnpm build

# Deploy de todas as functions (faz npm install + empacota + deploy)
cd scripts && node deploy-functions.mjs

# Atualizar variáveis das functions
cd scripts && node set-function-vars.mjs

# Limpar cache do Vite (após trocar dependências)
rm -rf apps/web/node_modules/.vite

# Expor para acesso externo (rede diferente)
cloudflared tunnel --url http://localhost:5173
```

---

## 9. Estado Atual Verificado

| Item | Status |
|------|--------|
| Auth email/senha | ✅ |
| Google OAuth (cross-domain) | ✅ |
| Pagamento PIX (QR gerando) | ✅ testado HTTP 200 |
| Cadastro produtos/categorias | ✅ permissão create adicionada |
| Downloads (1.479 pedidos PAID, 1.922 tokens) | ✅ 0 items sem token |
| Dashboard admin com dados | ✅ |
| SDK alinhado (sem warnings) | ✅ v18.2.0 |
| TypeScript | ✅ 0 erros |

---

## 10. Pendências para Produção

1. **`FRONTEND_URL`** das functions ainda é `localhost:5173` → trocar p/ domínio
   real e rodar `set-function-vars.mjs`.
2. **`.env.production`** do frontend → garantir endpoint HTTPS direto (sem proxy).
3. **Plataforma Web** de produção no Appwrite Console (CORS).
4. **Redirect URI** de produção no Google Cloud Console.
5. Testar fluxo completo de cartão de crédito com retorno do MP.
6. Após validação total, deletar diretório `supabase/` (referência).
