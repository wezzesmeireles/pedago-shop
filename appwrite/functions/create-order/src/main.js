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
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON' }, 400)
  }

  const { userId, customerName, customerEmail, items, paymentMethod } = body
  if (!userId || !items?.length) return res.json({ error: 'userId and items required' }, 400)

  const products = await Promise.all(
    items.map(i => db.getDocument(DB, 'products', i.productId))
  )

  let totalAmount = 0
  const orderItems = items.map((item, idx) => {
    const p = products[idx]
    if (!p.isActive || p.deletedAt) throw new Error(`Product ${p.name} unavailable`)
    totalAmount += p.price * (item.quantity ?? 1)
    return { product: p, quantity: item.quantity ?? 1 }
  })

  const isFree = totalAmount === 0
  const orderId = ID.unique()
  const now = new Date().toISOString()

  const countResult = await db.listDocuments(DB, 'orders', [Query.limit(1)])
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(countResult.total + 1).padStart(6, '0')}`

  let mpResult = null
  let status = 'AWAITING_PAYMENT'
  let method = paymentMethod

  if (isFree) {
    status = 'PAID'
    method = 'FREE'
  } else if (paymentMethod === 'PIX') {
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: totalAmount,
        payment_method_id: 'pix',
        payer: { email: customerEmail },
        description: `Pedido ${orderNumber}`,
        notification_url: `${process.env.APPWRITE_ENDPOINT}/functions/mp-webhook/executions`,
      }),
    })
    mpResult = await mpResponse.json()
  } else if (paymentMethod === 'CREDIT_CARD') {
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: orderItems.map(oi => ({
          title: oi.product.name,
          quantity: oi.quantity,
          unit_price: oi.product.price,
        })),
        payer: { email: customerEmail },
        external_reference: orderId,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success`,
          failure: `${process.env.FRONTEND_URL}/checkout`,
        },
        auto_return: 'approved',
      }),
    })
    mpResult = await mpResponse.json()
  }

  const order = await db.createDocument(DB, 'orders', orderId, {
    orderNumber,
    userId,
    customerName: customerName ?? '',
    customerEmail: customerEmail ?? '',
    status,
    totalAmount,
    paymentMethod: method ?? null,
    mpPaymentId: mpResult?.id?.toString() ?? null,
    mpPreferenceId: mpResult?.id?.toString() ?? null,
    mpStatus: mpResult?.status ?? null,
    expiresAt: mpResult?.date_of_expiration ?? null,
    metadata: mpResult ? JSON.stringify({
      qrCode: mpResult.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64,
      checkoutUrl: mpResult.sandbox_init_point ?? mpResult.init_point,
    }) : null,
    createdAt: now,
    updatedAt: now,
  })

  const createdItems = []
  const tokenExpiry = new Date()
  tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)

  for (const oi of orderItems) {
    const item = await db.createDocument(DB, 'order_items', ID.unique(), {
      orderId,
      productId: oi.product.$id,
      productName: oi.product.name,
      unitPrice: oi.product.price,
      quantity: oi.quantity,
      deliveryType: oi.product.deliveryType,
      deliveryLink: oi.product.deliveryLink ?? null,
    })
    createdItems.push(item)

    if (isFree) {
      await db.createDocument(DB, 'download_tokens', ID.unique(), {
        token: crypto.randomUUID(),
        orderId,
        orderItemId: item.$id,
        maxDownloads: 5,
        downloadCount: 0,
        expiresAt: tokenExpiry.toISOString(),
        deliveryLink: oi.product.deliveryLink ?? null,
      })
    }
  }

  // Telegram notification (non-blocking)
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    const config = JSON.parse(cfg.value)
    if (config.telegramBotToken && config.telegramChatId) {
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: `Nova ordem ${orderNumber}\n${customerEmail}\nR$ ${totalAmount.toFixed(2)}\n${method}`,
        }),
      })
    }
  } catch { /* non-blocking */ }

  return res.json({ order, items: createdItems, payment: mpResult })
}
