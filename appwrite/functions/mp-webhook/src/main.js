import { Client, Databases, ID, Query } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID
  const now = new Date().toISOString()

  // Validate Mercado Pago HMAC signature
  const rawSignature = req.headers?.['x-signature']
  const requestId = req.headers?.['x-request-id']
  if (rawSignature && process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    const parts = {}
    rawSignature.split(',').forEach(p => {
      const [k, v] = p.trim().split('=')
      parts[k] = v
    })
    const ts = parts['ts']
    const v1 = parts['v1']
    const dataId = req.query?.['data.id'] ?? ''
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(manifest).digest('hex')
    if (hmac !== v1) {
      error('Invalid webhook signature')
      return res.json({ error: 'Invalid signature' }, 401)
    }
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {})
  const paymentId = payload?.data?.id?.toString()
  const eventType = payload?.type ?? 'payment'

  if (!paymentId) {
    log('Webhook received without paymentId — ignoring')
    return res.json({ ok: true })
  }

  // Idempotency check — skip if already processed
  const existingEvents = await db.listDocuments(DB, 'webhook_events', [
    Query.equal('eventId', paymentId),
    Query.equal('source', 'mercadopago'),
    Query.equal('status', 'processed'),
  ])
  if (existingEvents.total > 0) {
    log(`Webhook ${paymentId} already processed — skipping`)
    return res.json({ ok: true })
  }

  // Fetch payment from Mercado Pago
  const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
  })
  if (!mpResp.ok) {
    error(`Failed to fetch MP payment ${paymentId}: ${mpResp.status}`)
    return res.json({ error: 'Failed to fetch payment' }, 502)
  }
  const payment = await mpResp.json()

  // Find order by mpPaymentId
  const ordersResult = await db.listDocuments(DB, 'orders', [
    Query.equal('mpPaymentId', paymentId),
  ])
  const order = ordersResult.documents[0]

  let webhookStatus = 'processed'

  if (!order) {
    log(`No order found for mpPaymentId ${paymentId}`)
    webhookStatus = 'skipped'
  } else if (payment.status === 'approved' && order.status !== 'PAID') {
    // Mark order PAID
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'PAID',
      mpStatus: 'approved',
      paidAt: now,
      updatedAt: now,
    })

    // Fetch order items
    const itemsResult = await db.listDocuments(DB, 'order_items', [
      Query.equal('orderId', order.$id),
    ])

    // Create download token per item
    const tokenExpiry = new Date()
    tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)
    for (const item of itemsResult.documents) {
      await db.createDocument(DB, 'download_tokens', ID.unique(), {
        token: crypto.randomUUID(),
        orderId: order.$id,
        orderItemId: item.$id,
        maxDownloads: 5,
        downloadCount: 0,
        expiresAt: tokenExpiry.toISOString(),
        deliveryLink: item.deliveryLink ?? null,
      })
      // Increment product salesCount
      try {
        const prod = await db.getDocument(DB, 'products', item.productId)
        await db.updateDocument(DB, 'products', item.productId, {
          salesCount: (prod.salesCount ?? 0) + 1,
          updatedAt: now,
        })
      } catch (salesErr) {
        log(`salesCount update failed for ${item.productId}: ${salesErr.message}`)
      }
    }

    // Telegram notification
    await sendTelegramNotification(db, DB, `✅ Pagamento confirmado!\nPedido: ${order.orderNumber}\nCliente: ${order.customerEmail}\nValor: R$ ${order.totalAmount?.toFixed(2)}`, log)

  } else if (['rejected', 'cancelled'].includes(payment.status)) {
    if (order.status === 'AWAITING_PAYMENT') {
      await db.updateDocument(DB, 'orders', order.$id, {
        status: 'CANCELLED',
        mpStatus: payment.status,
        updatedAt: now,
      })
    }
    await sendTelegramNotification(db, DB, `❌ Pagamento ${payment.status}\nPedido: ${order.orderNumber}`, log)

  } else if (payment.status === 'refunded') {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'REFUNDED',
      mpStatus: 'refunded',
      updatedAt: now,
    })
    // Revoke all download tokens for this order
    const tokensResult = await db.listDocuments(DB, 'download_tokens', [
      Query.equal('orderId', order.$id),
    ])
    for (const t of tokensResult.documents) {
      await db.updateDocument(DB, 'download_tokens', t.$id, { revokedAt: now })
    }
    await sendTelegramNotification(db, DB, `↩️ Reembolso processado\nPedido: ${order.orderNumber}`, log)
  }

  // Log webhook event for idempotency
  await db.createDocument(DB, 'webhook_events', ID.unique(), {
    source: 'mercadopago',
    eventId: paymentId,
    eventType,
    payload: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    status: webhookStatus,
    createdAt: now,
  })

  return res.json({ ok: true })
}

async function sendTelegramNotification(db, DB, message, log) {
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    const config = JSON.parse(cfg.value)
    if (config.telegramBotToken && config.telegramChatId) {
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.telegramChatId, text: message }),
      })
    }
  } catch (err) {
    log(`Telegram notification failed: ${err.message}`)
  }
}
