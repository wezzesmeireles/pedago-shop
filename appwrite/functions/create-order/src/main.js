import { Client, Databases, ID, Query, Permission, Role } from 'node-appwrite'
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

  // Fetch products with error handling
  let products
  try {
    products = await Promise.all(
      items.map(i => db.getDocument(DB, 'products', i.productId))
    )
  } catch (err) {
    return res.json({ error: `Product not found: ${err.message}` }, 404)
  }

  let totalAmount = 0
  let orderItems
  try {
    orderItems = items.map((item, idx) => {
      const p = products[idx]
      if (!p.isActive || p.deletedAt) throw new Error(`Product ${p.name} unavailable`)
      totalAmount += p.price * (item.quantity ?? 1)
      return { product: p, quantity: item.quantity ?? 1 }
    })
  } catch (err) {
    return res.json({ error: err.message }, 400)
  }

  // Read MP credentials from site_config (admin panel updates take effect immediately)
  let mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  let siteConfig = null
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    siteConfig = JSON.parse(cfg.value)
    if (siteConfig.mercadoPagoAccessToken) mpToken = siteConfig.mercadoPagoAccessToken
  } catch (err) {
    log('site_config read failed, using env var: ' + err.message)
  }

  const isFree = totalAmount === 0
  const orderId = ID.unique()
  const now = new Date().toISOString()

  // Per-document read for the buyer. The collections only grant collection-level
  // read to label:admin, so without this the customer can't read their own
  // order/items/tokens — breaking "Meus Pedidos", "Meus Downloads" and the
  // checkout-success page. Admin still reads everything via the admin label.
  const ownerRead = [Permission.read(Role.user(userId))]

  const countResult = await db.listDocuments(DB, 'orders', [Query.limit(1)])
  const orderNumber = `ORD-${new Date().getFullYear()}-${String(countResult.total + 1).padStart(6, '0')}`

  let mpResult = null
  let status = 'AWAITING_PAYMENT'
  let method = paymentMethod

  // Notification URL — must be publicly executable (function execute scope = any)
  const webhookUrl = `${process.env.APPWRITE_ENDPOINT}/functions/mp-webhook/executions`

  if (!mpToken && !isFree) {
    return res.json({ error: 'Mercado Pago não configurado. Configure o Access Token nas Integrações.' }, 400)
  }

  if (isFree) {
    status = 'PAID'
    method = 'FREE'
  } else if (paymentMethod === 'PIX') {
    const idempotencyKey = `${orderId}-pix`
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: Number(totalAmount.toFixed(2)),
        payment_method_id: 'pix',
        payer: { email: customerEmail || 'cliente@email.com' },
        description: `Pedido ${orderNumber}`,
        notification_url: webhookUrl,
      }),
    })
    mpResult = await mpResponse.json()
    if (!mpResponse.ok) {
      error('MP PIX error: ' + JSON.stringify(mpResult))
      return res.json({ error: mpResult?.message || 'Erro ao gerar PIX no Mercado Pago.', mpError: mpResult }, 400)
    }
  } else if (paymentMethod === 'CREDIT_CARD') {
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: orderItems.map(oi => ({
          title: oi.product.name,
          quantity: oi.quantity,
          unit_price: Number(oi.product.price.toFixed(2)),
          currency_id: 'BRL',
        })),
        payer: { email: customerEmail || 'cliente@email.com' },
        external_reference: orderId,
        notification_url: webhookUrl,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success/${orderId}`,
          failure: `${process.env.FRONTEND_URL}/checkout`,
        },
        auto_return: 'approved',
      }),
    })
    mpResult = await mpResponse.json()
    if (!mpResponse.ok) {
      error('MP card error: ' + JSON.stringify(mpResult))
      return res.json({ error: mpResult?.message || 'Erro ao criar pagamento no Mercado Pago.', mpError: mpResult }, 400)
    }
  }

  // Separate PIX payment ID from credit card preference ID
  const mpPaymentId = paymentMethod === 'PIX' ? mpResult?.id?.toString() ?? null : null
  const mpPreferenceId = paymentMethod === 'CREDIT_CARD' ? mpResult?.id?.toString() ?? null : null
  // Coerce mpStatus to string, truncate to 50 chars (DB attribute limit)
  const mpStatus = mpResult?.status != null ? String(mpResult.status).slice(0, 50) : null

  const order = await db.createDocument(DB, 'orders', orderId, {
    orderNumber,
    userId,
    customerName: customerName ?? '',
    customerEmail: customerEmail ?? '',
    status,
    totalAmount,
    paymentMethod: method ?? null,
    mpPaymentId,
    mpPreferenceId,
    mpStatus,
    expiresAt: mpResult?.date_of_expiration ?? null,
    metadata: mpResult ? JSON.stringify({
      qrCode: mpResult.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64,
      checkoutUrl: mpResult.sandbox_init_point ?? mpResult.init_point,
    }) : null,
    createdAt: now,
    updatedAt: now,
  }, ownerRead)

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
    }, ownerRead)
    createdItems.push(item)

    if (isFree) {
      await db.createDocument(DB, 'download_tokens', ID.unique(), {
        token: crypto.randomUUID(),
        orderId,
        orderItemId: item.$id,
        maxDownloads: 999999,
        downloadCount: 0,
        expiresAt: tokenExpiry.toISOString(),
        deliveryLink: oi.product.deliveryLink ?? null,
      }, ownerRead)
    }
  }

  // Telegram notifications (non-blocking) — uses telegramRecipients array
  try {
    if (siteConfig?.telegramBotToken) {
      const recipients = siteConfig.telegramRecipients ?? []
      // Fallback to old scalar field if array is empty
      const chatIds = recipients.length > 0
        ? recipients.map(r => r.chatId)
        : siteConfig.telegramChatId ? [siteConfig.telegramChatId] : []

      const msg = `🛒 Novo pedido ${orderNumber}\n${customerEmail}\nR$ ${totalAmount.toFixed(2)}\nPagamento: ${method}`
      for (const chatId of chatIds) {
        await fetch(`https://api.telegram.org/bot${siteConfig.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: msg }),
        })
      }
    }
  } catch (err) {
    log('Telegram notification failed: ' + err.message)
  }

  // Normalized payment object matching what the frontend expects
  const payment = {
    qrCode: mpResult?.point_of_interaction?.transaction_data?.qr_code ?? '',
    qrCodeBase64: mpResult?.point_of_interaction?.transaction_data?.qr_code_base64 ?? '',
    initPoint: mpResult?.init_point ?? '',
    sandboxInitPoint: mpResult?.sandbox_init_point ?? '',
    id: mpResult?.id ?? null,
    status: mpStatus,
  }

  return res.json({ order, items: createdItems, payment })
}
