# Design — Broadcast de push (admin → todos os usuários)

**Data:** 2026-06-11
**Status:** Aprovado para implementação
**Autor:** Wesley + Claude

## 1. Objetivo
Permitir que o **admin** envie uma notificação push (publicidade/aviso) para
**todos os usuários** do app, a partir de uma tela no painel. Reaproveita a infra
de FCM + Appwrite Messaging já existente.

## 2. Mudança-chave: todos registram token
Hoje só o **admin** registra o token FCM. Para alcançar todos, **qualquer usuário
logado** no app passa a registrar (o cliente vê o pedido de permissão uma vez ao
logar). Quem negar, não recebe. Separação:
- **Venda paga** → push só pros admins (`users=[adminIds]`, já existente).
- **Broadcast** → push pra todos (novo, manual pelo admin).

## 3. Componentes

### 3.1 App
- `auth.store.fetchMe`: registrar push para **todo** usuário logado no modo mobile
  (remover o gate `role==='ADMIN'`). `push.ts` `registerAdminPush` → `registerPush`.
- `setupPushTap`: navega pra `data.route`; **default `/`** (home) — o push de venda
  manda `route='/admin/pedidos'` explícito; o broadcast manda o link ou `/`.

### 3.2 Backend — `admin-ops`, ação `broadcast-push`
- AuthZ já existe (chamador precisa ter label `admin`).
- Entrada: `{ action:'broadcast-push', title, body, link? }`.
- Varre todos os `profiles` (paginado) → `userId`s; envia `messaging.createPush`
  em **lotes de 100** usuários, `data = { route: link || '/' }`.
- Retorna `{ ok:true, users: <total>, batches: <n> }`. Usuários sem token são
  ignorados pelo Appwrite (sem erro).

### 3.3 Admin UI — `NotificationsView.vue`
- Rota `/admin/notificacoes` + item no menu admin.
- Campos: **Título** (obrigatório), **Mensagem** (obrigatório), **Link (opcional)**.
- Botão **"Enviar para todos"** → confirmação → invoca `admin-ops` →
  mostra "Enviado para N usuários".
- Aviso: "só usuários com o app e notificações ativas recebem".

## 4. Conteúdo / toque
- Título + mensagem livres (definidos pelo admin).
- Toque: `link` preenchido → abre esse destino no app; vazio → home/catálogo.

## 5. Escopo
**v1:** envio manual imediato pra todos; link opcional; só admin envia.
**Fora (fase 2):** agendamento, segmentação (ex.: quem comprou X), imagem no push,
histórico de campanhas, opt-out por usuário.

## 6. Riscos e mitigações
| Risco | Mitigação |
|---|---|
| Permissão negada pelo cliente | Pede no login; quem negar não recebe (esperado) |
| Muitos usuários (limite/30s da função) | Lotes de 100; base atual cabe. Topics fica pra escala futura |
| Envio acidental pra todos | Confirmação explícita na tela antes de enviar |
| Spam/abuso | Só admin (label) dispara; checado no servidor |
