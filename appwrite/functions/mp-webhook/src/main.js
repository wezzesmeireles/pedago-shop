import { Client, Databases, ID, Query, Permission, Role, Messaging } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
  function dtBR(iso) { try { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) } catch { return iso } }
  function accessBlock(meta, location) {
    const info = meta?.client && typeof meta.client === 'object' ? meta.client : {}
    const lines = [
      `📍 ${esc(location || 'Localização indisponível')}`,
      meta?.buyerIp ? `🌐 IP: <code>${esc(meta.buyerIp)}</code>` : '🌐 IP não informado',
      `📱 ${esc(info.model || 'Aparelho não informado')} · ${esc(info.os || 'Sistema não informado')}`,
      `🌍 ${esc(info.browser || 'Navegador não informado')} · ${esc(info.appMode || 'Navegador')}`,
    ]
    if (info.screen || info.viewport) lines.push(`🖥 Tela: ${esc(info.screen || info.viewport)}`)
    if (info.timezone) lines.push(`🕓 Fuso: ${esc(info.timezone)}`)
    return `<b>ACESSO</b>\n${lines.join('\n')}`
  }
  async function sendTelegram(token, chatId, html) {
    const configuredFrontend = String(process.env.FRONTEND_URL || '').replace(/\/$/, '')
    const publicFrontend = /^https:\/\/(?!localhost(?:[:/]|$)|127\.|0\.0\.0\.0)/i.test(configuredFrontend)
      ? configuredFrontend : 'https://www.sitepedagogico.com'
    const panelUrl = `${publicFrontend}/admin/pedidos`
    const telegramOptions = {
      link_preview_options: { is_disabled: true },
      reply_markup: { inline_keyboard: [[{ text: '📦 Abrir pedidos', url: panelUrl }]] },
    }
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML', ...telegramOptions }),
    })
    if (!r.ok) {
      const err = await r.text()
      log(`Telegram HTML error ${r.status}: ${err}`)
      const plain = html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      const fallback = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: plain, ...telegramOptions }),
      })
      if (!fallback.ok) {
        const fallbackError = await fallback.text()
        throw new Error(`Telegram rejected message (${fallback.status}): ${fallbackError.slice(0, 300)}`)
      }
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

  // Parse body safely
  let payload
  try {
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ ok: true }) // MP needs 2xx to stop retrying
  }

  // Validate Mercado Pago signature
  const rawSignature = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  if (!process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    log('WARNING: MERCADO_PAGO_WEBHOOK_SECRET not set — webhook signatures are not verified. Set this variable in Appwrite Functions settings.')
  }
  if (rawSignature && process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    try {
      const parts = Object.fromEntries(rawSignature.split(',').map(p => p.split('=')))
      const ts = parts['ts']
      const v1 = parts['v1']
      const manifest = `id:${req.query?.['data.id']};request-id:${requestId};ts:${ts};`
      const hmac = crypto.createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
        .update(manifest).digest('hex')
      if (hmac !== v1) {
        error('Invalid webhook signature')
        return res.json({ error: 'Invalid signature' }, 401)
      }
    } catch (err) {
      log('Signature validation error: ' + err.message)
    }
  }

  const paymentId = payload?.data?.id?.toString()

  if (!paymentId) return res.json({ ok: true })

  const now = new Date().toISOString()

  // Read MP token from site_config
  let mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  let siteConfig = {}
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    siteConfig = JSON.parse(cfg.value)
    if (siteConfig.mercadoPagoAccessToken) mpToken = siteConfig.mercadoPagoAccessToken
  } catch {}

  const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${mpToken}` },
  })
  const payment = await mpResp.json()
  if (!mpResp.ok || !payment?.status) {
    error(`Mercado Pago lookup failed for ${paymentId}: HTTP ${mpResp.status}`)
    return res.json({ error: 'Payment lookup failed' }, 502)
  }

  // A PIX keeps the same payment ID while transitioning pending → approved.
  // Deduplicate by payment + status, otherwise the initial pending event blocks
  // the later approval event and no confirmation/Telegram alert is produced.
  const processedEventType = `payment.${String(payment.status).slice(0, 40)}`
  const existingEvent = await db.listDocuments(DB, 'webhook_events', [
    Query.equal('eventId', paymentId),
    Query.equal('source', 'mercadopago'),
    Query.equal('eventType', processedEventType),
    Query.equal('status', 'processed'),
    Query.limit(1),
  ])
  if (existingEvent.total > 0) {
    log(`Duplicate webhook for paymentId ${paymentId} status ${payment.status}, skipping`)
    return res.json({ ok: true })
  }

  let ordersResult = await db.listDocuments(DB, 'orders', [
    Query.equal('mpPaymentId', paymentId),
    Query.limit(1),
  ])
  let order = ordersResult.documents[0]

  // CREDIT_CARD payments: the order has mpPreferenceId (not mpPaymentId) at
  // creation time, so we fall back to the external_reference we set in the
  // preference (which is the order $id).
  if (!order && payment.external_reference) {
    ordersResult = await db.listDocuments(DB, 'orders', [
      Query.equal('$id', payment.external_reference),
      Query.limit(1),
    ])
    order = ordersResult.documents[0]
    if (order) {
      // Persist the real payment ID so future webhook calls and
      // reconcile-orders can find us by mpPaymentId too.
      await db.updateDocument(DB, 'orders', order.$id, {
        mpPaymentId: paymentId,
        updatedAt: now,
      })
    }
  }

  if (!order) {
    log(`No order found for mpPaymentId ${paymentId}`)
    return res.json({ ok: true })
  }

  async function claimStatusNotification(paymentStatus) {
    try {
      await db.createDocument(DB, 'webhook_events', `st_${String(paymentStatus).slice(0, 8)}_${order.$id}`, {
        source: 'telegram-status',
        eventId: order.$id,
        eventType: `order.${paymentStatus}`,
        status: 'notified',
        createdAt: now,
      })
      return true
    } catch {
      return false
    }
  }

  async function notifyPaymentStatus(paymentStatus) {
    if (!siteConfig.telegramBotToken || !(await claimStatusNotification(paymentStatus))) return
    const recipients = siteConfig.telegramRecipients ?? []
    const chatIds = recipients.length > 0
      ? recipients.map(r => r.chatId)
      : siteConfig.telegramChatId ? [siteConfig.telegramChatId] : []
    let orderMeta = {}, buyerLocation = ''
    try {
      orderMeta = order.metadata ? JSON.parse(order.metadata) : {}
      if (orderMeta.buyerIp) buyerLocation = await geolocate(orderMeta.buyerIp)
    } catch {}
    const statusView = paymentStatus === 'refunded'
      ? { title: '↩️ <b>PAGAMENTO REEMBOLSADO</b>', description: 'O valor foi devolvido e os downloads foram revogados.' }
      : paymentStatus === 'rejected'
        ? { title: '❌ <b>PAGAMENTO RECUSADO</b>', description: 'O Mercado Pago recusou a tentativa de pagamento.' }
        : { title: '🚫 <b>PAGAMENTO CANCELADO</b>', description: 'A tentativa de pagamento foi cancelada.' }
    const message =
      `${statusView.title}\n━━━━━━━━━━━━━━━━━━\n` +
      `🧾 <b>${esc(order.orderNumber)}</b>\n` +
      `💰 R$ ${Number(order.totalAmount || 0).toFixed(2)} · ${order.paymentMethod === 'PIX' ? '💠 PIX' : '💳 Cartão'}\n\n` +
      `👤 ${esc(order.customerName || 'Cliente')}\n` +
      `📧 ${esc(order.customerEmail || 'Não informado')}\n` +
      (order.guestPhone ? `📞 ${esc(order.guestPhone)}\n` : '') +
      `\n${esc(statusView.description)}\n\n` +
      `${accessBlock(orderMeta, buyerLocation)}\n\n` +
      (order.mpPaymentId ? `🔑 <b>ID Mercado Pago:</b> <code>${esc(order.mpPaymentId)}</code>\n` : '') +
      `🕐 ${dtBR(now)}`
    for (const chatId of chatIds) await sendTelegram(siteConfig.telegramBotToken, chatId, message)
  }

  if (payment.status === 'approved' && order.status !== 'PAID') {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'PAID', mpStatus: 'approved', paidAt: now, updatedAt: now,
    })

    const itemsResult = await db.listDocuments(DB, 'order_items', [
      Query.equal('orderId', order.$id),
      Query.limit(100),
    ])

    const tokenExpiry = new Date()
    tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)

    for (const item of itemsResult.documents) {
      // Check if token already exists for this item (extra idempotency guard)
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

      try {
        const prod = await db.getDocument(DB, 'products', item.productId)
        await db.updateDocument(DB, 'products', item.productId, {
          salesCount: (prod.salesCount ?? 0) + 1,
          updatedAt: now,
        })
      } catch {}
    }

    // Telegram notifications — guarded by an atomic claim so the webhook and
    // reconcile-orders (which also notifies, and runs concurrently via checkout
    // polling) never both message for the same order. createDocument with a
    // deterministic id is atomic: only the first caller succeeds, the rest 409.
    const paidClaimDocumentId = `paid_${order.$id}`
    let wonNotifyClaim = false
    try {
      await db.createDocument(DB, 'webhook_events', paidClaimDocumentId, {
        source: 'telegram-paid',
        eventId: order.$id,
        eventType: 'order.paid',
        status: 'processing',
        createdAt: now,
      })
      wonNotifyClaim = true
    } catch {
      try {
        const existingClaim = await db.getDocument(DB, 'webhook_events', paidClaimDocumentId)
        if (existingClaim.status === 'failed') {
          await db.updateDocument(DB, 'webhook_events', paidClaimDocumentId, { status: 'processing', payload: null })
          wonNotifyClaim = true
        }
      } catch { /* another execution owns the claim */ }
    }

    try {
      if (wonNotifyClaim) {
        if (!siteConfig.telegramBotToken) throw new Error('Telegram bot token is not configured')
        const recipients = siteConfig.telegramRecipients ?? []
        const chatIds = recipients.length > 0
          ? recipients.map(r => r.chatId).filter(Boolean)
          : siteConfig.telegramChatId ? [siteConfig.telegramChatId] : []
        if (!chatIds.length) throw new Error('Telegram recipient is not configured')
        let orderMeta = {}, buyerLocation = ''
        try {
          orderMeta = order.metadata ? JSON.parse(order.metadata) : {}
          if (orderMeta.buyerIp) buyerLocation = await geolocate(orderMeta.buyerIp)
        } catch {}
        const payLabel = order.paymentMethod === 'PIX' ? '💠 PIX'
          : order.paymentMethod === 'CREDIT_CARD' ? '💳 Cartão de Crédito'
          : esc(order.paymentMethod || '—')
        const itemsText = itemsResult.documents
          .map((it, index) => `${index + 1}. ${esc(it.productName)}${((it.quantity || 1) > 1) ? ` × ${it.quantity}` : ''}`)
          .join('\n') || '—'
        let when = ''
        try { when = new Date(now).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) } catch { when = now }
        const msg =
          `🎉 <b>PAGAMENTO APROVADO</b>\n━━━━━━━━━━━━━━━━━━\n` +
          `🧾 <b>${esc(order.orderNumber)}</b>\n` +
          `💰 <b>R$ ${Number(order.totalAmount || 0).toFixed(2)}</b> · ${payLabel}\n` +
          (payment.date_approved ? `✅ Pago em ${dtBR(payment.date_approved)}\n` : '') +
          `\n<b>CLIENTE</b>\n` +
          `👤 ${esc(order.customerName || 'Cliente')}\n` +
          `📧 ${esc(order.customerEmail || 'Não informado')}\n` +
          (order.guestPhone ? `📞 ${esc(order.guestPhone)} · Compra rápida\n` : '🔐 Cliente com conta\n') +
          `\n<b>ITENS LIBERADOS</b>\n${itemsText}\n\n` +
          `${accessBlock(orderMeta, buyerLocation)}\n\n` +
          (order.mpPaymentId ? `🔑 <b>ID Mercado Pago:</b> <code>${esc(order.mpPaymentId)}</code>\n` : '') +
          `🕐 ${when}`
        for (const chatId of chatIds) {
          await sendTelegram(siteConfig.telegramBotToken, chatId, msg)
        }
        await db.updateDocument(DB, 'webhook_events', paidClaimDocumentId, { status: 'notified', payload: null })
      }
    } catch (err) {
      if (wonNotifyClaim) {
        try {
          await db.updateDocument(DB, 'webhook_events', paidClaimDocumentId, {
            status: 'failed', payload: String(err.message || err).slice(0, 1000),
          })
        } catch {}
      }
      log('Telegram notification failed: ' + err.message)
    }

    // Push nativo pro app do admin (FCM via Appwrite Messaging), espelhando o
    // Telegram. Mesmo claim atômico (wonNotifyClaim) → sem duplicar. Best-effort.
    if (wonNotifyClaim) {
      try {
        const messaging = new Messaging(client)
        const admins = await db.listDocuments(DB, 'profiles', [
          Query.equal('role', 'ADMIN'), Query.limit(100),
        ])
        const userIds = admins.documents.map(d => d.userId).filter(Boolean)
        if (userIds.length) {
          await messaging.createPush(
            ID.unique(),
            `🎉 Nova venda — R$ ${Number(order.totalAmount || 0).toFixed(2)}`,
            `Pedido ${order.orderNumber} — ${(order.customerName || 'Cliente').split(' ')[0]}`,
            [], userIds, [], { route: '/admin/pedidos', orderId: order.$id },
          )
        }
        if (order.userId) {
          await messaging.createPush(
            ID.unique(),
            '✅ Pagamento aprovado!',
            `O pedido ${order.orderNumber} já está disponível para baixar.`,
            [], [order.userId], [], { route: '/minha-conta/downloads', orderId: order.$id },
          )
        }
      } catch (err) {
        log('Push notification failed: ' + err.message)
      }
    }

  } else if (['rejected', 'cancelled'].includes(payment.status)) {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'CANCELLED', mpStatus: payment.status, updatedAt: now,
    })
    await notifyPaymentStatus(payment.status)
  } else if (payment.status === 'refunded') {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'REFUNDED', mpStatus: 'refunded', updatedAt: now,
    })
    const tokensResult = await db.listDocuments(DB, 'download_tokens', [
      Query.equal('orderId', order.$id),
      Query.limit(100),
    ])
    for (const t of tokensResult.documents) {
      await db.updateDocument(DB, 'download_tokens', t.$id, { revokedAt: now })
    }
    await notifyPaymentStatus('refunded')
  }

  await db.createDocument(DB, 'webhook_events', ID.unique(), {
    source: 'mercadopago',
    eventId: paymentId,
    eventType: processedEventType,
    payload: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    status: 'processed',
    createdAt: now,
  })

  return res.json({ ok: true })
}
