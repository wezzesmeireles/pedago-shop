import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function getSiteConfig(supabase: any) {
  const { data } = await supabase.from('site_config').select('value').eq('key', 'global').single();
  return (data?.value as Record<string, any>) ?? {};
}

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

function nowBR() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildItemsList(orderItems: any[]) {
  return orderItems.map((i: any) =>
    `    📌 ${esc(i.product_name ?? 'Produto')} x${i.quantity}  —  ${fmt(i.unit_price * i.quantity)}`
  ).join('\n');
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function tg(cfg: Record<string, any>, html: string) {
  const token = cfg.telegramBotToken?.trim();
  if (!token) { console.log('[tg] skipped — token not configured'); return; }

  const recipients: { chatId: string }[] =
    cfg.telegramRecipients?.length
      ? cfg.telegramRecipients.filter((r: any) => r.chatId?.trim())
      : cfg.telegramChatId ? [{ chatId: cfg.telegramChatId }] : [];

  if (!recipients.length) { console.log('[tg] skipped — no recipients'); return; }

  await Promise.all(recipients.map(async (r) => {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: r.chatId.trim(), text: html, parse_mode: 'HTML' }),
      });
      const json = await res.json();
      if (!json.ok) console.error(`[tg] error ${r.chatId}:`, JSON.stringify(json));
      else console.log(`[tg] sent ok → ${r.chatId}`);
    } catch (e) {
      console.error(`[tg] fetch error ${r.chatId}:`, e);
    }
  }));
}

