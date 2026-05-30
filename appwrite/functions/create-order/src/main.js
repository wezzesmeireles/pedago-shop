import { Client, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Parse body
  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON' }, 400)
  }

  const { userId, customerName, customerEmail, items, paymentMethod } = body ?? {}
  if (!userId || !items?.length) {
    return res.json({ error: 'userId and items required' }, 400)
  }

  // Fetch and validate products
  let products
  try {
    products = await Promise.all(
      items.map(item => db.getDocument(DB, 'products', item.productId))
    )
  } catch (err) {
    error(`Product fetch failed: ${err.message}`)
    return res.json({ error: 'One or more products not found' }, 404)
  }

  // Validate products are available and compute total
  let totalAmount = 0
  let orderItems
  try {
    orderItems = items.map((item, idx) => {
      const p = products[idx]
      if (!p.isActive || p.deletedAt) {
        throw new Error(`Product ${p.name} is unavailable`)
      }
      totalAmount += p.price * (item.quantity ?? 1)
      return { product: p, quantity: item.quantity ?? 1 }
    })
  } catch (validationErr) {
    return res.json({ error: validationErr.message }, 400)
  }

  const isFree = totalAmount === 0
  const orderId = ID.unique()
  const now = new Date().toISOString()

  // Generate order number: ORD-YYYY-NNNNNN (based on orderId to avoid race condition)
  const year = new Date().getFullYear()
  const shortId = orderId.replace(/-/g, '').slice(0, 8).toUpperCase()
  const orderNumber = `ORD-${year}-${shortId}`

  let mpResult = null
  let status = 'AWAITING_PAYMENT'
  let method = paymentMethod

  if (isFree) {
    status = 'PAID'
    method = 'FREE'
  } else if (paymentMethod === 'PIX') {
    // Create Mercado Pago PIX payment
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify({
        transaction_amount: totalAmount,
        payment_method_id: 'pix',
        payer: { email: customerEmail },
        description: `Pedido ${orderNumber}`,
        notification_url: `${process.env.MERCADO_PAGO_NOTIFICATION_URL ?? ''}`,
      }),
    })
    if (!mpResponse.ok) {
      const mpErr = await mpResponse.text()
      error(`MP PIX failed: ${mpErr}`)
      return res.json({ error: 'Payment creation failed' }, 502)
    }
    mpResult = await mpResponse.json()
  } else if (paymentMethod === 'CREDIT_CARD') {
    // Create Mercado Pago preference (checkout)
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': orderId,
      },
      body: JSON.stringify({
        items: orderItems.map(oi => ({
          title: oi.product.name,
          quantity: oi.quantity,
          unit_price: oi.product.price,
          currency_id: 'BRL',
        })),
        payer: { email: customerEmail },
        external_reference: orderId,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success`,
          failure: `${process.env.FRONTEND_URL}/checkout`,
          pending: `${process.env.FRONTEND_URL}/checkout/success`,
        },
        auto_return: 'approved',
        notification_url: process.env.MERCADO_PAGO_NOTIFICATION_URL ?? '',
      }),
    })
    if (!mpResponse.ok) {
      const mpErr = await mpResponse.text()
      error(`MP preference failed: ${mpErr}`)
      return res.json({ error: 'Payment creation failed' }, 502)
    }
    mpResult = await mpResponse.json()
  }

  // Build metadata
  let metadata = null
  if (mpResult) {
    const qrCode = mpResult.point_of_interaction?.transaction_data?.qr_code
    const qrCodeBase64 = mpResult.point_of_interaction?.transaction_data?.qr_code_base64
    const checkoutUrl = mpResult.sandbox_init_point ?? mpResult.init_point
    metadata = JSON.stringify({ qrCode, qrCodeBase64, checkoutUrl })
  }

  // Create order document
  const order = await db.createDocument(DB, 'orders', orderId, {
    orderNumber,
    userId,
    customerName: customerName ?? '',
    customerEmail: customerEmail ?? '',
    status,
    totalAmount,
    paymentMethod: method ?? null,
    mpPaymentId: paymentMethod === 'PIX' ? (mpResult?.id?.toString() ?? null) : null,
    mpPreferenceId: paymentMethod === 'CREDIT_CARD' ? (mpResult?.id?.toString() ?? null) : null,
    mpStatus: mpResult?.status ?? null,
    paidAt: isFree ? now : null,
    expiresAt: mpResult?.date_of_expiration ?? null,
    metadata,
    createdAt: now,
    updatedAt: now,
  })

  // Create order items
  const createdItems = []
  for (const oi of orderItems) {
    const item = await db.createDocument(DB, 'order_items', ID.unique(), {
      orderId,
      productId: oi.product.$id,
      productName: oi.product.name,
      unitPrice: oi.product.price,
      quantity: oi.quantity,
      deliveryType: oi.product.deliveryType ?? 'FILE',
      deliveryLink: oi.product.deliveryLink ?? null,
    })
    createdItems.push(item)

    // For free orders: create download tokens immediately
    if (isFree) {
      const tokenExpiry = new Date()
      tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)
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

  // Send Telegram notification (non-blocking)
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    const config = JSON.parse(cfg.value)
    if (config.telegramBotToken && config.telegramChatId) {
      const emoji = isFree ? '🆓' : paymentMethod === 'PIX' ? '💠' : '💳'
      const msg = `${emoji} Novo pedido ${orderNumber}\n📧 ${customerEmail}\n💰 R$ ${totalAmount.toFixed(2)}\n💳 ${method}`
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.telegramChatId, text: msg }),
      })
    }
  } catch (telegramErr) {
    log(`Telegram notification failed: ${telegramErr.message}`)
  }

  return res.json({ order, items: createdItems, payment: mpResult })
}
