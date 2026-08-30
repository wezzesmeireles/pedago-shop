import { Client, Databases, ID, Query, Permission, Role, Messaging } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    // Appwrite generates a short-lived key for every execution. The old static
    // project key expired and made every product lookup fail before Mercado Pago.
    .setKey(req.headers['x-appwrite-key'] || process.env.APPWRITE_API_KEY)

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

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON' }, 400)
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.json({ error: 'Corpo da requisição inválido.' }, 400)
  }

  // Use the user ID from the Appwrite-injected header — this is always the real
  // caller's ID regardless of what the body says, preventing IDOR attacks where
  // an attacker crafts a request with another user's ID in the body.
  const userId = req.headers['x-appwrite-user-id']
  const { customerName, customerEmail, items, paymentMethod, guestPhone } = body
  if (!userId) return res.json({ error: 'Usuário não autenticado.' }, 400)
  if (!Array.isArray(items) || items.length === 0) {
    return res.json({ error: 'O pedido precisa ter pelo menos um item.' }, 400)
  }
  if (items.length > 50) {
    return res.json({ error: 'O pedido excede o limite de 50 itens.' }, 400)
  }

  let normalizedItems
  try {
    normalizedItems = items.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`Item ${index + 1} inválido.`)
      }

      const productId = typeof item.productId === 'string' ? item.productId.trim() : ''
      const slug = typeof item.slug === 'string' ? item.slug.trim() : ''
      const quantity = Number(item.quantity ?? 1)

      if (!productId && !slug) {
        throw new Error(`Item ${index + 1} sem identificação de produto.`)
      }
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        throw new Error(`Quantidade inválida no item ${index + 1}. Use um valor entre 1 e 10.`)
      }

      return { productId, slug, quantity }
    })
  } catch (err) {
    return res.json({ error: err.message }, 400)
  }

  const buyerIp = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.headers['x-real-ip'] || ''
  const geoTask = geolocate(buyerIp)

  // Resolve each product by its current document ID. Old carts can retain an
  // obsolete ID after catalog migrations, so a known slug is the safe fallback.
  let products
  try {
    products = await Promise.all(
      normalizedItems.map(async (item, index) => {
        if (item.productId) {
          try {
            return await db.getDocument(DB, 'products', item.productId)
          } catch (err) {
            log(`Product ID lookup failed for item ${index + 1}; trying slug fallback: ${err.message}`)
          }
        }

        if (item.slug) {
          try {
            const bySlug = await db.listDocuments(DB, 'products', [
              Query.equal('slug', item.slug),
              Query.limit(1),
            ])
            if (bySlug.documents.length > 0) return bySlug.documents[0]
          } catch (err) {
            log(`Product slug lookup failed for item ${index + 1}: ${err.message}`)
          }
        }

        throw new Error(`Produto do item ${index + 1} não encontrado.`)
      })
    )
  } catch (err) {
    log('Product resolution failed: ' + err.message)
    return res.json({
      error: 'Não foi possível localizar um produto do pedido. Atualize o carrinho e tente novamente.',
    }, 400)
  }

  let totalAmount = 0
  let orderItems
  try {
    orderItems = normalizedItems.map((item, idx) => {
      const p = products[idx]
      if (!p.isActive || p.deletedAt) throw new Error(`Product ${p.name} unavailable`)
      const quantity = item.quantity
      totalAmount += p.price * quantity
      return { product: p, quantity }
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
  if (!isFree && paymentMethod !== 'PIX' && paymentMethod !== 'CREDIT_CARD') {
    return res.json({ error: 'Forma de pagamento inválida.' }, 400)
  }
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
    let mpResponse
    try {
      mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
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
    } catch (err) {
      error(`MP PIX network failure: ${err.message}`)
      return res.json({ error: 'Não foi possível conectar ao Mercado Pago. Tente novamente.' }, 502)
    }
    try {
      mpResult = await mpResponse.json()
    } catch {
      error(`MP PIX returned invalid JSON (http=${mpResponse.status})`)
      return res.json({ error: 'O provedor de pagamento retornou uma resposta inválida. Tente novamente.' }, 502)
    }
    if (!mpResponse.ok) {
      error(`MP PIX request failed (http=${mpResponse.status}, code=${String(mpResult?.error || mpResult?.status || 'unknown').slice(0, 80)})`)
      return res.json({ error: 'Não foi possível gerar o PIX no Mercado Pago. Tente novamente.' }, 400)
    }

    const pixData = mpResult?.point_of_interaction?.transaction_data
    if (!pixData?.qr_code && !pixData?.qr_code_base64) {
      error(`MP PIX response missing QR data (http=${mpResponse.status}, paymentId=${mpResult?.id ? 'present' : 'missing'})`)
      return res.json({
        error: 'O provedor de pagamento não retornou os dados do QR Code. Tente novamente.',
      }, 502)
    }
  } else if (paymentMethod === 'CREDIT_CARD') {
    const frontendUrl = process.env.FRONTEND_URL || 'https://www.sitepedagogico.com'
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
          success: `${frontendUrl}/checkout/success/${orderId}`,
          failure: `${frontendUrl}/checkout`,
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
    guestPhone: guestPhone ?? null,
    status,
    totalAmount,
    paymentMethod: method ?? null,
    mpPaymentId,
    mpPreferenceId,
    mpStatus,
    expiresAt: mpResult?.date_of_expiration ?? null,
    metadata: JSON.stringify({
      ...(mpResult ? {
        qrCode: mpResult.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64,
        checkoutUrl: mpResult.sandbox_init_point ?? mpResult.init_point,
      } : {}),
      buyerIp,
    }),
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

      const buyerLocation = await geoTask
      const payLabel = method === 'PIX' ? '💠 PIX'
        : method === 'CREDIT_CARD' ? '💳 Cartão de Crédito'
        : method === 'FREE' ? '🎁 Gratuito'
        : esc(method || '—')
      const statusLabel = status === 'PAID' ? '✅ Pago' : '⏳ Aguardando pagamento'
      const itemsText = orderItems
        .map(oi => `  • ${esc(oi.product.name)}${(oi.quantity > 1) ? ` (x${oi.quantity})` : ''}`)
        .join('\n') || '—'
      const msg =
        `🛒 <b>Novo Pedido</b> — <b>${esc(orderNumber)}</b>\n\n` +
        `👤 <b>${esc(customerName || 'Cliente')}</b>\n` +
        `📧 ${esc(customerEmail || '—')}\n` +
        (guestPhone ? `📱 ${esc(guestPhone)}\n🔰 Compra Rápida\n` : '') +
        `\n🛍 <b>Itens:</b>\n${itemsText}\n\n` +
        `💰 <b>Total: R$ ${totalAmount.toFixed(2)}</b>   ${payLabel}\n` +
        `📊 ${statusLabel}` +
        (method === 'PIX' && mpResult?.date_of_expiration ? `\n⏰ Expira: ${dtBR(mpResult.date_of_expiration)}` : '') +
        (mpPaymentId ? `\n🔑 ID MP: <code>${esc(mpPaymentId)}</code>` : '') +
        (buyerLocation ? `\n📍 ${esc(buyerLocation)}` : '') +
        (buyerIp ? `\n🌐 IP: <code>${esc(buyerIp)}</code>` : '') +
        `\n🕐 ${dtBR(now)}`
      for (const chatId of chatIds) {
        await sendTelegram(siteConfig.telegramBotToken, chatId, msg)
      }
    }
  } catch (err) {
    log('Telegram notification failed: ' + err.message)
  }

  // Push acompanha o mesmo evento do Telegram. Falhas ou usuários sem target
  // nunca interrompem a criação do pedido/pagamento.
  try {
    const messaging = new Messaging(client)
    const admins = await db.listDocuments(DB, 'profiles', [
      Query.equal('role', 'ADMIN'), Query.limit(100),
    ])
    const adminIds = admins.documents.map(profile => profile.userId).filter(Boolean)
    const isPix = method === 'PIX'
    const isFreeOrder = method === 'FREE'
    if (adminIds.length) {
      await messaging.createPush(
        ID.unique(),
        isPix ? '💠 Novo PIX gerado' : isFreeOrder ? '🎁 Novo material gratuito' : '🛒 Novo pedido',
        `Pedido ${orderNumber} — ${isFreeOrder ? 'material liberado' : 'aguardando pagamento'}`,
        [], adminIds, [], { route: '/admin/pedidos', orderId: order.$id },
      )
    }
    if (userId && (isPix || isFreeOrder)) {
      await messaging.createPush(
        ID.unique(),
        isPix ? 'PIX gerado com sucesso' : 'Material liberado!',
        isPix
          ? `O pedido ${orderNumber} está aguardando o pagamento.`
          : `O pedido ${orderNumber} já está disponível para baixar.`,
        [], [userId], [], {
          route: isPix ? '/checkout' : '/minha-conta/downloads',
          orderId: order.$id,
        },
      )
    }
  } catch (err) {
    log('Order push notification failed: ' + err.message)
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
