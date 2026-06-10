# App mobile (Capacitor) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Empacotar a loja web Vue 3 existente (`apps/web`) num app Android instalável (Capacitor), publicável na Google Play, reaproveitando 100% da UI e do backend Appwrite, atendendo cliente e admin.

**Architecture:** Um novo pacote pnpm `apps/mobile` é só a casca Capacitor — ele não duplica UI. O `apps/web` ganha um **modo de build "mobile"** (`VITE_TARGET=mobile`) que (a) usa caminhos relativos (`base: './'`), (b) fala com o Appwrite por endpoint **absoluto** (sem o swap de host que existe pra web), e (c) inicializa plugins nativos (botão voltar, status bar, splash, navegador in-app). O Capacitor aponta `webDir` pro `dist` desse build e empacota os assets numa APK/AAB.

**Tech Stack:** Vue 3 + Vite 5 (pnpm workspace), Appwrite SDK web ^18.2.0, Capacitor 6 (`@capacitor/core`, `cli`, `android`, `app`, `browser`, `status-bar`, `splash-screen`), Android Studio + JDK 17, Vitest (só pra a função pura de endpoint).

**Design de referência:** `docs/superpowers/specs/2026-06-10-mobile-app-capacitor-design.md`

**Decisões fechadas:** app **"Site Pedagógico"**, `appId` **`com.sitepedagogico.app`**, Android primeiro (iOS fase 2), Mercado Pago mantido, login Google e push na fase 2 (v1 = email/senha).

---

## File Structure

**Novos arquivos:**
- `apps/mobile/package.json` — pacote da casca, scripts build/sync/run.
- `apps/mobile/capacitor.config.ts` — `appId`, `appName`, `webDir`.
- `apps/mobile/.gitignore` — ignora `android/app/build`, `.gradle`, keystore.
- `apps/mobile/resources/icon.png`, `apps/mobile/resources/splash.png` — origem do ícone/splash (geração via `@capacitor/assets`).
- `apps/mobile/android/` — projeto Android nativo (versionado, gerado pelo Capacitor).
- `apps/web/src/lib/endpoint.ts` — função pura `resolveEndpoint()` (extraída de `appwrite.ts`, testável).
- `apps/web/src/lib/endpoint.test.ts` — teste unitário da função.
- `apps/web/src/mobile/native.ts` — init dos plugins Capacitor + helper `openExternal()`, só carregado no modo mobile.
- `apps/web/vitest.config.ts` — config mínima de teste.

**Arquivos modificados:**
- `apps/web/vite.config.ts` — `base` relativo e `define` no modo mobile.
- `apps/web/src/lib/appwrite.ts` — usar `resolveEndpoint()`.
- `apps/web/src/main.ts` — import guardado de `native.ts` no modo mobile.
- `apps/web/src/views/public/CheckoutView.vue` — cartão MP via navegador in-app no mobile.
- `apps/web/package.json` — deps Capacitor + script `build:mobile` + devDep vitest.
- `package.json` (raiz) — script `build:mobile`.
- `docs/superpowers/specs/2026-06-10-mobile-app-capacitor-design.md` — status.

---

## Task 1: Modo de build "mobile" no Vite

Introduz `VITE_TARGET=mobile`, que ajusta `base` pra caminhos relativos (Capacitor serve de `https://localhost`) e expõe a flag pro código via `import.meta.env`.

