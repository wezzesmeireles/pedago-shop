import { Client, Databases, ID, Query } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Validate Mercado Pago signature
  const rawSignature = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  if (rawSignature && process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
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
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const eventType = payload?.type
  const paymentId = payload?.data?.id?.toString()

  if (!paymentId) return res.json({ ok: true })

  const now = new Date().toISOString()

  const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
  })
  const payment = await mpResp.json()

  const ordersResult = await db.listDocuments(DB, 'orders', [
    Query.equal('mpPaymentId', paymentId),
    Query.limit(1),
  ])
  const order = ordersResult.documents[0]
  if (!order) return res.json({ ok: true })

  if (payment.status === 'approved' && order.status !== 'PAID') {
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
      const prod = await db.getDocument(DB, 'products', item.productId)
      await db.updateDocument(DB, 'products', item.productId, {
        salesCount: (prod.salesCount ?? 0) + 1,
        updatedAt: now,
      })
    }
  } else if (['rejected', 'cancelled'].includes(payment.status)) {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'CANCELLED', mpStatus: payment.status, updatedAt: now,
    })
  } else if (payment.status === 'refunded') {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'REFUNDED', mpStatus: 'refunded', updatedAt: now,
    })
    const tokensResult = await db.listDocuments(DB, 'download_tokens', [
      Query.equal('orderId', order.$id),
    ])
    for (const t of tokensResult.documents) {
      await db.updateDocument(DB, 'download_tokens', t.$id, { revokedAt: now })
    }
  }

  await db.createDocument(DB, 'webhook_events', ID.unique(), {
    source: 'mercadopago',
    eventId: paymentId,
    eventType: eventType ?? 'payment',
    payload: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    status: 'processed',
    createdAt: now,
  })

  return res.json({ ok: true })
}