async function mpPost(path: string, body: unknown, accessToken: string, idempotencyKey?: string) {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`https://api.mercadopago.com${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message ?? data?.error ?? `MP API error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado.' }, 401);

  const userRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: Deno.env.get('SUPABASE_ANON_KEY')! },
  });
  if (!userRes.ok) return json({ error: 'Token inválido.' }, 401);
  const user = await userRes.json();
  if (!user?.id) return json({ error: 'Token inválido.' }, 401);

  const body = await req.json();
  const { items, paymentMethod } = body;

  if (!items?.length || !paymentMethod) return json({ error: 'Dados inválidos.' }, 400);

  const { data: profile } = await supabase.from('profiles').select('id, name').eq('id', user.id).single();

  const productIds = items.map((i: any) => i.productId);
  const { data: products } = await supabase
    .from('products').select('id, name, price')
    .in('id', productIds).eq('is_active', true).is('deleted_at', null);

  if (!products || products.length !== productIds.length) {
    return json({ error: 'Produto não disponível.' }, 400);
  }

  const productMap = new Map(products.map((p: any) => [p.id, p]));
  const round = (v: number) => Math.round(Number(v) * 100) / 100;
  const totalAmount = round(items.reduce((sum: number, item: any) => {
    return sum + Number(productMap.get(item.productId)!.price) * item.quantity;
  }, 0));

  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = `ORD-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, '0')}`;

  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    order_number: orderNumber,
    user_id: user.id,
    status: 'AWAITING_PAYMENT',
    total_amount: totalAmount,
    payment_method: paymentMethod,
    customer_email: user.email,
    customer_name: profile?.name ?? user.email,
    expires_at: new Date(Date.now() + 30 * 60_000).toISOString(),
  }).select().single();

  if (orderErr || !order) return json({ error: 'Erro ao criar pedido.' }, 500);

  const itemsData = items.map((item: any) => {
    const p = productMap.get(item.productId)!;
    return { order_id: order.id, product_id: item.productId, product_name: p.name, unit_price: p.price, quantity: item.quantity };
  });
  const { data: orderItems } = await supabase.from('order_items').insert(itemsData).select();
  const fullOrder = { ...order, items: orderItems ?? [] };

  const cfg = await getSiteConfig(supabase);
  const accessToken = cfg.mercadoPagoAccessToken?.trim() || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';

  if (!accessToken) return json({ error: 'Token do Mercado Pago não configurado.' }, 500);

  const frontendUrl = Deno.env.get('FRONTEND_URL') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const webhookUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

  try {
    if (paymentMethod === 'PIX') {
      const [firstName, ...rest] = (profile?.name ?? 'Cliente').trim().split(' ');
      const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString().replace('Z', '-03:00');

      const result = await mpPost('/v1/payments', {
        transaction_amount: totalAmount,
        description: `Pedido ${orderNumber}`,
        payment_method_id: 'pix',
        payer: { email: user.email, first_name: firstName, last_name: rest.join(' ') || firstName },
        additional_info: {
          items: (orderItems ?? []).map((item: any) => ({
            id: item.product_id,
            title: item.product_name,
            description: item.product_name,
            category_id: 'education',
            quantity: item.quantity,
            unit_price: round(item.unit_price),
          })),
        },
        external_reference: order.id,
        date_of_expiration: expiresAt,
        notification_url: webhookUrl,
      }, accessToken, `pix-${order.id}`);

      const qrCode = result.point_of_interaction?.transaction_data?.qr_code ?? '';
      const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';

      await supabase.from('orders').update({
        mp_payment_id: String(result.id),
        metadata: { qr_code: qrCode, qr_code_base64: qrCodeBase64 },
      }).eq('id', order.id);

      const itemsList = buildItemsList(orderItems ?? []);
      const clientName = profile?.name ?? user.email ?? 'Desconhecido';
      await tg(cfg,
        `🔔 <b>NOVO PEDIDO — PIX GERADO</b>\n` +
        `——————————————————\n\n` +
        `📋 <b>Pedido:</b> <code>#${esc(orderNumber)}</code>\n` +
        `👤 <b>Cliente:</b> ${esc(clientName)}\n` +
        `📧 <b>Email:</b> ${esc(user.email)}\n\n` +
        `🟢 <b>Pagamento:</b> PIX\n` +
        `⏳ <b>Status:</b> Aguardando pagamento\n` +
        `⌛ <b>Expira em:</b> 30 minutos\n\n` +
        `🛍️ <b>Itens do Pedido:</b>\n${itemsList}\n\n` +
        `💰 <b>Total: ${fmt(totalAmount)}</b>\n\n` +
        `🕐 ${nowBR()}`,
      );

      return json({ order: fullOrder, payment: { type: 'PIX', qrCode, qrCodeBase64 } });

    } else {
      const result = await mpPost('/checkout/preferences', {
        items: (orderItems ?? []).map((item: any) => ({
          id: item.product_id,
          title: item.product_name,
          description: `Produto digital — ${item.product_name}`,
          category_id: 'education',
          quantity: item.quantity,
          unit_price: round(item.unit_price),
          currency_id: 'BRL',
        })),
        payer: { name: profile?.name ?? '', email: user.email },
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }, { id: 'digital_currency' }],
          installments: 12,
        },
        ...(frontendUrl && {
          back_urls: {
            success: `${frontendUrl}/checkout/success/${order.id}`,
            failure: `${frontendUrl}/checkout/failure/${order.id}`,
            pending: `${frontendUrl}/checkout/success/${order.id}`,
          },
          auto_return: 'approved',
        }),
        external_reference: order.id,
        notification_url: webhookUrl,
      }, accessToken);

      await supabase.from('orders').update({ mp_preference_id: result.id }).eq('id', order.id);

      const itemsList = buildItemsList(orderItems ?? []);
      const clientName = profile?.name ?? user.email ?? 'Desconhecido';
      await tg(cfg,
        `🔔 <b>NOVO PEDIDO — CARTÃO DE CRÉDITO</b>\n` +
        `——————————————————\n\n` +
        `📋 <b>Pedido:</b> <code>#${esc(orderNumber)}</code>\n` +
        `👤 <b>Cliente:</b> ${esc(clientName)}\n` +
        `📧 <b>Email:</b> ${esc(user.email)}\n\n` +
        `💳 <b>Pagamento:</b> Cartao de Credito\n` +
        `⏳ <b>Status:</b> Redirecionado para checkout\n\n` +
        `🛍️ <b>Itens do Pedido:</b>\n${itemsList}\n\n` +
        `💰 <b>Total: ${fmt(totalAmount)}</b>\n\n` +
        `🕐 ${nowBR()}`,
      );

      return json({
        order: fullOrder,
        payment: { type: 'CARD', initPoint: result.init_point, sandboxInitPoint: result.sandbox_init_point },
      });
    }
  } catch (mpErr: any) {
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);
    return json({ error: `Erro Mercado Pago: ${mpErr.message}` }, 500);
  }
  } catch (err: any) {
    console.error('[create-order] error:', err);
    return json({ error: `Erro interno: ${err.message}` }, 500);
  }
});
