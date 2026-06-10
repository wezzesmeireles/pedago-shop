# Design — App mobile (Capacitor) da loja Site Pedagógico

**Data:** 2026-06-10
**Status:** Em implementação (v1 Android) — código pronto (build mobile, endpoint
absoluto, plugins nativos, cartão in-app, scaffold Capacitor + Android). Pendente:
arte do ícone 1024×1024, platform `localhost` no Appwrite, run no device, keystore
e AAB. Plano: `docs/superpowers/plans/2026-06-10-mobile-app-capacitor.md`.
**Autor:** Wesley + Claude

## 1. Objetivo

Transformar a loja web existente (`apps/web`, Vue 3 + Vite) em um **aplicativo
nativo Android** publicável na **Google Play**, reaproveitando o máximo do código
e do backend atuais. O iOS (App Store) é uma **fase 2** — a estrutura fica
preparada, mas não é construída agora.

O app atende **todos os públicos**: clientes (vitrine, compra, downloads) **e**
administradores (painel de pedidos/produtos), exatamente como hoje na web, com as
áreas protegidas por login e papel (`label:admin`).

## 2. Decisões fechadas

| Tema | Decisão |
|---|---|
| Abordagem | **Capacitor** empacotando o build Vue existente |
| Plataforma | **Android primeiro**; iOS na fase 2 |
| Estrutura | Novo pacote **`apps/mobile`** no monorepo, consumindo o build do `apps/web` |
| Pagamento | **Mercado Pago mantido** dentro do app ("converter", sem In-App Purchase) |
| Público | **Cliente + Admin** (mesmo app, gated por login/papel) |
| Identidade | Reaproveitar a identidade visual atual (logo → ícone/splash) |

### Risco aceito (digital goods)
Vender conteúdo digital com Mercado Pago dentro do app contraria a política de
in-app purchase das lojas. No **Android** o risco é baixo (Google é mais tolerante
e há pressão regulatória no Brasil). No **iOS** esse modelo provavelmente precisará
ser revisto — por isso o iOS não é construído sobre o checkout MP nesta fase.

## 3. Arquitetura

```
apps/
  web/      ← Vue 3 + Vite (fonte única da aplicação)
  mobile/   ← NOVO — casca Capacitor
    capacitor.config.ts   appId com.sitepedagogico.app, webDir → ../web/dist
    android/              projeto Android nativo (versionado)
    package.json          scripts de build/sync/run
    resources/            ícone e splash de origem
```

O `apps/mobile` **não duplica código de UI**. Ele:
1. dispara o build do `apps/web` num **modo "mobile"** (flag de ambiente);
2. aponta o `webDir` do Capacitor para o `dist` resultante;
3. roda `cap sync android` para empacotar os assets na casca nativa.

## 4. Ajustes técnicos necessários

Um wrap ingênuo quebraria nos pontos abaixo. O design os resolve explicitamente.

### 4.1 Build em origem local
Capacitor serve a UI de `https://localhost`. O Vite precisa gerar **caminhos
relativos** (`base: './'`) no modo mobile. Introduzir um modo de build
(`--mode mobile` / `VITE_TARGET=mobile`) que ajusta `base` e variáveis de
endpoint sem afetar o build web normal.

### 4.2 Endpoint do Appwrite absoluto
Hoje `apps/web/src/lib/appwrite.ts` **troca o host pelo `window.location.origin`**
de propósito (proxy de mesma origem para furar firewall de escolas). No app,
`window.location.origin` = `https://localhost`, gerando `https://localhost/v1`
(inexistente).

**Solução:** no modo mobile, **não** fazer a troca de host — usar o endpoint
**absoluto** `https://sitepedagogico.com.br/v1` (mantém o proxy Vercel anti-firewall).
A detecção pode ser por flag de build (`VITE_TARGET=mobile`) ou por
`Capacitor.isNativePlatform()`. O mesmo endpoint absoluto vale para a montagem da
URL de download de arquivos (que hoje também deriva de `endpoint`).

### 4.3 CORS / Plataforma no Appwrite
O Appwrite valida a origem das chamadas contra as **Platforms** registradas.
É preciso **registrar a plataforma do app** (hostname `localhost`) no projeto
Appwrite (`6a1bc2b1000d09c3f5f1`), senão as chamadas do app são bloqueadas por CORS.

### 4.4 Fluxos com redirect (cartão MP e login Google)
Dois fluxos saem do app via redirect e precisam "voltar pra dentro":

- **PIX:** sem redirect — QR/copia-e-cola + polling do `reconcile-orders`.
  Funciona dentro do app sem mudança.
