import { Client, Databases, ID, Query } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {}
  const specificOrderId = body?.orderId

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const queries = specificOrderId
    ? [Query.equal('$id', specificOrderId)]
    : [
        Query.equal('status', 'AWAITING_PAYMENT'),
        Query.isNotNull('mpPaymentId'),
        Query.lessThan('createdAt', dayAgo),
        Query.limit(100),
      ]

  const ordersResult = await db.listDocuments(DB, 'orders', queries)
  log(`Reconciling ${ordersResult.documents.length} orders`)
  const now = new Date().toISOString()

  for (const order of ordersResult.documents) {
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
    })
    const payment = await mpResp.json()

    if (payment.status === 'approved') {
      await db.updateDocument(DB, 'orders', order.$id, {
        status: 'PAID', mpStatus: 'approved', paidAt: now, updatedAt: now,
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
      log(`Order ${order.orderNumber} marked PAID`)
    } else if (['rejected', 'cancelled', 'expired'].includes(payment.status)) {
      await db.updateDocument(DB, 'orders', order.$id, {
        status: 'CANCELLED', mpStatus: payment.status, updatedAt: now,
      })
      log(`Order ${order.orderNumber} CANCELLED`)
    }
  }

  return res.json({ reconciled: ordersResult.documents.length })
}
