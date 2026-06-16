import { Client, Databases, ID, Query, Permission, Role, Messaging } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function dtBR(iso) { try { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) } catch { return iso } }
  async function sendTelegram(token, chatId, html) {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML' }),
    })
    if (!r.ok) {
      const err = await r.text()
      log(`Telegram HTML error ${r.status}: ${err}`)
      const plain = html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: plain }),
      })
    }
  }
  async function geolocate(ip) {
    if (!ip || ip === '::1' || /^(127\.|10\.|192\.168\.)/.test(ip)) return ''
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 800)
      const r = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,countryCode`, { signal: ctrl.signal })
      clearTimeout(timer)
      const geo = await r.json()
      return geo.status === 'success' ? [geo.city, geo.regionName, geo.countryCode].filter(Boolean).join(', ') : ''
    } catch { return '' }
  }

  let body = {}
  try {
    body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {}
  } catch {}
  const specificOrderId = body?.orderId
  const linkPhone = body?.linkPhone
  const linkUserId = body?.linkUserId

  // ── Vinculação de pedidos guest por telefone ─────────────────────────────
  // Chamado pelo frontend após login/registro com conta que tem telefone.
  // Migra pedidos anônimos com guestPhone == linkPhone para o userId real,
  // atualizando as permissões de leitura no banco (requer API key, server-side).
  if (linkPhone && linkUserId) {
    let linked = 0
    try {
      const guestOrders = await db.listDocuments(DB, 'orders', [
        Query.equal('guestPhone', linkPhone),
        Query.notEqual('userId', linkUserId), // já vinculados → sem re-trabalho
        Query.limit(100),
      ])

      for (const order of guestOrders.documents) {
        try {
          await db.updateDocument(DB, 'orders', order.$id,
            { userId: linkUserId, updatedAt: new Date().toISOString() },
            [Permission.read(Role.user(linkUserId))]
          )

          const items = await db.listDocuments(DB, 'order_items', [
            Query.equal('orderId', order.$id), Query.limit(50),
          ])
          for (const item of items.documents) {
            await db.updateDocument(DB, 'order_items', item.$id, {},
              [Permission.read(Role.user(linkUserId))]
            )
            const tokens = await db.listDocuments(DB, 'download_tokens', [
              Query.equal('orderItemId', item.$id), Query.limit(50),
            ])
            for (const token of tokens.documents) {
              await db.updateDocument(DB, 'download_tokens', token.$id, {},
                [Permission.read(Role.user(linkUserId))]
              )
            }
          }
          linked++
          log(`Linked order ${order.orderNumber} → user ${linkUserId}`)
        } catch (err) {
          log(`Link failed for order ${order.$id}: ${err.message}`)
        }
      }
    } catch (err) {
      log('linkPhone query failed: ' + err.message)
    }
    return res.json({ linked })
  }

  // Read config from site_config (MP token + Telegram)
  let mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  let siteConfig = {}
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    siteConfig = JSON.parse(cfg.value)
    if (siteConfig.mercadoPagoAccessToken) mpToken = siteConfig.mercadoPagoAccessToken
  } catch {}

  // Most payments are confirmed here (the MP webhook rarely fires), so send the
  // Telegram notification from this path too — otherwise no one gets notified.
  async function notifyTelegram(text) {
    try {
      if (!siteConfig.telegramBotToken) return
      const recipients = siteConfig.telegramRecipients ?? []
      const chatIds = recipients.length > 0
        ? recipients.map(r => r.chatId)
        : (siteConfig.telegramChatId ? [siteConfig.telegramChatId] : [])
      for (const chatId of chatIds) {
        await sendTelegram(siteConfig.telegramBotToken, chatId, text)
      }
    } catch (err) { log('Telegram failed: ' + err.message) }
  }

  // Push nativo pro app do admin (FCM via Appwrite Messaging). Espelha o
  // Telegram: enviado pra todos os usuários com role ADMIN (cada aparelho do
  // admin é um push target). Best-effort: falha aqui nunca quebra o pedido.
  async function sendAdminPush(title, pushBody, data) {
    try {
      const admins = await db.listDocuments(DB, 'profiles', [
        Query.equal('role', 'ADMIN'), Query.limit(100),
      ])
      const userIds = admins.documents.map(d => d.userId).filter(Boolean)
      if (!userIds.length) return
      const messaging = new Messaging(client)
      await messaging.createPush(
        ID.unique(), title, pushBody, [], userIds, [], data || {},
      )
    } catch (err) { log('Push failed: ' + err.message) }
  }

  // Atomic "paid notification" claim. This path runs concurrently (checkout
  // polls reconcile every 5s without awaiting, plus the cron and the MP
  // webhook), so the `status !== 'PAID'` guard alone races: several in-flight
  // runs all read AWAITING_PAYMENT and each fires Telegram → duplicate messages.
  // createDocument with a deterministic id is atomic in Appwrite: exactly one
  // concurrent caller wins, the rest get a 409. Whoever wins sends the message.
  async function claimPaidNotification(orderDocId) {
    try {
      await db.createDocument(DB, 'webhook_events', `paid_${orderDocId}`, {
        source: 'telegram-paid',
        eventId: orderDocId,
        eventType: 'order.paid',
        status: 'notified',
        createdAt: new Date().toISOString(),
      })
      return true
    } catch {
      return false // already claimed (409) → skip duplicate notification
    }
  }

  const now = new Date().toISOString()
  // Confirm RECENT pending orders (last 3 days). The MP webhook rarely fires, so
  // this cron is the real confirmation path and must look at FRESH orders — not
  // only ones older than 24h, which left a PIX paid right after the buyer leaves
  // the success page sitting unconfirmed for a whole day. Expired/rejected PIX
  // flip to CANCELLED below, so the pending pool self-cleans and stays small.
  const recentCutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

  // Paginate all pending orders instead of hard cap at 100
  let pendingOrders = []
  if (specificOrderId) {
    const r = await db.listDocuments(DB, 'orders', [
      Query.equal('$id', specificOrderId),
      Query.limit(1),
    ])
    pendingOrders = r.documents
  } else {
    let offset = 0
    while (true) {
      const r = await db.listDocuments(DB, 'orders', [
        Query.equal('status', 'AWAITING_PAYMENT'),
        Query.isNotNull('mpPaymentId'),
        Query.greaterThan('createdAt', recentCutoff),
        Query.orderAsc('createdAt'),
        Query.limit(100),
        Query.offset(offset),
      ])
      pendingOrders.push(...r.documents)
      if (r.documents.length < 100) break
      offset += 100
    }
  }

  log(`Reconciling ${pendingOrders.length} orders`)

  const tokenExpiry = new Date()
  tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)

  for (const order of pendingOrders) {
    try {
      // CREDIT_CARD orders: no mpPaymentId at creation time. Try to find the
      // approved payment via external_reference (the order $id we set in the
      // preference). If found, persist the real payment ID so this same code
      // below can run the standard flow. If not found, skip — the webhook will
      // process the order once MP sends the notification.
      if (!order.mpPaymentId) {
        const searchResp = await fetch(
          `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(order.$id)}&sort=date_created&criteria=desc&limit=1`,
          { headers: { Authorization: `Bearer ${mpToken}` } },
        )
        const searchData = await searchResp.json()
        const found = searchData.results?.[0]
        if (found && found.status === 'approved') {
          // Persist so future calls (webhook, reconcile) find us by mpPaymentId
          order.mpPaymentId = String(found.id)
          await db.updateDocument(DB, 'orders', order.$id, {
            mpPaymentId: order.mpPaymentId,
            updatedAt: now,
          })
        } else {
          continue
        }
      }

      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      })
      const payment = await mpResp.json()

      if (payment.status === 'approved') {
        // Only treat this as a NEW confirmation if it wasn't already PAID — this
        // path gets called repeatedly per order (checkout polling), so notifying
        // every time would spam. Token creation below is already idempotent.
        const alreadyPaid = order.status === 'PAID'
        await db.updateDocument(DB, 'orders', order.$id, {
          status: 'PAID', mpStatus: 'approved', paidAt: now, updatedAt: now,
        })

        const itemsResult = await db.listDocuments(DB, 'order_items', [
          Query.equal('orderId', order.$id),
          Query.limit(100),
        ])

        for (const item of itemsResult.documents) {
          // Idempotency: don't create duplicate tokens
          const existingToken = await db.listDocuments(DB, 'download_tokens', [
            Query.equal('orderItemId', item.$id),
            Query.limit(1),
          ])
          if (existingToken.total === 0) {
            await db.createDocument(DB, 'download_tokens', ID.unique(), {
              token: crypto.randomUUID(),
              orderId: order.$id,
              orderItemId: item.$id,
              maxDownloads: 999999,
              downloadCount: 0,
              expiresAt: tokenExpiry.toISOString(),
              deliveryLink: item.deliveryLink ?? null,
            }, order.userId ? [Permission.read(Role.user(order.userId))] : undefined)
          }
        }
        log(`Order ${order.orderNumber} marked PAID`)
        if (!alreadyPaid && await claimPaidNotification(order.$id)) {
          let buyerIp = '', buyerLocation = ''
          try {
            const meta = order.metadata ? JSON.parse(order.metadata) : {}
            buyerIp = meta.buyerIp || ''
            if (buyerIp) buyerLocation = await geolocate(buyerIp)
          } catch {}
          const payLabel = order.paymentMethod === 'PIX' ? '💠 PIX'
            : order.paymentMethod === 'CREDIT_CARD' ? '💳 Cartão de Crédito'
            : esc(order.paymentMethod || '—')
          const itemsText = itemsResult.documents
            .map(it => `  • ${esc(it.productName)}${((it.quantity || 1) > 1) ? ` (x${it.quantity})` : ''}`)
            .join('\n') || '—'
          let when = ''
          try { when = new Date(now).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) } catch { when = now }
          await notifyTelegram(
            `✅ <b>Pagamento Aprovado!</b>\n\n` +
            `🧾 <b>${esc(order.orderNumber)}</b>\n` +
            `👤 <b>${esc(order.customerName || 'Cliente')}</b>\n` +
            `📧 ${esc(order.customerEmail || '—')}\n` +
            (order.guestPhone ? `📱 ${esc(order.guestPhone)}\n🔰 Compra Rápida\n` : '') +
            `\n🛍 <b>Itens:</b>\n${itemsText}\n\n` +
            `💰 <b>R$ ${Number(order.totalAmount || 0).toFixed(2)}</b>   ${payLabel}` +
            (payment.date_approved ? `\n✅ Pago em: ${dtBR(payment.date_approved)}` : '') +
            (order.mpPaymentId ? `\n🔑 ID MP: <code>${esc(order.mpPaymentId)}</code>` : '') +
            (buyerLocation ? `\n📍 ${esc(buyerLocation)}` : '') +
            (buyerIp ? `\n🌐 IP: <code>${esc(buyerIp)}</code>` : '') +
            `\n🕐 ${when}`
          )
          await sendAdminPush(
            `🎉 Nova venda — R$ ${Number(order.totalAmount || 0).toFixed(2)}`,
            `Pedido ${order.orderNumber} — ${(order.customerName || 'Cliente').split(' ')[0]}`,
            { route: '/admin/pedidos', orderId: order.$id },
          )
        }

      } else if (['rejected', 'cancelled', 'expired'].includes(payment.status)) {
        await db.updateDocument(DB, 'orders', order.$id, {
          status: 'CANCELLED', mpStatus: payment.status, updatedAt: now,
        })
        log(`Order ${order.orderNumber} CANCELLED`)
      }
    } catch (err) {
      log(`Error reconciling order ${order.orderNumber}: ${err.message}`)
    }
  }

  // When called with a specific orderId (from checkout polling), return the
  // current order status so the frontend can navigate without a client-side
  // DB read — anonymous sessions can hit permission edge cases on reads.
  let orderStatus = null
  if (specificOrderId) {
    try {
      const doc = await db.getDocument(DB, 'orders', specificOrderId)
      orderStatus = doc.status
    } catch {}
  }

  return res.json({ reconciled: pendingOrders.length, ...(specificOrderId ? { orderStatus } : {}) })
}
