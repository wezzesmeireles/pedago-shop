# Documentação — Otimização de Performance (15/06/2026)

Resumo de todas as otimizações de carregamento implementadas em **15/06/2026**: bundle splitting, eliminação de polyfills desnecessários, lazy loading de componentes e imagens, cache de configuração no localStorage e remoção de imagens de placeholder incorretas.

---

## Índice

1. [Resultado final](#resultado-final)
2. [Bundle splitting (Vite manualChunks)](#bundle-splitting-vite-manualchunks)
3. [Eliminação de polyfills modernos](#eliminação-de-polyfills-modernos)
4. [CSS — remoção do plugin typography](#css--remoção-do-plugin-typography)
5. [Fontes Google — carregamento assíncrono](#fontes-google--carregamento-assíncrono)
6. [Cache do site config no localStorage](#cache-do-site-config-no-localstorage)
7. [Banners padrão — remoção das imagens picsum](#banners-padrão--remoção-das-imagens-picsum)
8. [Imagens — lazy loading e prioridade](#imagens--lazy-loading-e-prioridade)
9. [Componentes — carregamento assíncrono](#componentes--carregamento-assíncrono)
10. [Preconnect para Appwrite](#preconnect-para-appwrite)
11. [Cache de assets no Vercel](#cache-de-assets-no-vercel)
12. [Arquivos modificados](#arquivos-modificados)

---

## Resultado final

| Métrica | Antes | Depois | Economia |
|---|---|---|---|
| JS inicial (gzip, browser moderno) | ~101 kB | ~72 kB | −29 kB |
| Polyfills (browsers modernos) | 34 kB | 0 | −34 kB |
| CSS global (gzip) | 18 kB | 16.5 kB | −1.5 kB |
| **Total download inicial** | **~153 kB** | **~88.5 kB** | **−42%** |
| `PublicLayout.js` (gzip) | 14.8 kB | 9.8 kB | −5 kB |
| `ProductCard.js` (gzip) | 6.7 kB | 2.7 kB | −4 kB |

Além do peso, a percepção de velocidade melhorou com:
- Config do site carregando instantâneo do localStorage em revisitas
- Skeleton no lugar do logo/banner enquanto Appwrite responde
- Fontes não bloqueando a primeira pintura

---

## Bundle splitting (Vite manualChunks)

**Problema:** O chunk `index.js` de 192 kB (66 kB gzip) continha Vue + Pinia + Vue Router + Appwrite SDK + `@vueuse/head` — tudo junto. Qualquer mudança no código do app invalidava o cache de 66 kB inteiro no browser do usuário.

**Solução:** `build.rollupOptions.output.manualChunks` em `vite.config.ts` divide em 4 chunks independentes:

| Chunk | Conteúdo | Tamanho gzip |
|---|---|---|
| `vendor-vue` | Vue + Vue Router + Pinia | 43.6 kB |
| `vendor-appwrite` | Appwrite SDK | 8.6 kB |
| `vendor-misc` | Demais dependências | 11.6 kB |
| `vendor-vueuse` | @vueuse/head | ~0 kB |
| `index` | Código da aplicação | 8 kB |

Agora, quando o código do app muda, o browser re-baixa apenas os 8 kB do `index.js`. Os vendors ficam em cache por 1 ano.

---

## Eliminação de polyfills modernos

**Problema:** `legacy({ modernPolyfills: true })` gerava um chunk `polyfills.js` de 85 kB (34 kB gzip) que era carregado por **todos** os browsers, incluindo Chrome/Safari/Firefox modernos que não precisam de polyfill algum.

**Solução:** `modernPolyfills: false` em `vite.config.ts`. O bundle legacy (para browsers antigos) continua existindo com seus próprios polyfills. Browsers modernos não carregam mais nada extra.

---

## CSS — remoção do plugin typography

**Problema:** `@tailwindcss/typography` gerava ~40 kB de estilos `prose-*` no CSS global, mas era usado em **apenas uma página** (`PrivacyView.vue`), e mesmo nela as classes `prose prose-gray` não estavam fazendo efeito prático — todo o conteúdo já tinha classes Tailwind explícitas.

**Solução:**
1. Removido `require('@tailwindcss/typography')` de `tailwind.config.ts`
2. Removido `prose prose-gray` do wrapper em `PrivacyView.vue`

---

## Fontes Google — carregamento assíncrono

**Problema:** O `<link rel="stylesheet">` para Google Fonts (Inter + Fredoka) é render-blocking — o browser pausa a pintura inicial até baixar o CSS de fontes.

**Solução:** Técnica de preload assíncrono:

```html
<link rel="preload" href="https://fonts.googleapis.com/css2?..." as="style"
      onload="this.onload=null;this.rel='stylesheet'" />
<noscript><link rel="stylesheet" href="..." /></noscript>
```

O browser baixa o CSS de fontes em background. O texto aparece primeiro com font do sistema (swap automático via `display=swap`), depois troca para Inter/Fredoka. A primeira pintura não espera mais pelas fontes.

---

## Cache do site config no localStorage

**Problema raiz dos flashes:** `siteConfig.fetch()` é chamado no `onMounted` do `App.vue`. O Vue monta toda a árvore de componentes com o `DEFAULT_SITE_CONFIG` (nome "sitepedagogico", sem logo, cores padrão) e só depois dispara o fetch ao Appwrite. Durante essa janela, o usuário via o estado padrão piscar.

**Solução:** Cache em `localStorage` com chave `sp_site_cfg_v1`:

```
1ª visita:
  → sem cache → mostra skeleton no logo/banner
  → Appwrite responde → renderiza config real → salva no localStorage

2ª visita em diante:
  → lê localStorage → renderiza config real IMEDIATAMENTE (loaded = true)
  → Appwrite atualiza em background → salva cache atualizado
```

**Arquivo:** `apps/web/src/stores/site-config.store.ts`

Funções `readCache()` e `writeCache()` fazem o gerenciamento. O `update()` do admin também atualiza o cache para que mudanças via painel reflitam imediatamente na próxima visita.

---

## Banners padrão — remoção das imagens picsum

**Problema:** `DEFAULT_SITE_CONFIG.banners` tinha URLs `https://picsum.photos/seed/pedagogo1/1600/600` como placeholders. Essas imagens aleatórias de banco de fotos apareciam durante o carregamento inicial antes do config do Appwrite chegar.

**Solução:** `imageUrl: ''` nos 3 banners padrão em `packages/shared/src/types/site-config.types.ts`. O template já tinha `v-else` com fallback de gradiente animado — que é a aparência correta quando não há imagem configurada.

Adicionalmente, o carousel de banners no `HomeView.vue` agora mostra um skeleton `animate-pulse` enquanto `siteConfigStore.loaded === false`, e só renderiza o carousel (com setas e dots) depois que o config chegou.

---

## Imagens — lazy loading e prioridade

**Banner principal (LCP):**
- `loading="eager"` + `fetchpriority="high"` no primeiro slide
- Slides subsequentes: `loading="lazy"`

**Logo no header:**
- `fetchpriority="high"` + `decoding="async"` — é o elemento de maior importância visual acima do fold

**Imagem do produto em destaque (HomeView):**
- `loading="lazy"` + `decoding="async"` — está abaixo do fold

---

## Componentes — carregamento assíncrono

### CartDrawer e CartFab

Antes importados estaticamente em `PublicLayout.vue`, entravam no chunk do layout e eram instanciados em toda página pública, mesmo quando o usuário nunca abre o carrinho.

```typescript
// Antes
import CartDrawer from '@/components/catalog/CartDrawer.vue';

// Depois
const CartDrawer = defineAsyncComponent(() => import('@/components/catalog/CartDrawer.vue'));
```

O `CartDrawer` só é montado quando `cart.isOpen` é `true` (já controlado por `v-if`). O `CartFab` só aparece quando necessário. Resultado: `PublicLayout.js` encolheu de 57 kB para 35 kB (14.8 → 9.8 kB gzip).

### canvas-confetti

Importado estaticamente em `useConfetti.ts` e puxado para o chunk do `ProductCard` (25 kB de biblioteca só para efeito visual).

```typescript
// Antes
import confetti from 'canvas-confetti';

// Depois — carrega na primeira vez que o usuário adiciona algo ao carrinho
let confettiModule: typeof import('canvas-confetti') | null = null;
async function getConfetti() {
  if (!confettiModule) confettiModule = await import('canvas-confetti');
  return confettiModule.default;
}
```

`ProductCard.js` encolheu de 17 kB para 6.7 kB (6.7 → 2.7 kB gzip).

---

## Preconnect para Appwrite

Adicionado em `index.html`:

```html
<link rel="preconnect" href="https://appwrite.wsgestao.digital" />
<link rel="dns-prefetch" href="https://appwrite.wsgestao.digital" />
```

O browser resolve DNS e estabelece a conexão TLS com o Appwrite enquanto ainda está processando o JavaScript. Reduz a latência da primeira chamada API.

---

## Cache de assets no Vercel

Adicionado `Cache-Control: public, max-age=31536000, immutable` para `/assets/*` no `vercel.json`. Seguro porque o Vite gera nomes com hash de conteúdo — qualquer mudança gera um novo filename.

```json
"headers": [
  {
    "source": "/assets/(.*)",
    "headers": [
      { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
    ]
  }
]
```

Em revisitas, o browser não faz request algum para os assets — usa o cache local diretamente.

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `apps/web/vite.config.ts` | `manualChunks`, `modernPolyfills: false` |
| `apps/web/index.html` | Fontes assíncronas, `preconnect` Appwrite |
| `apps/web/tailwind.config.ts` | Removido `@tailwindcss/typography` |
| `apps/web/src/stores/site-config.store.ts` | Cache localStorage |
| `apps/web/src/components/layout/PublicLayout.vue` | CartDrawer/CartFab async, skeleton logo |
| `apps/web/src/composables/useConfetti.ts` | Import dinâmico do canvas-confetti |
| `apps/web/src/views/public/HomeView.vue` | Skeleton banner, lazy/fetchpriority imagens |
| `apps/web/src/views/public/PrivacyView.vue` | Removido `prose prose-gray` |
| `packages/shared/src/types/site-config.types.ts` | Removidas URLs picsum dos banners padrão |
| `vercel.json` | Cache 1 ano para `/assets/*` |