**Files:**
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/.env.mobile`

- [ ] **Step 1: Adicionar modo mobile ao vite.config.ts**

Substituir o `export default defineConfig({ ... })` atual por uma função que lê o modo. Conteúdo completo do arquivo:

```ts
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isMobile = env.VITE_TARGET === 'mobile';

  return {
    // Capacitor serve a UI de https://localhost — caminhos absolutos (/assets)
    // quebram. No modo mobile geramos caminhos relativos.
    base: isMobile ? './' : '/',
    plugins: [
      vue(),
      legacy({
        targets: ['defaults', 'chrome >= 64', 'safari >= 12', 'firefox >= 67', 'not IE 11'],
        modernPolyfills: true,
        renderLegacyChunks: true,
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@sitepedagogico/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
    },
    optimizeDeps: {
      include: ['@sitepedagogico/shared'],
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/v1': {
          target: 'https://appwrite.wsgestao.digital',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
```

- [ ] **Step 2: Criar apps/web/.env.mobile**

```
VITE_TARGET=mobile
VITE_APPWRITE_ENDPOINT=https://sitepedagogico.com.br/v1
VITE_APPWRITE_PROJECT_ID=6a1bc2b1000d09c3f5f1
VITE_APPWRITE_DATABASE_ID=pedago-db
VITE_HCAPTCHA_SITE_KEY=
```

- [ ] **Step 3: Adicionar script build:mobile**

Em `apps/web/package.json`, dentro de `"scripts"`, adicionar após a linha `"build"`:

```json
    "build:mobile": "vue-tsc && vite build --mode mobile",
```

- [ ] **Step 4: Verificar que o build mobile gera caminhos relativos**

Run: `pnpm --filter web build:mobile`
Expected: build conclui sem erro e `apps/web/dist/index.html` referencia assets como `./assets/...` (relativo), não `/assets/...`.

Verificação rápida (PowerShell): `Select-String -Path "apps/web/dist/index.html" -Pattern './assets'` deve retornar pelo menos uma linha.

- [ ] **Step 5: Verificar que o build web normal não regrediu**

Run: `pnpm --filter web build`
Expected: build conclui; `apps/web/dist/index.html` referencia `/assets/...` (absoluto). O modo mobile não afetou o web.

- [ ] **Step 6: Commit**

```bash
git add apps/web/vite.config.ts apps/web/.env.mobile apps/web/package.json
git commit -m "feat(mobile): modo de build mobile no Vite (base relativa)"
```

---

## Task 2: Função pura de resolução de endpoint (com teste)

Hoje `appwrite.ts` troca o host do endpoint pelo `window.location.origin` (proxy de mesma origem anti-firewall de escolas). No app, `origin` = `https://localhost`, o que geraria `https://localhost/v1` (inexistente). A lógica vira uma função pura testável que, no modo mobile, **mantém o endpoint absoluto**.

**Files:**
- Create: `apps/web/src/lib/endpoint.ts`
- Create: `apps/web/src/lib/endpoint.test.ts`
- Create: `apps/web/vitest.config.ts`
- Modify: `apps/web/package.json`

- [ ] **Step 1: Instalar o vitest**

Run: `pnpm --filter web add -D vitest`
Expected: vitest aparece em `devDependencies` de `apps/web/package.json`.

- [ ] **Step 2: Criar vitest.config.ts**

`apps/web/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Adicionar script de teste**

Em `apps/web/package.json`, dentro de `"scripts"`, adicionar:

```json
    "test": "vitest run",
```

- [ ] **Step 4: Escrever o teste que falha**

`apps/web/src/lib/endpoint.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveEndpoint } from './endpoint';

describe('resolveEndpoint', () => {
  it('web: troca o host pelo origin atual (proxy mesma origem)', () => {
    const url = resolveEndpoint({
      configured: 'https://sitepedagogico.com.br/v1',
      origin: 'https://www.sitepedagogico.com.br',
      isMobile: false,
    });
    expect(url).toBe('https://www.sitepedagogico.com.br/v1');
  });

  it('web sem window: usa o endpoint configurado', () => {
    const url = resolveEndpoint({
      configured: 'https://sitepedagogico.com.br/v1',
      origin: undefined,
      isMobile: false,
    });
    expect(url).toBe('https://sitepedagogico.com.br/v1');
  });

  it('mobile: usa o endpoint absoluto, ignora o origin localhost', () => {
    const url = resolveEndpoint({
      configured: 'https://sitepedagogico.com.br/v1',
      origin: 'https://localhost',
      isMobile: true,
    });
    expect(url).toBe('https://sitepedagogico.com.br/v1');
  });

  it('web: endpoint só com path cai pro origin', () => {
    const url = resolveEndpoint({
      configured: '/v1',
      origin: 'https://www.sitepedagogico.com.br',
      isMobile: false,
    });
    expect(url).toBe('https://www.sitepedagogico.com.br/v1');
  });
});
```

- [ ] **Step 5: Rodar o teste e confirmar que falha**

Run: `pnpm --filter web test`
Expected: FAIL — `Cannot find module './endpoint'` / `resolveEndpoint is not a function`.

- [ ] **Step 6: Implementar a função**

`apps/web/src/lib/endpoint.ts`:

```ts
// Decide qual URL base do Appwrite usar.
//
// Web: o endpoint configurado só fornece o path (/v1); trocamos o host pelo
// origin atual (www vs não-www vs localhost) pra a chamada ser SEMPRE de mesma
// origem — o proxy Vercel/Vite encaminha /v1 pro Appwrite e fura o firewall de
// escolas. Cross-origin seria bloqueado por CORS (página em branco).
//
// Mobile (Capacitor): o origin é https://localhost (inexistente como API), então
// NÃO trocamos o host — usamos o endpoint absoluto, que continua passando pelo
// proxy anti-firewall em sitepedagogico.com.br.
export function resolveEndpoint(opts: {
  configured: string;
  origin: string | undefined;
  isMobile: boolean;
}): string {
  const { configured, origin, isMobile } = opts;
  if (isMobile || !origin) return configured;
  const path = configured.replace(/^https?:\/\/[^/]+/, '') || '/v1';
  return origin + path;
}
```

- [ ] **Step 7: Rodar o teste e confirmar que passa**

Run: `pnpm --filter web test`
Expected: PASS (4 testes verdes).

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/lib/endpoint.ts apps/web/src/lib/endpoint.test.ts apps/web/vitest.config.ts apps/web/package.json
git commit -m "feat(mobile): resolveEndpoint puro + teste (endpoint absoluto no app)"
```

---

## Task 3: Usar resolveEndpoint no appwrite.ts

Liga a função nova ao cliente Appwrite, sem mudar o comportamento web.

**Files:**
- Modify: `apps/web/src/lib/appwrite.ts:1-11`

- [ ] **Step 1: Substituir a montagem do endpoint**

Trocar as linhas 1–11 atuais de `apps/web/src/lib/appwrite.ts` por:

```ts
import { Client, Account, Databases, Storage, Functions } from 'appwrite'
import { resolveEndpoint } from './endpoint'

const configuredEndpoint = (import.meta.env.VITE_APPWRITE_ENDPOINT as string) || '/v1'
const endpoint = resolveEndpoint({
  configured: configuredEndpoint,
  origin: typeof window !== 'undefined' ? window.location.origin : undefined,
  isMobile: import.meta.env.VITE_TARGET === 'mobile',
})
```

(O resto do arquivo — `new Client()`, exports, `fetchProductFile`, etc. — fica igual. `appwriteEndpoint = endpoint` continua válido.)

- [ ] **Step 2: Verificar build web**

Run: `pnpm --filter web build`
Expected: PASS, sem erros de tipo.

- [ ] **Step 3: Verificar build mobile**

Run: `pnpm --filter web build:mobile`
Expected: PASS. (Confirma que `VITE_TARGET=mobile` resolve e o endpoint absoluto é usado.)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/appwrite.ts
git commit -m "feat(mobile): appwrite.ts usa resolveEndpoint (absoluto no app)"
```

---

## Task 4: Dependências e módulo nativo Capacitor

Adiciona os plugins Capacitor ao `apps/web` e cria `native.ts` (botão voltar Android → vue-router, status bar, esconder splash, helper `openExternal` pro navegador in-app). Carregado só no modo mobile, via import dinâmico que o Rollup remove (dead-code) do build web.

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/mobile/native.ts`
- Modify: `apps/web/src/main.ts`
- Modify: `apps/web/index.html` (viewport-fit)

- [ ] **Step 1: Instalar plugins Capacitor no apps/web**

Run:
```bash
pnpm --filter web add @capacitor/core @capacitor/app @capacitor/browser @capacitor/status-bar @capacitor/splash-screen
```
Expected: as 5 deps aparecem em `apps/web/package.json` → `dependencies`.

- [ ] **Step 2: Criar o módulo nativo**

`apps/web/src/mobile/native.ts`:

```ts
import type { Router } from 'vue-router'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

// Inicializa comportamentos nativos da casca Capacitor. Chamado só no modo mobile.
export async function initNative(router: Router): Promise<void> {
  // Botão "voltar" do Android: volta no histórico do vue-router; na raiz, sai.
  CapApp.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack && window.history.length > 1) {
      router.back()
    } else {
      CapApp.exitApp()
    }
  })

  // Status bar legível sobre o tema claro da loja.
  try {
    await StatusBar.setStyle({ style: Style.Light })
  } catch { /* status bar pode não existir no emulador; ignorar */ }

  // Esconde o splash quando a UI já montou.
  try {
    await SplashScreen.hide()
  } catch { /* ignorar */ }
}

// Abre uma URL externa (checkout do cartão MP) no navegador in-app, mantendo o
// app vivo por trás — o retorno é confirmado por polling do reconcile-orders.
export async function openExternal(url: string): Promise<void> {
  await Browser.open({ url })
}

// True quando rodando dentro da casca nativa (build mobile).
export const isMobile = import.meta.env.VITE_TARGET === 'mobile'
```

- [ ] **Step 3: Carregar o módulo no main.ts (guardado)**

Substituir o conteúdo de `apps/web/src/main.ts` por:

```ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
const head = createHead();

app.use(pinia);
app.use(router);
app.use(head);

app.mount('#app');

// Inicialização nativa: só no build mobile. A condição é estática (substituída
// em build), então o Rollup elimina este bloco — e as deps Capacitor — do
// bundle web.
if (import.meta.env.VITE_TARGET === 'mobile') {
  import('./mobile/native').then(({ initNative }) => initNative(router));
}
```

- [ ] **Step 4: Verificar que o build web NÃO inclui Capacitor**

Run: `pnpm --filter web build`
Expected: build OK. Confirmar tree-shaking:
`Select-String -Path "apps/web/dist/assets/*.js" -Pattern '@capacitor/app' -Quiet` deve retornar `False` (nada do Capacitor no bundle web).

- [ ] **Step 5: Verificar build mobile**

Run: `pnpm --filter web build:mobile`
Expected: build OK (o bloco nativo é incluído).

- [ ] **Step 6: Habilitar safe-area (notch/barras) no viewport**

Em `apps/web/index.html`, garantir que a meta viewport inclua `viewport-fit=cover` (necessário pro CSS `env(safe-area-inset-*)` valer). Localizar a tag e ajustar:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

> No Android v1 a status bar do Capacitor **não** sobrepõe o WebView por padrão (insets ≈ 0), então isto é inofensivo pra web e deixa a base pronta pro notch do iOS na fase 2. Se algum layout precisar de respiro, usar `padding: env(safe-area-inset-top)` nos containers fixos.

- [ ] **Step 7: Commit**

```bash
git add apps/web/package.json apps/web/src/mobile/native.ts apps/web/src/main.ts apps/web/index.html pnpm-lock.yaml
git commit -m "feat(mobile): plugins Capacitor + init nativo (voltar/status bar/splash/safe-area)"
```

---

## Task 5: Checkout do cartão via navegador in-app

No web, o cartão MP redireciona a aba (`window.location.href`) e volta lendo `sessionStorage`. No app não há "aba" pra onde voltar — abrimos o checkout no navegador in-app e confirmamos pelo polling do `reconcile-orders` que já existe, mantendo o `orderId` em memória (já é `orderId.value`).

**Files:**
- Modify: `apps/web/src/views/public/CheckoutView.vue:407-414`

- [ ] **Step 1: Ramo mobile no fluxo do cartão**

Em `apps/web/src/views/public/CheckoutView.vue`, localizar o bloco do cartão (linhas ~407–414):

```ts
    if (selectedMethod.value === 'CREDIT_CARD') {
      const url = funcData.payment?.initPoint ?? funcData.payment?.sandboxInitPoint ?? '';
      if (!url) throw new Error('Erro ao obter link de pagamento. Tente novamente.');
      sessionStorage.setItem('pending_order_id', funcData.order.$id ?? funcData.order.id);
      sessionStorage.setItem('mp_checkout_url', url);
      window.location.href = url;
      return;
    }
```

Substituir por:

```ts
    if (selectedMethod.value === 'CREDIT_CARD') {
      const url = funcData.payment?.initPoint ?? funcData.payment?.sandboxInitPoint ?? '';
      if (!url) throw new Error('Erro ao obter link de pagamento. Tente novamente.');
      if (import.meta.env.VITE_TARGET === 'mobile') {
        // App: abre o checkout no navegador in-app e confirma por polling.
        // orderId.value já está setado (em memória) — nada de sessionStorage.
        cardInitPoint.value = url;
        const { openExternal } = await import('@/mobile/native');
        await openExternal(url);
        step.value = 'card';
        startPolling();
        return;
      }
      sessionStorage.setItem('pending_order_id', funcData.order.$id ?? funcData.order.id);
      sessionStorage.setItem('mp_checkout_url', url);
      window.location.href = url;
      return;
    }
```

- [ ] **Step 2: Verificar build mobile**

Run: `pnpm --filter web build:mobile`
Expected: PASS — o import dinâmico de `@/mobile/native` resolve e tipa.

- [ ] **Step 3: Verificar build web**

Run: `pnpm --filter web build`
Expected: PASS — ramo mobile é dead-code; sem Capacitor no bundle web (recheque: `Select-String -Path "apps/web/dist/assets/*.js" -Pattern '@capacitor/browser' -Quiet` → `False`).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/views/public/CheckoutView.vue
git commit -m "feat(mobile): cartao MP via navegador in-app + polling no app"
```

---

## Task 6: Scaffold do pacote apps/mobile (Capacitor)

Cria a casca Capacitor que aponta pro `dist` do build mobile.

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/capacitor.config.ts`
- Create: `apps/mobile/.gitignore`

- [ ] **Step 1: Criar apps/mobile/package.json**

```json
{
  "name": "mobile",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build:web": "pnpm --filter web build:mobile",
    "sync": "pnpm build:web && cap sync android",
    "open": "cap open android",
    "run": "cap run android"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.2.0"
  },
  "dependencies": {
    "@capacitor/android": "^6.2.0",
    "@capacitor/core": "^6.2.0"
  }
}
```

- [ ] **Step 2: Criar apps/mobile/capacitor.config.ts**

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sitepedagogico.app',
  appName: 'Site Pedagógico',
  // Assets vêm do build mobile do apps/web (base relativa).
  webDir: '../web/dist',
  android: {
    // Embute os assets (não carrega URL remota) — é um app de verdade, não um
    // atalho pra site. Importante pra aprovação na Play.
    allowMixedContent: false,
  },
};

export default config;
```

- [ ] **Step 3: Criar apps/mobile/.gitignore**

```
# Build nativo (regenerável)
android/app/build/
android/build/
android/.gradle/
android/captures/
android/local.properties
android/app/release/

# Keystore — NUNCA versionar
*.keystore
*.jks
keystore.properties

# Assets copiados pelo cap sync (vêm do apps/web/dist)
android/app/src/main/assets/public/
```

- [ ] **Step 4: Instalar deps do workspace**

Run: `pnpm install`
Expected: `apps/mobile` é reconhecido como pacote do workspace; `@capacitor/cli`, `android`, `core` instalados.

- [ ] **Step 5: Gerar o build mobile (pré-requisito do cap sync)**

Run: `pnpm --filter web build:mobile`
Expected: `apps/web/dist` existe e atualizado.

- [ ] **Step 6: Adicionar a plataforma Android**

Run (a partir de `apps/mobile`): `pnpm exec cap add android`

> Nota pro executor: rodar dentro de `apps/mobile`. Em PowerShell, sem `cd` encadeado: usar `pnpm --filter mobile exec cap add android` a partir da raiz, ou abrir o diretório. O comando cria `apps/mobile/android/`.

Expected: cria `apps/mobile/android/` e roda um `cap sync` inicial copiando o `dist` pra `android/app/src/main/assets/public`.

- [ ] **Step 7: Commit (projeto Android versionado, sem build artifacts)**

```bash
git add apps/mobile/package.json apps/mobile/capacitor.config.ts apps/mobile/.gitignore apps/mobile/android pnpm-lock.yaml
git commit -m "feat(mobile): scaffold Capacitor + plataforma Android"
```

---

## Task 7: Ícone e splash a partir da logo

Gera ícones adaptativos e splash do Android a partir de uma imagem de origem (a logo atual).

**Files:**
- Create: `apps/mobile/resources/icon.png` (1024×1024, a logo)
- Create: `apps/mobile/resources/splash.png` (2732×2732, logo centralizada em fundo da marca)

- [ ] **Step 1: Colocar as imagens de origem**

Salvar a logo atual como `apps/mobile/resources/icon.png` (1024×1024, sem transparência nas bordas que vire fundo preto) e um `splash.png` (2732×2732, logo centralizada, fundo na cor da marca).

> Pro executor: a logo vive em `apps/web/public` ou `apps/web/src/assets`. Localizar com `Glob apps/web/**/logo*` e reaproveitar; se não houver tamanho adequado, sinalizar ao Wesley pra fornecer a arte 1024×1024.

- [ ] **Step 2: Gerar os assets**

Run (a partir de `apps/mobile`): `pnpm exec @capacitor/assets generate --android`

> `@capacitor/assets` roda via `pnpm dlx` se não instalado: `pnpm dlx @capacitor/assets generate --android` dentro de `apps/mobile`.

Expected: popula `android/app/src/main/res/` com `mipmap-*` (ícones) e `drawable-*`/`values` (splash).

- [ ] **Step 3: Sincronizar**

Run (a partir de `apps/mobile`): `pnpm exec cap sync android`
Expected: sync OK, sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/mobile/resources apps/mobile/android/app/src/main/res
git commit -m "feat(mobile): icone e splash a partir da logo"
```

---

## Task 8: Registrar a plataforma no Appwrite (CORS)

O Appwrite valida a origem (`Origin`/`Host`) contra as **Platforms** do projeto. Sem registrar a origem do app (`localhost`), as chamadas do WebView são bloqueadas por CORS. **Esta etapa é feita no Console do Appwrite** — criar platform exige escopo de console que a API key de projeto não tem.

**Files:** nenhum (config no servidor Appwrite).

- [ ] **Step 1: Adicionar a plataforma Web `localhost`**

No Console do Appwrite (`https://appwrite.wsgestao.digital`), projeto `6a1bc2b1000d09c3f5f1` → **Overview → Platforms → Add platform → Web app**:
- **Name:** `App Android (Capacitor)`
- **Hostname:** `localhost`

> Por que `localhost`: o WebView do Capacitor Android serve de `https://localhost`, então é esse o `Origin` das chamadas. (Hostname casa sem porta/esquema.)

- [ ] **Step 2: Documentar (não há commit de código)**

Anotar no checklist do projeto que a platform `localhost` foi adicionada. Sem alteração de repositório nesta task — registrar como feito.

> Nota: este passo precisa ser executado pelo Wesley (acesso ao Console). O executor deve **pausar e pedir confirmação** de que a platform foi criada antes da Task 9, pois o smoke de catálogo (Step de carregar produtos) falha por CORS sem ela.

---

## Task 9: Primeiro run no Android (dev e empacotado)

Roda o app no emulador/aparelho. **Requer Android Studio + JDK 17 instalados pelo Wesley.** Estes steps são de execução/observação manual no aparelho — o executor prepara, o Wesley roda e confirma.

**Files:** nenhum (validação).

- [ ] **Step 1: Confirmar pré-requisitos**

Android Studio instalado, um emulador (AVD) criado **ou** um aparelho com depuração USB. `pnpm exec cap doctor` (em `apps/mobile`) deve listar Android sem erros críticos.

- [ ] **Step 2: Sync do build empacotado**

Run (em `apps/mobile`): `pnpm run sync`
Expected: roda `build:mobile` + `cap sync android` sem erro.

- [ ] **Step 3: Rodar no dispositivo**

O Wesley roda (pode usar `!` no chat): `pnpm --filter mobile exec cap run android`
Expected: app **"Site Pedagógico"** abre no emulador/aparelho com ícone/splash, mostrando a home da loja.

- [ ] **Step 4: Smoke de cliente (manual, confirmar cada item)**

- [ ] Catálogo carrega (sem erro de CORS → confirma a Task 8).
- [ ] Login email/senha entra; fechar e reabrir o app mantém logado (persistência de sessão no WebView — risco do design §4.6).
- [ ] Página de produto abre.
- [ ] PIX: gera QR/copia-e-cola; pagando um pedido de teste, o status vira PAID via polling.
- [ ] Cartão: abre o MP no navegador in-app; ao voltar, o polling confirma o pagamento.
- [ ] "Meus Downloads": baixar um produto comprado funciona (download via JWT — design §4.2).
- [ ] Botão "voltar" do Android navega e, na raiz, sai do app.

- [ ] **Step 5: Smoke de admin (manual)**

- [ ] Login de admin (`leleses8@gmail.com`) abre o painel (label `admin` presente na sessão).
- [ ] Pesquisar pedido por nome do cliente funciona.
- [ ] Cadastrar um produto de teste com capa + PDF: o seletor nativo de arquivos abre e o upload conclui (buckets já têm `create(label:admin)`).

> Se a sessão não persistir (Step 4, item 2): o fallback de localStorage do SDK Appwrite deve cobrir; investigar antes de seguir pro release. Risco mapeado no design.

- [ ] **Step 6: Sem commit (validação)** — registrar resultados do smoke. Bugs viram tasks de correção.

---

## Task 10: Keystore e AAB assinado pra Play

Gera o artefato de release. **A keystore é gerada e guardada pelo Wesley** — perdê-la impede atualizar o app na Play.

**Files:**
- Create (local, NÃO versionado): `apps/mobile/android/sitepedagogico.keystore`
- Create (local, NÃO versionado): `apps/mobile/android/keystore.properties`

- [ ] **Step 1: Gerar a keystore (Wesley roda)**

```bash
keytool -genkey -v -keystore sitepedagogico.keystore -alias sitepedagogico -keyalg RSA -keysize 2048 -validity 10000
```
Guardar a senha num gerenciador. **Backup em local seguro.** Confirmar que `*.keystore`/`keystore.properties` estão no `.gitignore` (Task 6).

- [ ] **Step 2: Criar apps/mobile/android/keystore.properties (local, não versionado)**

```
storeFile=sitepedagogico.keystore
storePassword=SENHA_DO_STORE
keyAlias=sitepedagogico
keyPassword=SENHA_DA_KEY
```

- [ ] **Step 3: Configurar assinatura no Gradle**

Em `apps/mobile/android/app/build.gradle`, dentro de `android { }`, antes de `buildTypes`:

```gradle
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
```

E no bloco `buildTypes.release`, adicionar `signingConfig signingConfigs.release`:

```gradle
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
```

> `keystore.properties` fica em `apps/mobile/android/` (= `rootProject` do Gradle Android). Não versionar.

- [ ] **Step 4: Definir versão do app**

Em `apps/mobile/android/app/build.gradle`, dentro de `defaultConfig`, garantir:

```gradle
        versionCode 1
        versionName "1.0.0"
```

(Cada envio futuro à Play exige `versionCode` incrementado.)

- [ ] **Step 5: Sync + gerar o AAB**

Run (em `apps/mobile`): `pnpm run sync`
Depois (em `apps/mobile/android`): `./gradlew bundleRelease` (Windows: `.\gradlew.bat bundleRelease`)
Expected: gera `apps/mobile/android/app/build/outputs/bundle/release/app-release.aab` assinado.

- [ ] **Step 6: Commit (só a config de assinatura, sem segredos)**

```bash
git add apps/mobile/android/app/build.gradle
git commit -m "build(mobile): assinatura de release + versao 1.0.0"
```

> Confirmar com `git status` que `keystore.properties` e `*.keystore` **não** entraram no commit.

---

## Task 11: Fechamento — docs e memória

**Files:**
- Modify: `docs/superpowers/specs/2026-06-10-mobile-app-capacitor-design.md:4`

- [ ] **Step 1: Atualizar status do spec**

Em `docs/superpowers/specs/2026-06-10-mobile-app-capacitor-design.md`, linha 4, trocar:

```
**Status:** Aprovado para planejamento
```

por:

```
**Status:** Implementado (v1 Android) — ver docs/superpowers/plans/2026-06-10-mobile-app-capacitor.md
```

- [ ] **Step 2: Registrar memória do projeto**

Criar `C:\Users\wesle\.claude\projects\C--Users-wesle-Desktop-clone-2-pedago-shop\memory\project_mobile_app.md` (type: project) resumindo: app Capacitor em `apps/mobile`, build via `VITE_TARGET=mobile` (base relativa + endpoint absoluto), platform `localhost` no Appwrite pra CORS, cartão via navegador in-app + polling, keystore fora do git. Adicionar a linha no `MEMORY.md`. Linkar `[[project_appwrite_proxy]]`, `[[project_admin_label_permissions]]`, `[[project_download_auth_jwt]]`.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-06-10-mobile-app-capacitor-design.md
git commit -m "docs(mobile): marcar design como implementado (v1 Android)"
```

---

## Pré-requisitos do Wesley (fora do código)

- **Android Studio + JDK 17** instalados (Task 9).
- **Conta Google Play Console** (US$25, único) pra publicar o AAB (Task 10).
- **Logo 1024×1024** pro ícone, se a arte atual não servir (Task 7).
- **Keystore** gerada e guardada com backup seguro (Task 10).
- **Platform `localhost`** adicionada no Console do Appwrite (Task 8) — bloqueante pro smoke.
- **Política de privacidade**: já existe a rota `/politica-privacidade`; usar essa URL no cadastro da Play.

## Riscos (do design)
- Sessão Appwrite não persistir no WebView → validar cedo (Task 9 Step 4); fallback localStorage do SDK.
- Rejeição na Play por "site empacotado" → assets embutidos + ícone/splash/voltar nativos (mitigado no design).
- Política de digital goods → só relevante no iOS (fase 2).
