import { Client, Databases, ID, Query } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  let body = {}
  try {
    body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {}
  } catch {}
  const specificOrderId = body?.orderId

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
        await fetch(`https://api.telegram.org/bot${siteConfig.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text }),
        })
      }
    } catch (err) { log('Telegram failed: ' + err.message) }
  }

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

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
        Query.lessThan('createdAt', dayAgo),
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
              maxDownloads: 5,
              downloadCount: 0,
              expiresAt: tokenExpiry.toISOString(),
              deliveryLink: item.deliveryLink ?? null,
            })
          }
        }
        log(`Order ${order.orderNumber} marked PAID`)
        if (!alreadyPaid) {
          await notifyTelegram(`✅ Pagamento aprovado!\nPedido: ${order.orderNumber}\nCliente: ${order.customerEmail}\nValor: R$ ${Number(order.totalAmount || 0).toFixed(2)}`)
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

  return res.json({ reconciled: pendingOrders.length })
}
