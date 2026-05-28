# Documentação Técnica Completa — Pedago Shop

> Última atualização: maio de 2026

---

## Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Estrutura de Diretórios](#2-estrutura-de-diretórios)
3. [Tecnologias e Dependências](#3-tecnologias-e-dependências)
4. [Arquitetura do Sistema](#4-arquitetura-do-sistema)
5. [Frontend — Aplicação Web](#5-frontend--aplicação-web)
   - 5.1 [Entry Point e Configuração](#51-entry-point-e-configuração)
   - 5.2 [Roteamento](#52-roteamento)
   - 5.3 [Stores (Pinia)](#53-stores-pinia)
   - 5.4 [Composables](#54-composables)
   - 5.5 [Serviços](#55-serviços)
   - 5.6 [Componentes UI](#56-componentes-ui)
   - 5.7 [Componentes de Catálogo](#57-componentes-de-catálogo)
   - 5.8 [Layouts](#58-layouts)
   - 5.9 [Views Públicas](#59-views-públicas)
   - 5.10 [Views de Autenticação](#510-views-de-autenticação)
   - 5.11 [Views do Cliente](#511-views-do-cliente)
   - 5.12 [Views do Admin](#512-views-do-admin)
6. [Backend — Supabase Edge Functions](#6-backend--supabase-edge-functions)
   - 6.1 [create-order](#61-create-order)
   - 6.2 [mp-webhook](#62-mp-webhook)
   - 6.3 [download](#63-download)
   - 6.4 [register-user](#64-register-user)
   - 6.5 [reconcile-orders](#65-reconcile-orders)
   - 6.6 [create-admin](#66-create-admin)
   - 6.7 [admin-users](#67-admin-users)
   - 6.8 [recent-purchases](#68-recent-purchases)
7. [Banco de Dados](#7-banco-de-dados)
8. [Pacote Compartilhado (shared)](#8-pacote-compartilhado-shared)
9. [Fluxos de Negócio](#9-fluxos-de-negócio)
   - 9.1 [Fluxo de Compra](#91-fluxo-de-compra)
   - 9.2 [Fluxo de Registro de Usuário](#92-fluxo-de-registro-de-usuário)
   - 9.3 [Fluxo de Download](#93-fluxo-de-download)
   - 9.4 [Fluxo de Reconciliação de Pagamento](#94-fluxo-de-reconciliação-de-pagamento)
10. [Integração com Mercado Pago](#10-integração-com-mercado-pago)
11. [Integração com Telegram](#11-integração-com-telegram)
12. [Configuração do Site (Personalização)](#12-configuração-do-site-personalização)
13. [Autenticação e Autorização](#13-autenticação-e-autorização)
14. [Armazenamento de Arquivos](#14-armazenamento-de-arquivos)
15. [Estilização e Design](#15-estilização-e-design)
16. [Variáveis de Ambiente](#16-variáveis-de-ambiente)
17. [Deploy e Infraestrutura](#17-deploy-e-infraestrutura)
18. [Open Graph — API de Imagem](#18-open-graph--api-de-imagem)
19. [Limitações Conhecidas](#19-limitações-conhecidas)
20. [Guia de Contribuição e Padrões de Código](#20-guia-de-contribuição-e-padrões-de-código)

---

## 1. Visão Geral do Projeto

**Pedago Shop** é uma plataforma de e-commerce especializada em produtos pedagógicos digitais. Permite a venda de arquivos PDF e links de entrega direta (ex.: Google Drive, Hotmart), com painel administrativo completo, sistema de pagamento via Mercado Pago (PIX e cartão de crédito), notificações via Telegram e download seguro de arquivos após confirmação de pagamento.

**Características principais:**

| Característica | Detalhe |
|---|---|
| Tipo de produto | Digital (PDF + link externo) |
| Gateway de pagamento | Mercado Pago (PIX e Crédito) |
| Autenticação | Supabase Auth (email/senha + Google OAuth) |
| Banco de dados | PostgreSQL via Supabase |
| Armazenamento | Supabase Storage (3 buckets) |
| Notificações | Bot do Telegram |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Monorepo | pnpm Workspaces |

---

## 2. Estrutura de Diretórios

```
pedago-shop/
│
├── apps/
│   └── web/                            # Aplicação Vue 3
│       ├── src/
│       │   ├── App.vue                 # Componente raiz
│       │   ├── main.ts                 # Bootstrap da aplicação
│       │   ├── env.d.ts                # Tipos de variáveis de ambiente
│       │   ├── assets/
│       │   │   └── main.css            # Estilos globais + variáveis CSS
│       │   ├── lib/
│       │   │   └── supabase.ts         # Instância do cliente Supabase
│       │   ├── router/
│       │   │   └── index.ts            # Rotas + guards de navegação
│       │   ├── stores/
│       │   │   ├── auth.store.ts       # Estado de autenticação e perfil
│       │   │   ├── cart.store.ts       # Carrinho de compras
│       │   │   ├── catalog.store.ts    # Produtos e categorias
│       │   │   └── site-config.store.ts# Configuração global do site
│       │   ├── services/
│       │   │   └── api.ts              # Wrapper para Edge Functions
│       │   ├── composables/
│       │   │   └── useConfetti.ts      # Animação de confetes
│       │   ├── components/
│       │   │   ├── ui/                 # Componentes genéricos reutilizáveis
│       │   │   ├── layout/             # Wrappers de layout
│       │   │   └── catalog/            # Componentes de produto
│       │   └── views/
│       │       ├── public/             # Páginas públicas
│       │       ├── auth/               # Páginas de autenticação
│       │       ├── customer/           # Área do cliente (autenticado)
│       │       └── admin/              # Painel administrativo
│       ├── public/
│       │   └── robots.txt
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── nginx.conf                  # Configuração Nginx para Docker
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                         # Código compartilhado (enums, tipos)
│       ├── src/
│       │   ├── index.ts
│       │   ├── enums/
│       │   │   ├── order-status.enum.ts
│       │   │   ├── payment-method.enum.ts
│       │   │   └── user-role.enum.ts
│       │   └── types/
│       │       └── site-config.types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/
│   ├── config.toml                     # Configuração Supabase CLI
│   ├── functions/                      # Edge Functions (Deno)
│   │   ├── create-order/index.ts
│   │   ├── mp-webhook/index.ts
│   │   ├── download/index.ts
│   │   ├── register-user/index.ts
│   │   ├── reconcile-orders/index.ts
│   │   ├── create-admin/index.ts
│   │   ├── admin-users/index.ts
│   │   └── recent-purchases/index.ts
│   └── migrations/                     # Migrações SQL do banco
│
├── api/
│   └── og.ts                           # Geração de imagem Open Graph (Vercel)
│
├── .github/
│   └── workflows/
│       └── deploy-functions.yml        # CI/CD para Edge Functions
│
├── supabase-schema.sql                 # Schema informativo (pode estar desatualizado)
├── pnpm-workspace.yaml
├── package.json                        # Raiz do monorepo
├── vercel.json                         # Configuração de deploy Vercel
└── AI_SYSTEM_CONTEXT.md               # Documentação de contexto para IA
```

---

## 3. Tecnologias e Dependências

### Frontend (`apps/web`)

| Pacote | Versão | Função |
|---|---|---|
| `vue` | ^3.4.31 | Framework reativo principal |
| `vite` | ^5.3.3 | Bundler e dev server |
| `typescript` | ^5.4.5 | Tipagem estática |
| `tailwindcss` | ^3.4.4 | Estilização utilitária |
| `pinia` | ^2.2.0 | Gerenciamento de estado |
| `vue-router` | ^4.4.0 | Roteamento client-side |
| `@supabase/supabase-js` | ^2.45.4 | Cliente do Supabase (auth, db, storage, realtime) |
| `@vueuse/core` | ^10.11.0 | Composables utilitários do Vue |
| `@vueuse/head` | ^2.0.0 | Gerenciamento do `<head>` HTML |
| `canvas-confetti` | ^1.9.4 | Animação de confetes |
| `uuid` | ^9.0.1 | Geração de UUIDs |
| `vue-hcaptcha` | ^0.1.1 | Widget hCaptcha |
| `@tailwindcss/forms` | ^0.5.7 | Estilos para formulários |
| `@tailwindcss/typography` | ^0.5.13 | Estilos para conteúdo rich text |
| `@sitepedagogico/shared` | workspace:* | Tipos e enums compartilhados |

### Backend (Supabase Edge Functions)

- **Runtime:** Deno (TypeScript)
- **Banco de dados:** PostgreSQL (via Supabase)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage

---

## 4. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUÁRIO (Browser)                        │
│                     Vue 3 SPA (Vercel CDN)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                   ┌─────────▼──────────┐
                   │   Supabase Platform │
                   │                     │
                   │  ┌───────────────┐  │
                   │  │  Auth (JWT)   │  │
                   │  └───────────────┘  │
                   │  ┌───────────────┐  │
                   │  │  PostgreSQL   │  │
                   │  │  (RLS + Triggers)│
                   │  └───────────────┘  │
                   │  ┌───────────────┐  │
                   │  │   Storage     │  │
                   │  │ (3 buckets)   │  │
                   │  └───────────────┘  │
                   │  ┌───────────────┐  │
                   │  │ Edge Functions│  │
                   │  │   (Deno)      │  │
                   │  └───────┬───────┘  │
                   └──────────┼──────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼──────────┐       ┌────────────▼──────────┐
    │   Mercado Pago API  │       │    Telegram Bot API   │
    │  (PIX + Crédito)   │       │  (notificações admin) │
    └────────────────────┘       └───────────────────────┘
```

O frontend é uma SPA (Single Page Application) hospedada na Vercel. Todo o backend é servido pelas Edge Functions do Supabase, que executam Deno e têm acesso privilegiado ao banco de dados via `service_role`. O banco de dados usa Row Level Security (RLS) para controle de acesso, e as Edge Functions usam `service_role` para contornar RLS quando necessário (ex.: confirmação de pagamento).

---

## 5. Frontend — Aplicação Web

### 5.1 Entry Point e Configuração

**`apps/web/src/main.ts`**

Bootstrap da aplicação Vue. Registra os plugins:

- `createPinia()` — estado global
- `router` — navegação SPA
- `createHead()` — gerenciamento de `<head>` via `@vueuse/head`

Monta o componente `App` no elemento `#app` do `index.html`.

---

**`apps/web/src/App.vue`**

Componente raiz. Contém apenas `<RouterView />` e inicializa as stores ao montar:

- `authStore.initialize()` — carrega sessão salva
- `siteConfigStore.loadConfig()` — aplica temas e configurações globais
- `catalogStore.loadCatalog()` — pré-carrega categorias e produtos em destaque

---

**`apps/web/src/lib/supabase.ts`**

Exporta a instância singleton do cliente Supabase, configurada com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

---

**`apps/web/vite.config.ts`**

Configura o Vite com o plugin `@vitejs/plugin-vue`. Define alias `@` para `src/`. Configura `optimizeDeps` para incluir `@supabase/supabase-js`.

---

**`apps/web/tailwind.config.ts`**

Estende o tema padrão do Tailwind com:

- Cores customizadas usando `var(--color-primary-*)` (CSS custom properties)
- Breakpoint `xs: 400px`
- Border radius: `2xl: 1rem`, `3xl: 1.5rem`
- Animações customizadas: `fade-in`, `slide-in`, `slide-down`, `bounce-in`, `shimmer`, `ping`
- Plugins: `@tailwindcss/forms`, `@tailwindcss/typography`

---

### 5.2 Roteamento

**`apps/web/src/router/index.ts`**

O router usa `createWebHistory`. As rotas estão divididas em 5 grupos:

#### Rotas Públicas (layout: `PublicLayout`)

| Path | Componente | Descrição |
|---|---|---|
| `/` | `HomeView` | Página inicial com banner e produtos em destaque |
| `/catalogo` | `CatalogView` | Catálogo com filtro por categoria e busca |
| `/produto/:slug` | `ProductView` | Página de detalhe de produto |
| `/checkout` | `CheckoutView` | Fluxo de pagamento (protegido: requer auth) |
| `/checkout/sucesso` | `CheckoutSuccessView` | Confirmação de pagamento com downloads |
| `/checkout/falha` | `CheckoutFailureView` | Pagamento cancelado/recusado |
| `/sobre` | `AboutView` | Sobre a loja |
| `/contato` | `ContactView` | Formulário de contato |
| `/privacidade` | `PrivacyView` | Política de privacidade |

#### Rotas de Autenticação (layout: `AuthLayout`)

| Path | Componente | Descrição |
|---|---|---|
| `/auth/login` | `LoginView` | Login por email/senha + Google OAuth |
| `/auth/registro` | `RegisterView` | Cadastro de novo usuário |
| `/auth/esqueci-senha` | `ForgotPasswordView` | Envio de e-mail de recuperação |
| `/auth/redefinir-senha` | `ResetPasswordView` | Formulário de nova senha |
| `/auth/google-callback` | `GoogleCallbackView` | Retorno do OAuth do Google |
| `/auth/telefone-obrigatorio` | `PhoneRequiredView` | Coleta de telefone obrigatório |

#### Login do Admin

| Path | Componente | Descrição |
|---|---|---|
| `/admin/login` | `AdminLoginView` | Login exclusivo do administrador |

#### Área do Cliente (layout: `CustomerLayout`, requer auth)

| Path | Componente | Descrição |
|---|---|---|
| `/minha-conta/pedidos` | `CustomerOrdersView` | Histórico de pedidos |
| `/minha-conta/downloads` | `CustomerDownloadsView` | Tokens de download |

#### Painel Admin (layout: `AdminLayout`, requer auth + role ADMIN)

| Path | Componente | Descrição |
|---|---|---|
| `/admin` | `AdminDashboardView` | KPIs e visão geral |
| `/admin/produtos` | `AdminProductsView` | CRUD de produtos |
| `/admin/categorias` | `AdminCategoriesView` | CRUD de categorias |
| `/admin/pedidos` | `AdminOrdersView` | Gestão de pedidos |
| `/admin/usuarios` | `AdminUsersView` | Lista de usuários |
| `/admin/personalizar` | `AdminCustomizeView` | Personalização do site |
| `/admin/integracoes` | `AdminIntegrationsView` | Credenciais de APIs externas |
| `/admin/changelog` | `AdminChangelogView` | Histórico de mudanças |

#### Guards de Navegação

```typescript
// beforeEach global
router.beforeEach(async (to, from, next) => {
  // 1. Inicializa sessão se necessário
  // 2. Se requiresAuth e não logado → redireciona para /auth/login
  // 3. Se requiresAdmin e não é admin → redireciona para /admin/login
  // 4. Se logado sem telefone e rota não é /auth/telefone-obrigatorio → redireciona
})
```

---

### 5.3 Stores (Pinia)

#### `auth.store.ts`

**Estado:**

| Campo | Tipo | Descrição |
|---|---|---|
| `user` | `User \| null` | Objeto do usuário do Supabase Auth |
| `profile` | `Profile \| null` | Perfil completo da tabela `profiles` |
| `loading` | `boolean` | Indicador de carregamento |

**Getters:**

- `isLoggedIn` — `true` se `user !== null`
- `isAdmin` — `true` se `profile.role === 'ADMIN'`
- `requiresPhone` — `true` se logado mas sem telefone no perfil

**Actions:**

- `initialize()` — Carrega sessão ativa, escuta `onAuthStateChange`, busca perfil
- `fetchProfile(userId)` — Busca perfil da tabela `profiles`
- `login(email, password)` — `supabase.auth.signInWithPassword`
- `loginWithGoogle()` — `supabase.auth.signInWithOAuth` (provider: google)
- `logout()` — `supabase.auth.signOut` + limpa estado
- `updatePhone(phone)` — Atualiza telefone no perfil

---

#### `cart.store.ts`

**Estado:**

| Campo | Tipo | Descrição |
|---|---|---|
| `items` | `CartItem[]` | Array de itens no carrinho |
| `isOpen` | `boolean` | Visibilidade do drawer do carrinho |

**Getters:**

- `total` — Soma dos preços de todos os itens
- `count` — Quantidade de itens no carrinho
- `isEmpty` — `count === 0`

**Actions:**

- `addItem(product)` — Adiciona produto (sem duplicatas — produto digital)
- `removeItem(productId)` — Remove por ID
- `clear()` — Esvazia o carrinho
- `openDrawer()` / `closeDrawer()` — Controla o drawer lateral

> **Importante:** O carrinho é **in-memory apenas** — não persiste entre sessões/recargas.

---

#### `catalog.store.ts`

**Estado:**

| Campo | Tipo | Descrição |
|---|---|---|
| `categories` | `Category[]` | Categorias ativas |
| `featuredProducts` | `Product[]` | Até 8 produtos em destaque |
| `loading` | `boolean` | Estado de carregamento |

**Actions:**

- `loadCatalog()` — Busca categorias (`is_active = true`) e produtos em destaque (`is_featured = true AND deleted_at IS NULL`), limitados a 8

---

#### `site-config.store.ts`

**Estado:**

| Campo | Tipo | Descrição |
|---|---|---|
| `config` | `SiteConfigData` | Toda a configuração do site |
| `loading` | `boolean` | Estado de carregamento |

**Actions:**

- `loadConfig()` — Busca a linha `settings` da tabela `site_config`, aplica CSS custom properties e `<head>` tags
- `saveConfig(data)` — Salva configuração atualizada (upsert)
- `applyTheme(config)` — Define variáveis CSS `--color-primary-*`, `--color-secondary-*`, `--color-accent`

---

### 5.4 Composables

#### `useConfetti.ts`

Wrapper sobre `canvas-confetti`. Exporta a função `launchConfetti()` que dispara uma animação de confetes na tela. Usado na `CheckoutSuccessView` após confirmação de pagamento.

---

### 5.5 Serviços

#### `services/api.ts`

Helper que encapsula chamadas às Edge Functions do Supabase via `supabase.functions.invoke()`. Adiciona automaticamente o token JWT do usuário autenticado.

```typescript
// Uso padrão
const { data, error } = await api.invoke('create-order', { body: payload })
```

---

### 5.6 Componentes UI

Localizados em `components/ui/`. São componentes genéricos reutilizáveis em toda a aplicação.

#### `AppButton.vue`

Botão polimórfico com suporte a:

- **Variantes:** `primary` (padrão), `secondary`, `danger`, `ghost`
- **Tamanhos:** `sm`, `md` (padrão), `lg`
- **Props:** `loading` (exibe spinner), `disabled`, `type`, `href` (renderiza como `<a>`)

#### `AppInput.vue`

Campo de entrada com:

- **Props:** `label`, `error`, `hint`, `type`, `placeholder`, `modelValue`
- Exibe label acima, mensagem de erro abaixo (texto vermelho), hint abaixo (texto cinza)
- Emite `update:modelValue` (two-way binding com `v-model`)

#### `AppModal.vue`

Modal com `<Teleport to="body">`. Estrutura:

- Overlay com backdrop blur
- Container centralizado com header (título + botão fechar) e slot para conteúdo
- Fecha ao clicar no overlay ou no botão X
- **Props:** `open`, `title`
- **Emits:** `close`

#### `PhoneRequiredModal.vue`

Modal especializado para coleta de número de WhatsApp. Valida formato brasileiro. Chama `authStore.updatePhone()` ao confirmar.

#### `AnimatedList.vue`

Lista com animação staggered (cada item aparece com delay incremental). Usa `TransitionGroup`.

#### `NumberTicker.vue`

Componente de contador animado. Recebe `value` e anima o número de 0 até o valor usando `requestAnimationFrame`.

#### `StatusBadge.vue`

Badge de status com cores semânticas baseadas no `OrderStatus`:

| Status | Cor |
|---|---|
| `PAID` | Verde |
| `AWAITING_PAYMENT` | Amarelo |
| `CANCELLED` / `EXPIRED` | Vermelho |
| `REFUNDED` | Roxo |
| `PENDING` | Cinza |

#### `ShimmerButton.vue`

Botão com efeito de brilho animado (shimmer). Usado para CTAs de destaque.

#### `ShineBorder.vue`

Wrapper que aplica borda com gradiente animado ao redor do componente filho.

#### `SparklesText.vue`

Componente de texto com partículas de brilho animadas (`sparkles`) ao redor do texto.

#### `PixLogo.vue`

SVG inline do logo do PIX com cores oficiais.

---

### 5.7 Componentes de Catálogo

#### `ProductCard.vue`

Card de produto para exibição em grade:

- Imagem de capa com lazy loading
- Badge de desconto (se `compare_price > price`)
- Nome, preço, preço riscado
- Botão "Adicionar ao carrinho" com feedback visual
- Link para a página de detalhe

**Props:** `product: Product`

#### `CartDrawer.vue`

Drawer lateral deslizante (direita → esquerda):

- Lista de itens do carrinho com imagem, nome e preço
- Botão de remover por item
- Total do carrinho
- Botão "Finalizar compra" → navega para `/checkout`
- Overlay com fechamento ao clicar

---

### 5.8 Layouts

#### `PublicLayout.vue`

Layout principal das páginas públicas:

- **Header:** Logo, navegação principal, busca, menu do usuário (login/avatar), ícone do carrinho com badge
- **Announcement bar:** Barra no topo com texto configurável (se ativada na `site-config`)
- **Main:** Slot `<RouterView />`
- **Footer:** Links de redes sociais, selos de confiança, métodos de pagamento, rodapé com copyright

#### `AuthLayout.vue`

Layout minimalista para páginas de autenticação:

- Background com gradiente
- Card centralizado com logo, título e slot de conteúdo

#### `CustomerLayout.vue`

Layout da área do cliente:

- Header com gradiente, nome do usuário, botão de logout
- Navegação horizontal (desktop) e bottom navigation (mobile) com links para Pedidos e Downloads

#### `AdminLayout.vue`

Layout do painel administrativo:

- **Sidebar (desktop):** Logo, links de navegação com ícones (Dashboard, Produtos, Categorias, Pedidos, Usuários, Personalizar, Integrações, Changelog), botão de logout
- **Drawer (mobile):** Sidebar colapsável via overlay
- **Topbar:** Nome da página atual, botão do menu mobile, notificações
- **Main:** Slot para a view ativa

---

### 5.9 Views Públicas

#### `HomeView.vue`

Página inicial da loja:

1. **Seção Hero:** Carousel de banners com slides configuráveis (imagem, título, subtítulo, CTA). Navegação por setas e indicadores de ponto.
2. **Produtos em destaque:** Grid com até 8 `ProductCard`, carregados da `catalog.store`.
3. **Selos de confiança:** Ícones + texto (Suporte via chat, Métodos de pagamento, Download instantâneo).

---

#### `CatalogView.vue`

Catálogo completo de produtos:

1. **Filtros:** Botões de categoria (Todos + categorias ativas) e campo de busca por nome
2. **Grid de produtos:** `ProductCard` filtrados por categoria selecionada e termo de busca
3. **Estado vazio:** Mensagem quando nenhum produto corresponde aos filtros

Dados carregados diretamente do Supabase (`products` com filtro `is_active = true AND deleted_at IS NULL`).

---

#### `ProductView.vue`

Página de detalhe de produto (rota: `/produto/:slug`):

1. Carrega produto pelo `slug` da URL
2. **Galeria de imagens:** Capa + previews com troca de imagem principal ao clicar
3. **Informações:** Nome, preço, desconto, descrição, rich content (tipografia)
4. **Embeds de mídia:** Player do YouTube e embed do Instagram se URLs configuradas
5. **CTA:** Botão "Adicionar ao carrinho" ou "Já está no carrinho"
6. Produtos similares da mesma categoria

---

#### `CheckoutView.vue` ⭐ (crítico)

Fluxo de pagamento em múltiplas etapas:

**Etapa 1 — Revisão do pedido:**
- Lista itens do carrinho com imagens, nomes e preços
- Seletor de método de pagamento (PIX ou Cartão de Crédito)
- Total do pedido
- Botão "Confirmar pedido" → chama `create-order`

**Etapa 2 — PIX (se método = PIX):**
- QR Code do PIX em base64 (imagem)
- Código PIX em texto para cópia
- Countdown timer de 30 minutos
- Polling a cada 5s + Supabase Realtime para detectar `order.status = PAID`
- Auto-redireciona para `/checkout/sucesso` ao confirmar

**Etapa 3 — Cartão de Crédito (se método = CREDIT_CARD):**
- Exibe o Checkout Pro do Mercado Pago em `<iframe>` ou redireciona para `init_point`
- Realtime escuta mudança de status do pedido

**Tratamento de erros:**
- Token expirado (PIX > 30min) → mostra botão "Gerar novo PIX"
- Erro na API → exibe mensagem de erro com botão de retry

---

#### `CheckoutSuccessView.vue`

Tela de confirmação de pagamento bem-sucedido:

1. Animação de confetes via `useConfetti()`
2. Número do pedido e total pago
3. Lista de produtos com botões de download / link externo
4. Polling a cada 10s para aguardar `download_tokens` serem criados (caso webhook demore)
5. Supabase Realtime como listener adicional no pedido

---

#### `CheckoutFailureView.vue`

Tela de falha/cancelamento de pagamento com botão para tentar novamente (retorna ao carrinho).

---

#### `ContactView.vue`

Formulário de contato com campos: nome, e-mail, mensagem. Envia via lógica configurada (pode ser webhook ou e-mail direto).

---

#### `AboutView.vue`

Página "Sobre nós" com conteúdo estático configurável via `site-config`.

---

#### `PrivacyView.vue`

Política de privacidade com conteúdo rich text via `@tailwindcss/typography`.

---

#### `NotFoundView.vue`

Página 404 com link de retorno para a home.

---

### 5.10 Views de Autenticação

#### `LoginView.vue`

- Campos: e-mail + senha
- Checkbox "Lembrar-me"
- Link "Esqueci a senha"
- Botão de login com Google (OAuth)
- Após login: redireciona para `/` ou para a rota original

#### `RegisterView.vue`

- Campos: nome completo, e-mail, senha, telefone (WhatsApp)
- Validação de e-mail (regex) e senha (mínimo 8 caracteres)
- hCaptcha opcional (se `VITE_HCAPTCHA_SITE_KEY` definido)
- Chama a Edge Function `register-user`
- Após registro: faz login automático

#### `AdminLoginView.vue`

Login isolado para administradores. Idêntico ao `LoginView` mas com layout diferente e sem opção de registro ou Google OAuth.

#### `ForgotPasswordView.vue`

- Campo: e-mail
- Chama `supabase.auth.resetPasswordForEmail()`
- Exibe mensagem de confirmação

#### `ResetPasswordView.vue`

- Campos: nova senha + confirmação
- Acessado via link enviado por e-mail (token na URL)
- Chama `supabase.auth.updateUser({ password })`

#### `GoogleCallbackView.vue`

Rota temporária que captura o callback do OAuth do Google. Aguarda sessão, atualiza perfil e redireciona para a rota correta.

#### `PhoneRequiredView.vue`

- Exibe quando usuário logado não tem telefone cadastrado
- Campo para inserir número WhatsApp
- Salva via `authStore.updatePhone()`
- Após salvar, redireciona para a rota original

---

### 5.11 Views do Cliente

#### `CustomerOrdersView.vue`

Lista todos os pedidos com status `PAID` do usuário logado:

- Número do pedido, data, total
- Badge de status
- Link para downloads do pedido específico

Dados: `orders` filtrado por `user_id = auth.uid() AND status = PAID`.

---

#### `CustomerDownloadsView.vue` ⭐ (crítico)

Página de downloads de produtos adquiridos:

1. Busca todos os pedidos `PAID` do usuário
2. Busca os `order_items` de cada pedido
3. Busca os `download_tokens` correspondentes
4. **Deduplica** produtos (se o mesmo produto aparece em múltiplos pedidos, exibe uma vez)
5. Para cada produto:
   - Se `delivery_type = 'pdf'`: botão "Baixar PDF" → chama Edge Function `download`
   - Se `delivery_type = 'link'`: botão "Acessar conteúdo" → redireciona para `delivery_link`
6. Exibe contagem de downloads e expiração do token
7. Tokens revogados ou expirados: exibe aviso com link para suporte

---

### 5.12 Views do Admin

#### `AdminDashboardView.vue`

KPIs do painel:

- **Receita total:** Soma de `total_amount` dos pedidos `PAID`
- **Total de pedidos:** Contagem de pedidos `PAID`
- **Total de clientes:** Usuários únicos com pedidos `PAID`
- **Crescimento:** Comparação mês atual vs. anterior
- **Tabela de pedidos recentes:** Últimos 10 pedidos
- **Gráfico de receita:** Evolução mensal (últimos 6 meses)

---

#### `AdminProductsView.vue`

CRUD completo de produtos:

**Lista:**
- Tabela com capa, nome, preço, categoria, status, vendas
- Filtros por categoria e status
- Busca por nome

**Criação/Edição (modal ou página):**
- Nome, slug (gerado automaticamente do nome), descrição curta
- Rich content (editor WYSIWYG ou Markdown)
- Categoria (select das categorias ativas)
- Preço e preço comparativo
- Tipo de entrega: `pdf` (upload de arquivo) ou `link` (URL externa)
  - Se PDF: upload para bucket `product-files`, salva `file_key`
  - Se link: campo para `delivery_link`
- Imagem de capa → upload para `product-covers`
- Imagens de preview → upload múltiplo para `product-previews`
- URLs de mídia: YouTube, Instagram
- Tags (array de strings)
- Flags: `is_active`, `is_featured`
- Soft delete (define `deleted_at`)

---

#### `AdminCategoriesView.vue`

CRUD de categorias:

- Nome, slug, descrição
- Imagem → upload para `product-covers` (bucket compartilhado)
- `sort_order` para ordenação manual
- Toggle `is_active`

---

#### `AdminOrdersView.vue`

Gestão de pedidos:

- Lista com filtros: status, método de pagamento, período, busca por número/e-mail
- Badges coloridos de status e método de pagamento
- Ação "Marcar como pago" → chama `reconcile-orders` para pedidos `AWAITING_PAYMENT`
- Expansão de linha para ver itens do pedido
- Exportação CSV (opcional)

---

#### `AdminUsersView.vue`

Lista de todos os usuários do sistema:

- Chama a Edge Function `admin-users`
- Exibe: e-mail, nome, telefone, papel (role), data de criação
- Indicador de admin vs. cliente

---

#### `AdminCustomizeView.vue` ⭐ (crítico)

Painel de personalização visual da loja. Todas as configurações são salvas em `site_config` (chave `settings`):

**Seção — Identidade:**
- Nome da loja
- Descrição da loja
- Upload de logotipo → `product-covers`
- Upload de favicon → `product-covers`

**Seção — Cores:**
- Cor primária (color picker)
- Cor secundária (color picker)
- Cor de destaque/accent (color picker)
- Preview em tempo real via CSS custom properties

**Seção — Banner principal:**
- Toggle de ativação
- Upload de imagem do banner
- Título, subtítulo, texto do CTA, link do CTA

**Seção — Carousel de banners:**
- Lista de slides (adicionar/remover)
- Cada slide: título, subtítulo, imagem, CTA text, CTA link

**Seção — SEO:**
- Título da página (meta title)
- Descrição (meta description)

**Seção — Redes sociais:**
- Instagram, TikTok, WhatsApp, Facebook, YouTube

**Seção — Configurações avançadas:**
- Texto da barra de anúncio + cor de fundo
- Texto do rodapé
- Toggle de modo de manutenção

---

#### `AdminIntegrationsView.vue`

Configuração de integrações externas (salvas em `site_config`):

**Mercado Pago:**
- Access Token (campo senha, mascarado)
- Webhook Secret (campo senha, mascarado)
- Chave PIX
- URL do webhook (exibida para copiar, não editável)

**Telegram:**
- Token do bot
- IDs dos destinatários (lista de chat IDs para notificações)

---

#### `AdminChangelogView.vue`

Log histórico de mudanças do sistema para fins de documentação e auditoria interna.

---

## 6. Backend — Supabase Edge Functions

As Edge Functions são escritas em TypeScript/Deno e executadas no runtime de Edge do Supabase. Cada função tem acesso às variáveis de ambiente `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_ANON_KEY`.

### 6.1 `create-order`

**Endpoint:** `POST /functions/v1/create-order`

**Autenticação:** Bearer token JWT do usuário

**Payload:**
```typescript
{
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: 'PIX' | 'CREDIT_CARD';
}
```

**Fluxo detalhado:**

```
1. Extrai JWT do header Authorization
2. Verifica usuário autenticado (supabase.auth.getUser)
3. Busca perfil do usuário → exige phone preenchido
4. Valida cada item:
   - Produto existe e is_active = true e deleted_at IS NULL
   - Extrai preço atual do produto (nunca confia no preço enviado pelo cliente)
5. Calcula total_amount = Σ(unit_price * quantity)
6. Gera order_number no formato ORD-2025-XXXXXX (6 dígitos aleatórios)
7. INSERT orders com status:
   - PAID (se total = 0)
   - AWAITING_PAYMENT (caso contrário)
8. INSERT order_items para cada produto
9. Se FREE (total = 0):
   - INSERT download_tokens (expires_at = +30 anos)
   - Envia notificação Telegram "produto gratuito obtido"
   - Retorna { order, payment: { type: 'FREE' } }
10. Se PIX:
    - POST Mercado Pago /v1/payments (método: pix)
    - Salva mp_payment_id no pedido
    - Retorna QR code base64 + código texto
11. Se CREDIT_CARD:
    - POST Mercado Pago /checkout/preferences
    - Salva mp_preference_id no pedido
    - Retorna init_point URL do Checkout Pro
```

**Resposta:**
```typescript
{
  order: { id, order_number, total_amount, status };
  payment: {
    type: 'PIX' | 'CREDIT_CARD' | 'FREE';
    qrCode?: string;       // base64 image (PIX)
    qrCodeText?: string;   // texto para copiar (PIX)
    paymentId?: string;    // ID do pagamento MP (PIX)
    initPoint?: string;    // URL do Checkout Pro (Crédito)
  };
}
```

---

### 6.2 `mp-webhook`

**Endpoint:** `POST /functions/v1/mp-webhook`

**Autenticação:** Assinatura HMAC-SHA256 no header `x-signature` (validada contra `MERCADO_PAGO_WEBHOOK_SECRET`)

**Fluxo detalhado:**

```
1. Valida assinatura HMAC do webhook
2. Extrai event_id do payload
3. Verifica webhook_events: se já processado → responde 200 (idempotência)
4. INSERT webhook_events com status = 'processing'
5. GET /v1/payments/:id na API do Mercado Pago
6. Extrai external_reference (= order_id)
7. Busca pedido pelo external_reference
8. Se payment.status = 'approved':
   a. UPDATE orders SET status = 'PAID', paid_at = now()
      WHERE status = 'AWAITING_PAYMENT' (operação atômica)
   b. INSERT download_tokens para cada order_item
      - token = gen_random_uuid()
      - expires_at = now() + 30 anos
      - max_downloads = 99999
   c. UPDATE products SET sales_count = sales_count + 1
   d. Envia notificação Telegram com detalhes do pedido
9. UPDATE webhook_events SET status = 'processed'
10. Responde 200 OK
```

> **Idempotência:** A verificação em `webhook_events` garante que o mesmo evento não processe duas vezes, mesmo que o Mercado Pago reenvie o webhook.

---

### 6.3 `download`

**Endpoint:** `GET /functions/v1/download?token=<uuid>`

**Autenticação:** Bearer token JWT do usuário (dono do pedido)

**Fluxo detalhado:**

```
1. Extrai token da query string
2. Busca download_token:
   - token = $param
   - revoked_at IS NULL
   - expires_at > now()
3. Verifica que o user_id do pedido = usuário autenticado
4. Se delivery_type = 'link': retorna redirect 302 para delivery_link
5. Se delivery_type = 'pdf':
   a. Busca product.file_key
   b. Gera signed URL do bucket product-files (5 minutos)
   c. Fetch do arquivo via signed URL
   d. UPDATE download_tokens SET download_count = download_count + 1
   e. Retorna arquivo com headers:
      Content-Type: application/pdf
      Content-Disposition: attachment; filename="produto.pdf"
```

---

### 6.4 `register-user`

**Endpoint:** `POST /functions/v1/register-user`

**Autenticação:** Nenhuma (público)

**Payload:**
```typescript
{
  name: string;
  email: string;
  password: string;
  phone: string;
}
```

**Fluxo:**

```
1. Valida campos obrigatórios
2. Valida formato de e-mail
3. Valida senha (mín. 8 caracteres)
4. supabase.auth.admin.createUser({ email, password, email_confirm: true })
5. UPDATE profiles SET name, phone, role = 'CUSTOMER' WHERE id = newUser.id
6. Retorna 201 com { userId }
7. Se e-mail já existe → retorna 409 Conflict
```

> Usa `service_role` para criar usuário sem precisar de confirmação por e-mail e para contornar captcha.

---

### 6.5 `reconcile-orders`

**Endpoint:** `POST /functions/v1/reconcile-orders`

**Autenticação:** Bearer token JWT (requer role ADMIN)

**Finalidade:** Verificar manualmente pedidos presos em `AWAITING_PAYMENT` consultando a API do Mercado Pago diretamente.

**Fluxo:**

```
1. Busca todos os pedidos com status = AWAITING_PAYMENT
   (criados nas últimas 24h, com mp_payment_id ou mp_preference_id)
2. Para cada pedido:
   a. Se PIX: GET /v1/payments/:mp_payment_id
   b. Se Crédito: GET /v1/payments/search?external_reference=:orderId
3. Se payment.status = 'approved' e order.status != 'PAID':
   - Mesmo fluxo do webhook: atualiza para PAID, cria tokens, notifica
4. Se payment.status in ['rejected','cancelled']:
   - UPDATE orders SET status = 'CANCELLED'
5. Retorna sumário de pedidos reconciliados
```

---

### 6.6 `create-admin`

**Endpoint:** `POST /functions/v1/create-admin`

**Autenticação:** Nenhuma (ou secret especial de bootstrap)

**Fluxo:**

```
1. Verifica se existe algum usuário com role = 'ADMIN' em profiles
2. Se sim → retorna 403 Forbidden (admin já criado)
3. Se não:
   a. Cria usuário via auth.admin.createUser
   b. UPDATE profiles SET role = 'ADMIN' WHERE id = newUser.id
   c. Retorna access_token para login imediato
```

> Esta função é protegida por checagem de existência — só funciona uma vez (no bootstrap inicial).

---

### 6.7 `admin-users`

**Endpoint:** `GET /functions/v1/admin-users`

**Autenticação:** Bearer token JWT (requer role ADMIN)

**Fluxo:**

```
1. Verifica que o usuário autenticado é ADMIN
2. supabase.auth.admin.listUsers()
3. Busca todos os profiles
4. JOIN entre auth users e profiles pelo id
5. Retorna array de { id, email, name, phone, role, created_at }
```

---

### 6.8 `recent-purchases`

**Endpoint:** `GET /functions/v1/recent-purchases`

**Autenticação:** Nenhuma (público) ou JWT opcional

**Finalidade:** Exibir compras recentes no site como prova social (ex.: "João acabou de comprar X").

**Fluxo:**

```
1. Busca os últimos 20 pedidos PAID com join em profiles e order_items
2. Retorna: { customer_name_masked, product_name, created_at }
3. Nome mascarado: "Maria S." (primeiro nome + inicial do sobrenome)
```

---

## 7. Banco de Dados

### Tabela: `profiles`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` (FK auth.users) | Chave primária, referência ao auth |
| `name` | `text` | Nome completo |
| `email` | `text` | E-mail (espelho de auth.users) |
| `phone` | `text` | Telefone WhatsApp |
| `avatar_url` | `text` | URL do avatar (Google OAuth) |
| `role` | `text` | `CUSTOMER` ou `ADMIN` |
| `is_active` | `boolean` | Conta ativa |
| `created_at` | `timestamptz` | Data de criação |
| `updated_at` | `timestamptz` | Última atualização |

---

### Tabela: `categories`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | Nome da categoria |
| `slug` | `text` (unique) | URL amigável |
| `description` | `text` | Descrição da categoria |
| `image_url` | `text` | URL da imagem |
| `sort_order` | `integer` | Ordem de exibição |
| `is_active` | `boolean` | Visível no catálogo |
| `created_at` / `updated_at` | `timestamptz` | Timestamps |

---

### Tabela: `products`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `text` | Nome do produto |
| `slug` | `text` (unique) | URL amigável |
| `description` | `text` | Descrição curta |
| `rich_content` | `text` | Conteúdo HTML/Markdown longo |
| `price` | `numeric(10,2)` | Preço de venda |
| `compare_price` | `numeric(10,2)` | Preço original (para exibir desconto) |
| `cover_image_url` | `text` | URL da imagem de capa |
| `preview_images` | `text[]` | Array de URLs de preview |
| `category_id` | `uuid` (FK) | Categoria do produto |
| `file_key` | `text` | Chave no bucket `product-files` (PDFs) |
| `file_size` | `bigint` | Tamanho do arquivo em bytes |
| `page_count` | `integer` | Número de páginas (PDF) |
| `tags` | `text[]` | Tags para busca/filtragem |
| `is_active` | `boolean` | Visível no catálogo |
| `is_featured` | `boolean` | Exibido na home |
| `sort_order` | `integer` | Ordem de exibição |
| `sales_count` | `integer` | Contador de vendas |
| `deleted_at` | `timestamptz` | Soft delete (null = ativo) |
| `youtube_url` | `text` | URL do vídeo YouTube |
| `instagram_url` | `text` | URL do post Instagram |
| `delivery_type` | `text` | `pdf` ou `link` |
| `delivery_link` | `text` | URL de entrega externa (se tipo link) |
| `created_at` / `updated_at` | `timestamptz` | Timestamps |

---

### Tabela: `orders`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | PK |
| `order_number` | `text` (unique) | Número legível (ORD-2025-XXXXXX) |
| `user_id` | `uuid` (FK) | Dono do pedido |
| `status` | `text` | Ver `OrderStatus` enum |
| `total_amount` | `numeric(10,2)` | Valor total do pedido |
| `payment_method` | `text` | `PIX` ou `CREDIT_CARD` |
| `mp_preference_id` | `text` | ID da preferência MP (Crédito) |
| `mp_payment_id` | `text` | ID do pagamento MP (PIX) |
| `mp_status` | `text` | Status retornado pela API MP |
| `paid_at` | `timestamptz` | Data/hora da confirmação |
| `expires_at` | `timestamptz` | Expiração do PIX (30 min) |
| `customer_email` | `text` | E-mail no momento da compra |
| `customer_name` | `text` | Nome no momento da compra |
| `metadata` | `jsonb` | Dados extras (IP, etc.) |
| `created_at` / `updated_at` | `timestamptz` | Timestamps |

---

### Tabela: `order_items`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | PK |
| `order_id` | `uuid` (FK) | Pedido pai |
| `product_id` | `uuid` (FK) | Produto comprado |
| `product_name` | `text` | Nome snapshot (imutável) |
| `unit_price` | `numeric(10,2)` | Preço snapshot no momento da compra |
| `quantity` | `integer` | Quantidade |
| `created_at` | `timestamptz` | Timestamp |

---

### Tabela: `download_tokens`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | PK |
| `token` | `uuid` (unique) | Token de acesso (UUID v4) |
| `order_id` | `uuid` (FK) | Pedido associado |
| `order_item_id` | `uuid` (FK) | Item do pedido |
| `download_count` | `integer` | Quantas vezes foi baixado |
| `max_downloads` | `integer` | Limite (99999 = ilimitado) |
| `expires_at` | `timestamptz` | Expiração (30 anos) |
| `last_download_at` | `timestamptz` | Último download |
| `revoked_at` | `timestamptz` | Data de revogação (null = ativo) |
| `delivery_link` | `text` | URL de entrega para tokens de link |
| `created_at` / `updated_at` | `timestamptz` | Timestamps |

---

### Tabela: `site_config`

| Coluna | Tipo | Descrição |
|---|---|---|
| `key` | `text` (PK unique) | Chave de configuração |
| `value` | `jsonb` | Valor (objeto JSON) |
| `updated_at` | `timestamptz` | Última atualização |

A chave principal usada é `"settings"` que armazena o objeto `SiteConfigData` completo.

---

### Tabela: `webhook_events`

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | `uuid` | PK |
| `source` | `text` | Origem (ex.: `mercadopago`) |
| `event_id` | `text` (unique) | ID do evento para idempotência |
| `event_type` | `text` | Tipo do evento (ex.: `payment`) |
| `payload` | `jsonb` | Payload completo do webhook |
| `status` | `text` | `pending`, `processing`, `processed`, `failed` |
| `created_at` | `timestamptz` | Timestamp |

---

### Row Level Security (RLS)

| Tabela | Política |
|---|---|
| `profiles` | Leitura: próprio usuário ou admin. Escrita: apenas service_role |
| `categories` | Leitura: pública. Escrita: apenas admin |
| `products` | Leitura: pública (ativos). Escrita: apenas admin |
| `orders` | Leitura: dono do pedido ou admin. Escrita: service_role |
| `order_items` | Leitura: dono do pedido ou admin |
| `download_tokens` | Leitura: dono do pedido. Execução: via Edge Function |
| `site_config` | Leitura: pública. Escrita: apenas admin |
| `webhook_events` | Apenas service_role |

---

## 8. Pacote Compartilhado (shared)

Localizado em `packages/shared/`. Exportado como `@sitepedagogico/shared`.

### Enums

#### `OrderStatus`

```typescript
enum OrderStatus {
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED',
}
```

#### `PaymentMethod`

```typescript
enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}
```

#### `UserRole`

```typescript
enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
}
```

---

### Tipos

#### `SiteConfigData`

```typescript
interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
}

interface BannerSlide {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
}

interface SiteConfigData {
  // Identidade
  storeName: string;
  storeDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;

  // Cores
  primaryColor: string;      // Padrão: #7C3AED
  secondaryColor: string;    // Padrão: #EC4899
  accentColor: string;       // Padrão: #F59E0B

  // Banner principal
  bannerEnabled: boolean;
  bannerImageUrl: string | null;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerCtaText: string;
  bannerCtaLink: string;

  // Carousel de banners
  banners: BannerSlide[];

  // Destaques
  highlightedProductIds: string[];
  highlightedCategoryIds: string[];

  // Anúncio
  announcementBarText: string | null;
  announcementBarColor: string;

  // Rodapé e social
  footerText: string;
  socialLinks: SocialLinks;

  // SEO
  seoTitle: string;
  seoDescription: string;

  // Sistema
  maintenanceMode: boolean;
  pixMessage: string;

  // Integrações (armazenadas mas não expostas ao cliente)
  mercadoPagoAccessToken: string | null;
  mercadoPagoWebhookSecret: string | null;
  mercadoPagoPixKey: string | null;
}
```

---

## 9. Fluxos de Negócio

### 9.1 Fluxo de Compra

```
Usuário
  │
  ├── 1. Navega no catálogo (/catalogo)
  ├── 2. Clica em produto → /produto/:slug
  ├── 3. Clica "Adicionar ao carrinho" → cart.store.addItem()
  ├── 4. Abre drawer do carrinho → clica "Finalizar"
  ├── 5. Redireciona para /checkout
  │
  CheckoutView
  │
  ├── 6. Seleciona método: PIX ou Crédito
  ├── 7. Clica "Confirmar" → create-order (Edge Function)
  │       ├── Valida produtos e preços
  │       ├── INSERT order + order_items
  │       └── Inicia charge/preference no Mercado Pago
  │
  ├── [PIX]
  │   ├── 8. Exibe QR Code + código texto + timer 30 min
  │   ├── 9. Polling a cada 5s + Realtime listener
  │   └── 10. Pedido confirmado → redireciona /checkout/sucesso
  │
  └── [Crédito]
      ├── 8. Exibe iframe / redireciona para Checkout Pro MP
      └── 9. MP retorna callback / webhook → /checkout/sucesso
  
  Mercado Pago
  │
  ├── 11. Envia webhook POST → /functions/v1/mp-webhook
  │       ├── Valida assinatura
  │       ├── UPDATE order SET status = PAID
  │       ├── INSERT download_tokens
  │       ├── UPDATE products SET sales_count++
  │       └── Envia notificação Telegram
  │
  CheckoutSuccessView
  │
  └── 12. Exibe confetes + lista de downloads
          └── Botões de download/acesso aos produtos
```

---

### 9.2 Fluxo de Registro de Usuário

```
RegisterView
  │
  ├── 1. Usuário preenche: nome, e-mail, senha, telefone
  ├── 2. Frontend chama POST /functions/v1/register-user
  │
  register-user (Edge Function)
  │
  ├── 3. Valida campos
  ├── 4. auth.admin.createUser() com service_role
  ├── 5. UPDATE profiles SET name, phone, role='CUSTOMER'
  └── 6. Retorna { userId }
  │
  ├── 7. Frontend faz login automático com email/senha
  ├── 8. authStore.initialize() carrega perfil
  └── 9. Redireciona para / (ou rota original)
```

---

### 9.3 Fluxo de Download

```
CustomerDownloadsView
  │
  ├── 1. Busca pedidos PAID do usuário
  ├── 2. Busca order_items de cada pedido
  ├── 3. Busca download_tokens dos items
  ├── 4. Deduplica por product_id
  │
  Usuário clica "Baixar PDF"
  │
  ├── 5. GET /functions/v1/download?token=<uuid>
  │
  download (Edge Function)
  │
  ├── 6. Valida token (não expirado, não revogado)
  ├── 7. Verifica ownership (user_id do pedido = autenticado)
  ├── 8. [PDF] Gera signed URL do bucket product-files (5 min)
  │       → Faz fetch do arquivo
  │       → UPDATE download_count++
  │       → Retorna arquivo como PDF attachment
  └── 8. [Link] Retorna 302 redirect para delivery_link
```

---

### 9.4 Fluxo de Reconciliação de Pagamento

```
Admin clica "Reconciliar pedidos" no AdminOrdersView
  │
  └── POST /functions/v1/reconcile-orders
      │
      ├── Busca pedidos AWAITING_PAYMENT (últimas 24h)
      ├── Para cada pedido:
      │   ├── Consulta Mercado Pago pela API
      │   ├── Se approved e não PAID:
      │   │   ├── UPDATE order → PAID
      │   │   ├── INSERT download_tokens
      │   │   └── Notifica Telegram
      │   └── Se cancelled/rejected:
      │       └── UPDATE order → CANCELLED
      └── Retorna { reconciled: N, cancelled: M }
```

---

## 10. Integração com Mercado Pago

### Configuração

As credenciais são armazenadas em `site_config.value.mercadoPagoAccessToken` (e `.mercadoPagoWebhookSecret`, `.mercadoPagoPixKey`). Fallback para variáveis de ambiente `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`.

### Criação de cobrança PIX

```
POST https://api.mercadopago.com/v1/payments
Authorization: Bearer <access_token>
{
  "transaction_amount": 29.90,
  "payment_method_id": "pix",
  "description": "Pedido ORD-2025-123456",
  "payer": { "email": "cliente@email.com" },
  "external_reference": "<order_uuid>",
  "date_of_expiration": "<now + 30 minutes>"
}
```

Resposta: `point_of_interaction.transaction_data.qr_code_base64` e `.qr_code`

### Criação de preferência (Checkout Pro)

```
POST https://api.mercadopago.com/checkout/preferences
Authorization: Bearer <access_token>
{
  "items": [{ "title": "...", "unit_price": ..., "quantity": 1 }],
  "external_reference": "<order_uuid>",
  "back_urls": {
    "success": "<FRONTEND_URL>/checkout/sucesso",
    "failure": "<FRONTEND_URL>/checkout/falha",
    "pending": "<FRONTEND_URL>/checkout/sucesso"
  },
  "auto_return": "approved",
  "notification_url": "<SUPABASE_URL>/functions/v1/mp-webhook"
}
```

Resposta: `init_point` (URL do Checkout Pro)

### Validação do Webhook

```typescript
// Header: x-signature contém ts e v1
const signature = `id=${payment_id}&request-id=${requestId}&ts=${ts}`;
const expectedHash = HMAC_SHA256(secret, signature);
// Compara com o hash recebido no header
```

---

## 11. Integração com Telegram

### Configuração

- **Token do bot:** `site_config.value.telegramBotToken` ou env `TELEGRAM_BOT_TOKEN`
- **Destinatários:** `site_config.value.telegramRecipients` (array de `{ chatId: string }`) ou legacy `telegramChatId`

### Envio de notificação

```
POST https://api.telegram.org/bot<token>/sendMessage
{
  "chat_id": "<chatId>",
  "parse_mode": "HTML",
  "text": "<b>💰 Novo pagamento!</b>\n\nPedido: ORD-2025-123456\nCliente: Maria S.\nTotal: R$ 29,90\n\nItens:\n• Atividade Matemática 1º Ano"
}
```

### Eventos que disparam notificação

| Evento | Mensagem |
|---|---|
| Produto gratuito | "🎁 Produto gratuito obtido" |
| PIX confirmado | "💰 Pagamento PIX confirmado" |
| Crédito confirmado | "💳 Pagamento Crédito confirmado" |
| Reconciliação | "🔄 Pagamento reconciliado manualmente" |
| Cancelamento | "❌ Pedido cancelado/recusado" |

---

## 12. Configuração do Site (Personalização)

Toda configuração fica em uma única linha da tabela `site_config` com `key = 'settings'` e `value = <JSON>`.

O `site-config.store` carrega essa configuração na inicialização e aplica:

### CSS Custom Properties (tema dinâmico)

```css
/* Aplicado em document.documentElement */
--color-primary-50: <calculado do primaryColor>
--color-primary-100: ...
...
--color-primary-900: <calculado do primaryColor>
--color-secondary-400: <calculado do secondaryColor>
--color-secondary-500: ...
--color-secondary-600: <calculado do secondaryColor>
--color-accent: <accentColor>
```

As variações de tom são calculadas automaticamente a partir da cor base usando manipulação HSL.

### `<head>` Tags (SEO + Favicon)

```html
<title>{{ seoTitle }}</title>
<meta name="description" content="{{ seoDescription }}" />
<link rel="icon" href="{{ faviconUrl }}" />
<meta property="og:title" content="{{ seoTitle }}" />
<meta property="og:description" content="{{ seoDescription }}" />
```

---

## 13. Autenticação e Autorização

### Providers suportados

- **Email + Senha** — padrão, todos os usuários
- **Google OAuth** — login social, pede e-mail e nome

### Fluxo de sessão

1. `supabase.auth.signIn*` retorna session com JWT
2. JWT armazenado no localStorage pelo Supabase
3. `onAuthStateChange` notifica mudanças de sessão
4. `authStore.initialize()` carrega perfil na montagem da app

### Roles e permissões

| Role | Acesso |
|---|---|
| `CUSTOMER` | Áreas públicas, `/minha-conta`, checkout |
| `ADMIN` | Tudo acima + `/admin` (painel completo) |

### Guards de rota

```typescript
// requiresAuth
if (!authStore.isLoggedIn) → redirect to /auth/login?redirect=<route>

// requiresAdmin
if (!authStore.isAdmin) → redirect to /admin/login

// requiresPhone
if (authStore.isLoggedIn && !authStore.profile?.phone) → redirect to /auth/telefone-obrigatorio
```

### RLS no banco

Todas as tabelas sensíveis têm políticas RLS que verificam `auth.uid()` e `auth.jwt() ->> 'role'`. As Edge Functions que precisam de acesso irrestrito usam o `service_role` key, que bypassa RLS.

---

## 14. Armazenamento de Arquivos

### Buckets do Supabase Storage

| Bucket | Acesso | Conteúdo |
|---|---|---|
| `product-covers` | **Público** | Imagens de capa dos produtos e categorias, logos, favicons |
| `product-previews` | **Público** | Imagens de preview/galeria dos produtos |
| `product-files` | **Privado** | Arquivos PDF para download |

### Upload de arquivos (admin)

```typescript
// Exemplo de upload de capa
const filePath = `covers/${uuid()}-${file.name}`;
const { data } = await supabase.storage
  .from('product-covers')
  .upload(filePath, file, { contentType: file.type });

const { publicUrl } = supabase.storage
  .from('product-covers')
  .getPublicUrl(data.path);
```

### Download seguro (Edge Function)

```typescript
// Gera URL assinada com expiração de 5 minutos
const { data } = await supabase.storage
  .from('product-files')
  .createSignedUrl(product.file_key, 300);

// Faz fetch e retorna o arquivo como stream
const response = await fetch(data.signedUrl);
return new Response(response.body, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${productName}.pdf"`,
  },
});
```

---

## 15. Estilização e Design

### Framework: Tailwind CSS 3.4

### Sistema de cores

```css
/* Cores primárias (roxa por padrão — overrideável via site-config) */
--color-primary-50 → --color-primary-900

/* Cores secundárias (pink por padrão) */
--color-secondary-400 → --color-secondary-600

/* Accent (amber por padrão) */
--color-accent
```

### Tipografia

- **Fonte:** Inter (Google Fonts), fallback para system-ui, sans-serif
- **Escala:** Tailwind padrão (xs até 6xl)

### Breakpoints customizados

| Nome | Largura |
|---|---|
| `xs` | 400px |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

### Animações customizadas

```css
fade-in          /* opacity 0 → 1 */
slide-in         /* translateX(-20px) → 0 */
slide-down       /* translateY(-10px) → 0 */
slide-up         /* translateY(10px) → 0 */
bounce-in        /* scale(0.9) → 1 com bounce */
shimmer          /* background-position sliding (skeleton loading) */
ping             /* scale/opacity pulse (notification badges) */
```

### Design tokens

```
Border radius 2xl → 1rem
Border radius 3xl → 1.5rem
```

---

## 16. Variáveis de Ambiente

### Frontend (`apps/web/.env`)

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_HCAPTCHA_SITE_KEY=<key>   # Opcional — habilita captcha no registro
```

### Edge Functions (Supabase Secrets)

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_ANON_KEY=<anon-key>
FRONTEND_URL=https://sua-loja.vercel.app

# Fallbacks para site_config (usados se site_config não tiver os valores)
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_WEBHOOK_SECRET=<webhook-secret>
TELEGRAM_BOT_TOKEN=<bot-token>
```

---

## 17. Deploy e Infraestrutura

### Frontend (Vercel)

**Configuração (`vercel.json`):**

```json
{
  "buildCommand": "pnpm --filter @sitepedagogico/shared build && pnpm --filter web build",
  "outputDirectory": "apps/web/dist",
  "rewrites": [
    { "source": "/api/og", "destination": "/api/og.ts" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

A última regra é o fallback SPA — todas as rotas não-API retornam `index.html`.

### Backend (Supabase Edge Functions)

**GitHub Actions (`.github/workflows/deploy-functions.yml`):**

```yaml
on:
  push:
    branches: [main]
    paths: ['supabase/functions/**']

jobs:
  deploy:
    steps:
      - uses: supabase/setup-cli
      - run: supabase functions deploy --project-ref $SUPABASE_PROJECT_REF
```

Deploy automático das Edge Functions a cada push na `main` que modifique arquivos em `supabase/functions/`.

### Docker (opcional)

`apps/web/Dockerfile` — Build multi-stage:

1. **Stage build:** Node + pnpm, compila a aplicação Vue
2. **Stage serve:** Nginx Alpine, serve os arquivos estáticos

`apps/web/nginx.conf` — Configuração do Nginx com:

- Compressão gzip
- Cache de assets estáticos (imagens, JS, CSS)
- `try_files $uri $uri/ /index.html` para SPA routing

---

## 18. Open Graph — API de Imagem

**`api/og.ts`** — Função Vercel (Node.js)

Gera imagens OG dinâmicas (1200×630) para compartilhamento em redes sociais. Executada no Edge Runtime da Vercel.

**Parâmetros (query string):**

- `title` — Título do produto/página
- `description` — Descrição
- `image` — URL da imagem do produto (opcional)

**Uso:** `https://sua-loja.vercel.app/api/og?title=Produto+X&description=...`

---

## 19. Limitações Conhecidas

| Limitação | Detalhe |
|---|---|
| **Carrinho não persiste** | In-memory apenas — limpo ao recarregar a página |
| **Schema SQL informativo** | `supabase-schema.sql` pode estar desatualizado — as migrações em `supabase/migrations/` são a fonte de verdade |
| **Soft delete** | Produtos usam `deleted_at` — nunca são deletados do banco; filtrar por `deleted_at IS NULL` em todas as queries |
| **Entrega híbrida** | Um produto pode ser PDF ou link externo — o campo `delivery_type` define o comportamento |
| **Limites de download** | `max_downloads = 99999` representa ilimitado na prática |
| **Telefone obrigatório** | Todos os clientes devem informar WhatsApp para finalizar compra |
| **Admin único via função** | O `create-admin` só funciona uma vez; admins adicionais devem ser criados diretamente no banco |
| **PIX expira em 30 min** | Após expiração, é necessário criar um novo pedido |
| **Sem carrinho persistido** | Produtos adicionados ao carrinho são perdidos se o usuário fechar o navegador |

---

## 20. Guia de Contribuição e Padrões de Código

### Estrutura de commits

```
feat: adiciona busca por tag no catálogo
fix: corrige expiração de token PIX
chore: atualiza dependências do workspace
```

### Padrões TypeScript

- Sempre tipar props e emits de componentes Vue com `defineProps<{}>()` e `defineEmits<{}>()`
- Usar tipos do `@sitepedagogico/shared` para enums e interfaces centrais
- Evitar `any` — usar `unknown` com type guards quando necessário

### Padrões Vue

- Composition API com `<script setup lang="ts">`
- Stores via `storeToRefs()` para destructuring reativo
- Composables em `composables/` para lógica reutilizável

### Padrões de Edge Function

- Sempre validar JWT antes de processar
- Usar `service_role` apenas quando necessário (operações de escrita críticas)
- Implementar idempotência para operações financeiras (verificar `webhook_events`)
- Nunca confiar em preços enviados pelo cliente — sempre buscar do banco

### Adicionando um novo produto

1. Admin acessa `/admin/produtos` → "Novo produto"
2. Preenche nome, descrição, preço, categoria
3. Define `delivery_type`: `pdf` (faz upload) ou `link` (insere URL)
4. Faz upload de capa e previews
5. Ativa produto (`is_active = true`)
6. Produto aparece no catálogo automaticamente

### Adicionando uma nova Edge Function

1. Criar `supabase/functions/<nome>/index.ts`
2. Estrutura mínima:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // lógica aqui

  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

3. Fazer deploy via `supabase functions deploy <nome>` ou via GitHub Actions (push na main)
