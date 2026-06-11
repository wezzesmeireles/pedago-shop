# Design — Push de vendas pro admin (FCM + Appwrite Messaging)

**Data:** 2026-06-11
**Status:** Aprovado para implementação
**Autor:** Wesley + Claude

## 1. Objetivo
Enviar uma **notificação push nativa no Android** para **todo admin logado no app**
a cada **venda paga** (PIX/cartão), espelhando a notificação de Telegram que já
existe — e **mantendo** o Telegram. iOS é fase 2.

## 2. Arquitetura
Motor de envio: **Appwrite Messaging** com provider **FCM** (Firebase é o
"carteiro" obrigatório do Android). Projeto Firebase: `projeto-messas`, pacote
`com.sitepedagogico.app`.

```
App (admin loga no mobile) → pede permissão → pega token FCM
   → account.createPushTarget(token)  (registra o aparelho no usuário Appwrite)

Venda paga → reconcile-orders / mp-webhook
   → após o claim atômico paid_<orderId> (junto do notifyTelegram)
   → messaging.createPush(users = [ids dos admins]) → FCM → celular do admin
```

Enviar por **lista de usuários admin** (não por tópico): a função consulta
`profiles` com `role=ADMIN`, pega os `userId`, e chama `createPush(users=...)`.
O Appwrite entrega em todos os push targets desses usuários. Sem gerência de
tópico/inscrição.

## 3. Componentes

### 3.1 Firebase (pré-requisito, feito)
- `google-services.json` → vai em `apps/mobile/android/app/`.
- Conta de serviço (JSON) → vira o **FCM provider** no Appwrite.

### 3.2 Appwrite
- **FCM provider** no Messaging (config a partir da conta de serviço).
- Sem coleção nova: os tokens viram **push targets** nos usuários (modelo nativo
  do Appwrite Messaging). Envio por `users=[adminIds]`.

### 3.3 App (`apps/web` + casca `apps/mobile`)
- Plugin `@capacitor/push-notifications`.
- Módulo `apps/web/src/mobile/push.ts` (carregado só no modo mobile):
  ao detectar **sessão de admin**, `requestPermissions()` (Android 13+ runtime),
  `register()`, no evento `registration` pega o token e chama
  `account.createPushTarget(unique, token)` (idempotente por token).
- Toque na notificação (`pushNotificationActionPerformed`) → `router.push('/admin/pedidos')`.
- Push em foreground: opcional, um toast leve; não bloqueia.
- Só dispara registro pra **admin** (profile.role ADMIN / label admin).

### 3.4 Funções (`reconcile-orders`, `mp-webhook`)
- Helper `sendAdminPush(title, body)` usando `node-appwrite` Messaging:
  consulta admins (profiles role=ADMIN → userId), `messaging.createPush(id, title,
  body, [], adminUserIds)`.
- Chamado **dentro do mesmo `if (claim)`** onde o Telegram dispara → herda a
  deduplicação (`paid_<orderId>`), sem push duplicado.
- Falha de push é **engolida** (try/catch) — nunca quebra o fluxo do pedido nem
  o Telegram.

## 4. Conteúdo da notificação
- Título: `🎉 Nova venda — R$ X,XX`
- Corpo: `Pedido #N — <primeiro nome do cliente>`
- Sem dado sensível pesado (passa pelos servidores do Google).
- `data: { route: '/admin/pedidos', orderId }` pro toque abrir o painel.

## 5. Escopo
**v1:** Android; registro no login de admin; push por venda paga; toque abre
pedidos. Telegram mantido.
**Fora (fase 2):** iOS/APNS; preferência de ligar/desligar push por admin;
push pra cliente (status do pedido).

## 6. Riscos e mitigações
| Risco | Mitigação |
|---|---|
| Permissão negada (Android 13+) | Pede no login; se negar, segue sem push (Telegram cobre) |
| Token renova/expira | Re-registra a cada login; createPushTarget idempotente por token |
| Appwrite Messaging push com arestas | Validar cedo com um envio de teste antes de fechar |
| Provider FCM exige Console | Tentar criar via API (migration key); se 401, Wesley cola no Console |
| Play re-assina o app | Não afeta FCM (afeta só App Links) |

## 7. Pré-requisitos do usuário
- Firebase já criado (`projeto-messas`) e os 2 arquivos entregues. ✓
- Se a criação do provider exigir Console: colar a conta de serviço em
  Messaging → Providers → FCM (eu guio).
