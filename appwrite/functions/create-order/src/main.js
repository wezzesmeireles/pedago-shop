import { Client, Databases, ID, Query, Permission, Role, Messaging } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

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

  async function sendDiscord(siteConfig, orderNumber, totalAmount, payLabel, customerName, customerEmail, guestPhone, itemsText, buyerLocation, status, extraMeta = {}) {
    if (!siteConfig) return
    const botToken = siteConfig.discordBotToken
    const channelId = siteConfig.discordChannelId
    const webhookUrl = siteConfig.discordWebhookUrl
    if (!botToken && !webhookUrl) return

    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://www.sitepedagogico.com'
      const isPaid = status === 'PAID'
      const isFree = totalAmount === 0 || payLabel.includes('Gratuito')
      const isCard = payLabel.includes('Cartão')
      const isPix = payLabel.includes('PIX')
      const phone = guestPhone ? String(guestPhone).replace(/\D/g, '') : ''
      const customerSearch = encodeURIComponent(customerEmail || customerName || phone || '')

      const components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Ver Pedido',
              url: `${frontendUrl}/admin/pedidos?search=${encodeURIComponent(orderNumber)}`,
              emoji: { name: '🧾' },
            },
            {
              type: 2,
              style: 5,
              label: 'Ver Cliente',
              url: `${frontendUrl}/admin/usuarios?search=${customerSearch}`,
              emoji: { name: '👤' },
            },
            ...(phone ? [{
              type: 2,
              style: 5,
              label: 'WhatsApp',
              url: `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá ${customerName ? customerName.split(' ')[0] : ''}! Tudo bem? Vi seu pedido ${orderNumber} no Site Pedagógico.`)}`,
              emoji: { name: '💬' },
            }] : []),
          ],
        },
      ]

      const customerInfo = [
        `**${customerName || 'Cliente'}**`,
        customerEmail ? `📧 \`${customerEmail}\`` : null,
        phone ? `📱 \`${guestPhone}\` *(Compra Rápida)*` : null,
      ].filter(Boolean).join('\n')

      const actionLinks = [
        `👉 [🧾 **Ver Pedido no Painel**](${frontendUrl}/admin/pedidos?search=${encodeURIComponent(orderNumber)})`,
        `👉 [👤 **Ver Perfil do Cliente**](${frontendUrl}/admin/usuarios?search=${customerSearch})`,
        ...(phone ? [`👉 [💬 **Chamar no WhatsApp**](https://wa.me/55${phone}?text=${encodeURIComponent(`Olá ${customerName ? customerName.split(' ')[0] : ''}! Tudo bem? Vi seu pedido ${orderNumber} no Site Pedagógico.`)})`] : []),
      ].join('\n')

      const fields = [
        { name: isPaid ? '💰 Valor Pago' : '💰 Total do Pedido', value: `**R$ ${Number(totalAmount || 0).toFixed(2)}**`, inline: true },
        { name: '💳 Método', value: payLabel, inline: true },
        { name: '📍 Local', value: buyerLocation || 'Brasil', inline: true },
        { name: '👤 Dados do Cliente', value: customerInfo || 'Cliente não identificado', inline: false },
      ]

      if (itemsText) {
        fields.push({ name: '📦 Itens do Pedido', value: `>>> ${itemsText.slice(0, 950)}`, inline: false })
      }

      if (extraMeta?.pixExpiresAt) {
        fields.push({ name: '⏰ Expiração do PIX', value: dtBR(extraMeta.pixExpiresAt), inline: true })
      }
      if (extraMeta?.mpPaymentId) {
        fields.push({ name: '🔑 ID Transação MP', value: `\`${extraMeta.mpPaymentId}\``, inline: true })
      }

      fields.push({
        name: '⚡ Ações Rápidas (Clique para abrir)',
        value: actionLinks,
        inline: false,
      })

      const title = isPaid
        ? `✅ Pedido ${orderNumber} — Pagamento Confirmado`
        : isFree
        ? `🎁 Pedido ${orderNumber} — Material Gratuito Baixado`
        : isCard
        ? `💳 Pedido ${orderNumber} — Checkout no Cartão Iniciado`
        : `⏳ Pedido ${orderNumber} — PIX Gerado (Aguardando Pagamento)`

      const color = isPaid ? 0x10B981 : isFree ? 0x8B5CF6 : isCard ? 0xF59E0B : 0x3B82F6
      const content = isPaid
        ? `💸 **PAGAMENTO CONFIRMADO!** R$ ${Number(totalAmount || 0).toFixed(2)}`
        : isFree
        ? `🎁 **NOVO MATERIAL GRATUITO BAIXADO!**`
        : isCard
        ? `💳 **NOVO CHECKOUT NO CARTÃO!** — R$ ${Number(totalAmount || 0).toFixed(2)}`
        : `⏳ **NOVO PIX GERADO (Aguardando Pagamento)!** — R$ ${Number(totalAmount || 0).toFixed(2)}`

      const payload = {
        content,
        embeds: [{
          title,
          color,
          author: {
            name: 'Site Pedagógico • Notificação de Pedido',
            icon_url: 'https://www.sitepedagogico.com/favicon.ico',
          },
          fields,
          footer: { text: 'Site Pedagógico • Notificações em Tempo Real' },
          timestamp: new Date().toISOString(),
        }],
        components,
      }

      // Priority 1: Discord Bot API (Native physical buttons)
      if (botToken && channelId) {
        try {
          const botResp = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
          if (botResp.ok) return
          const errText = await botResp.text()
          log(`Discord Bot API failed (${botResp.status}): ${errText}`)
        } catch (botErr) {
          log('Discord Bot API error: ' + botErr.message)
        }
      }

      // Priority 2: Fallback to Webhook
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
    } catch (err) {
      log('Discord notification failed: ' + err.message)
    }
  }

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON' }, 400)
  }

  // Use the user ID from the Appwrite-injected header — this is always the real
  // caller's ID regardless of what the body says, preventing IDOR attacks where
  // an attacker crafts a request with another user's ID in the body.
  const userId = req.headers['x-appwrite-user-id'] || body.userId
  const { customerName, customerEmail, items, paymentMethod, guestPhone } = body
  if (!userId || !items?.length) return res.json({ error: 'userId and items required' }, 400)

  const buyerIp = (req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.headers['x-real-ip'] || ''
  const geoTask = geolocate(buyerIp)

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
      // Clamp quantity to a safe range — negative or zero quantity would produce
      // a zero/negative total, allowing free checkout of paid products.
      const quantity = Math.max(1, Math.min(10, parseInt(String(item.quantity ?? 1)) || 1))
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
  const orderId = ID.unique()
  const now = new Date().toISOString()

  // Auto-link or create profile for buyer (including Compra Rápida / guest checkout)
  let effectiveUserId = userId
  try {
    let targetProfile = null
    if (userId) {
      const pByUid = await db.listDocuments(DB, 'profiles', [Query.equal('userId', userId), Query.limit(1)])
      targetProfile = pByUid.documents[0]
    }
    if (!targetProfile && customerEmail) {
      const pByEmail = await db.listDocuments(DB, 'profiles', [Query.equal('email', String(customerEmail).trim()), Query.limit(1)])
      targetProfile = pByEmail.documents[0]
    }
    if (!targetProfile && guestPhone) {
      const cleanPhone = String(guestPhone).replace(/\D/g, '')
      if (cleanPhone) {
        const pByPhone = await db.listDocuments(DB, 'profiles', [Query.equal('phone', cleanPhone), Query.limit(1)])
        targetProfile = pByPhone.documents[0]
      }
    }

    if (targetProfile) {
      effectiveUserId = targetProfile.userId || targetProfile.$id
      const updates = {}
      if (!targetProfile.phone && guestPhone) updates.phone = String(guestPhone).replace(/\D/g, '')
      if (!targetProfile.name && customerName) updates.name = String(customerName).trim()
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = now
        await db.updateDocument(DB, 'profiles', targetProfile.$id, updates)
      }
    } else {
      const profId = userId || ID.unique()
      effectiveUserId = profId
      const cleanPhone = guestPhone ? String(guestPhone).replace(/\D/g, '') : ''
      await db.createDocument(DB, 'profiles', profId, {
        userId: profId,
        name: customerName ? String(customerName).trim() : 'Cliente Compra Rápida',
        email: customerEmail ? String(customerEmail).trim() : '',
        phone: cleanPhone,
        role: 'CUSTOMER',
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
    }
  } catch (profErr) {
    log('Profile auto-link/creation warning: ' + profErr.message)
  }

  // Per-document read for the buyer. The collections only grant collection-level
  // read to label:admin, so without this the customer can't read their own
  // order/items/tokens — breaking "Meus Pedidos", "Meus Downloads" and the
  // checkout-success page. Admin still reads everything via the admin label.
  const ownerRead = [Permission.read(Role.user(effectiveUserId))]

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
    userId: effectiveUserId,

    customerName: customerName ?? '',
    customerEmail: customerEmail ?? '',
    guestPhone: guestPhone ?? null,
    status,
    totalAmount,
    paymentMethod: method ?? null,
    mpPaymentId,
    mpPreferenceId,
    mpStatus,
    paidAt: isFree ? now : null,
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

  // Notifications (Discord & Telegram)
  try {
    const buyerLocation = await geoTask
    const payLabel = method === 'PIX' ? '💠 PIX'
      : method === 'CREDIT_CARD' ? '💳 Cartão de Crédito'
      : method === 'FREE' ? '🎁 Gratuito'
      : esc(method || '—')
    const statusLabel = status === 'PAID' ? '✅ Pago' : '⏳ Aguardando pagamento'
    const itemsText = orderItems
      .map(oi => `• ${oi.product.name}${((oi.quantity || 1) > 1) ? ` (x${oi.quantity})` : ''}`)
      .join('\n') || '—'

    // Discord (Bot API with native buttons or Webhook)
    if (siteConfig?.discordBotToken || siteConfig?.discordWebhookUrl) {
      await sendDiscord(
        siteConfig,
        orderNumber,
        totalAmount,
        payLabel,
        customerName,
        customerEmail,
        guestPhone,
        itemsText,
        buyerLocation,
        status,
        {
          pixExpiresAt: method === 'PIX' ? mpResult?.date_of_expiration : null,
          mpPaymentId,
        }
      )
    }

    // Telegram
    if (siteConfig?.telegramBotToken) {
      const recipients = siteConfig.telegramRecipients ?? []
      const chatIds = recipients.length > 0
        ? recipients.map(r => r.chatId)
        : siteConfig.telegramChatId ? [siteConfig.telegramChatId] : []

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
    log('Notification failed: ' + err.message)
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
