import { Client, Databases, ID, Query } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  let body
  try {
    body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {}
  } catch {
    body = {}
  }
  const specificOrderId = body?.orderId

  const now = new Date().toISOString()
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let pendingOrders
  if (specificOrderId) {
    const order = await db.getDocument(DB, 'orders', specificOrderId)
    if (order.status !== 'AWAITING_PAYMENT' || !order.mpPaymentId) {
      log(`Order ${specificOrderId} is ${order.status} — skipping reconciliation`)
      return res.json({ reconciled: 0, errors: 0, total: 0 })
    }
    pendingOrders = [order]
  } else {
    const result = await db.listDocuments(DB, 'orders', [
      Query.equal('status', 'AWAITING_PAYMENT'),
      Query.lessThan('createdAt', dayAgo),
      Query.isNotNull('mpPaymentId'),
      Query.limit(100),
    ])
    pendingOrders = result.documents
  }

  log(`Reconciling ${pendingOrders.length} orders`)
  let reconciled = 0
  let errors = 0

  for (const order of pendingOrders) {
    if (!order.mpPaymentId) continue
    try {
      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
        headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
      })
      if (!mpResp.ok) {
        log(`MP fetch failed for order ${order.orderNumber}: ${mpResp.status}`)
        errors++
        continue
      }
      const payment = await mpResp.json()

      if (payment.status === 'approved' && order.status !== 'PAID') {
        await db.updateDocument(DB, 'orders', order.$id, {
          status: 'PAID',
          mpStatus: 'approved',
          paidAt: now,
          updatedAt: now,
        })
        const itemsResult = await db.listDocuments(DB, 'order_items', [
          Query.equal('orderId', order.$id),
        ])
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
        }
        log(`✓ Order ${order.orderNumber} → PAID`)
        reconciled++
      } else if (['rejected', 'cancelled', 'expired'].includes(payment.status)) {
        await db.updateDocument(DB, 'orders', order.$id, {
          status: 'CANCELLED',
          mpStatus: payment.status,
          updatedAt: now,
        })
        log(`✓ Order ${order.orderNumber} → CANCELLED (${payment.status})`)
        reconciled++
      } else {
        log(`Order ${order.orderNumber} still ${payment.status} — skipping`)
      }
    } catch (err) {
      error(`Reconcile failed for order ${order.$id}: ${err.message}`)
      errors++
    }
  }

  return res.json({ reconciled, errors, total: pendingOrders.length })
}