- **Cartão (Mercado Pago):** hoje redireciona para o MP e volta lendo
  `sessionStorage` (`pending_order_id`) + query (`collection_id`). No app:
  abrir o checkout MP no **navegador in-app** (plugin `@capacitor/browser`) e
  confirmar pelo **polling do `reconcile-orders` que já existe**, mantendo o
  `orderId` em **estado em memória** (não `sessionStorage`). Deep link nativo de
  retorno fica para a fase 2.
- **Login Google (OAuth):** mesmo problema de redirect. Para a v1, o caminho
  confiável é **email/senha** (funciona direto no WebView). O Google OAuth via
  navegador in-app/deep link é tratado junto do deep link na **fase 2** — na v1
  o botão Google pode ficar oculto no app se o fluxo não estabilizar.

### 4.5 Casca nativa
- Ícone do app e splash gerados a partir da logo atual.
- Botão "voltar" do Android ligado ao `vue-router` (`@capacitor/app` `backButton`
  → `router.back()`, ou sair do app na raiz).
- Status bar e **safe-area insets** (CSS `env(safe-area-inset-*)`) para notch/
  barra de navegação.
- Splash screen plugin para a abertura.

### 4.6 Persistência de sessão no WebView
O SDK web do Appwrite guarda sessão em cookie/localStorage. No WebView do
Capacitor (origem `localhost`), validar **cedo** que a sessão persiste entre
reinícios do app; se o cookie for efêmero, garantir o fallback de localStorage do
SDK. Risco a confirmar no início da implementação.

### 4.7 Admin dentro do app
As rotas `/admin` entram no bundle. O cadastro de produto usa
`<input type="file">`, que no WebView Android abre o **seletor nativo** (inclui
PDFs via app Arquivos). As permissões de upload (`create(label:admin)` nos buckets
`product-files`/`product-covers`) já foram corrigidas e cobrem o app, desde que a
sessão do admin no app carregue o label `admin`.

## 5. Escopo

### Entra na v1
- Pacote `apps/mobile` com Capacitor + projeto Android versionado.
- Modo de build mobile no `apps/web` (base relativa + endpoint absoluto).
- Plataforma `localhost` registrada no Appwrite (CORS).
- Casca nativa: ícone, splash, botão voltar, status bar/safe-areas.
- Fluxos de cliente no app: login (email/senha), catálogo, produto, checkout
  (PIX no app; cartão via navegador in-app + polling), "Meus Downloads".
- Painel admin no app: pedidos, produtos (com upload de capa/PDF), reconciliação.
- **AAB assinado** pronto para upload na Play.

### Fica para a fase 2
- App iOS (App Store).
- Notificações push.
- Deep link nativo para retorno do cartão e do login Google.
- Atualização OTA dos assets web (live updates).
- In-App Purchase.

## 6. Pré-requisitos do usuário (fora do código)
- Conta **Google Play Console** (US$25, pagamento único).
- **Política de privacidade** publicada — já existe a rota `/politica-privacidade`
  na web; usar essa URL no cadastro da Play.
- Confirmar **nome do app** (proposto: "Site Pedagógico") e **ícone** (logo atual).
- **Keystore** de assinatura (gerar e guardar com segurança — perdê-la impede
  atualizar o app na Play).

## 7. Estratégia de testes
- **Iteração:** `cap run android` com live-reload apontando para o dev server.
- **Validação no build empacotado (produção):**
  - Login email/senha persiste após fechar/abrir o app.
  - Chamadas Appwrite funcionam (sem erro de CORS) — catálogo carrega.
  - Compra PIX de ponta a ponta em um pedido de teste (status vira PAID via polling).
  - Compra cartão: abre MP no navegador in-app, volta e confirma via polling.
  - Download de um produto comprado funciona.
  - Admin: login admin vê o painel; cadastra um produto com capa+PDF (upload OK).
  - Botão "voltar" do Android navega corretamente e sai do app na raiz.
- **Dispositivos:** ao menos 1 emulador + 1 aparelho físico Android.

## 8. Riscos e mitigações
| Risco | Mitigação |
|---|---|
| Rejeição na Play por "site empacotado" | Embutir assets (não carregar URL), ícone/splash/back nativos, app instalável de verdade |
| Sessão Appwrite não persiste no WebView | Validar cedo; usar fallback localStorage do SDK |
| Retorno do cartão MP não volta ao app | Navegador in-app + polling por `orderId` em memória (sem depender de sessionStorage) |
| Login Google quebra no WebView | Priorizar email/senha na v1; OAuth via deep link na fase 2 |
| Política de digital goods (iOS) | iOS adiado; reavaliar IAP antes da App Store |
