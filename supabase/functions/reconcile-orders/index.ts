import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function getSiteConfig() {
  const { data } = await supabase.from('site_config').select('value').eq('key', 'global').single();
  return (data?.value as Record<string, any>) ?? {};
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));
}

function nowBR() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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

async function markPaid(order: any, payment: any, cfg: Record<string, any>) {
  if (order.status === 'PAID') return;

  await supabase.from('orders').update({
    status: 'PAID',
    mp_payment_id: String(payment.id),
    mp_status: payment.status,
    paid_at: new Date().toISOString(),
    payment_method: payment.payment_type_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
    updated_at: new Date().toISOString(),
  }).eq('id', order.id);

  const tokenExpires = new Date();
  tokenExpires.setFullYear(tokenExpires.getFullYear() + 30);

  for (const item of order.order_items ?? []) {
    const { data: existing } = await supabase
      .from('download_tokens').select('id').eq('order_item_id', item.id).single();
    if (!existing) {
      await supabase.from('download_tokens').insert({
        order_id: order.id,
        order_item_id: item.id,
        max_downloads: 99999,
        expires_at: tokenExpires.toISOString(),
        delivery_link: item.products?.delivery_link ?? null,
      });
    }
    const { data: prod } = await supabase.from('products').select('sales_count').eq('id', item.product_id).single();
    await supabase.from('products').update({ sales_count: (prod?.sales_count ?? 0) + item.quantity }).eq('id', item.product_id);
  }

  console.log(`Reconciled order ${order.id} → PAID`);

  // Telegram notification
  const customerName = order.customer_name ?? 'Cliente';
  const orderNumber = order.order_number ?? order.id.slice(0, 8).toUpperCase();
  const methodEmoji = payment.payment_type_id === 'pix' ? '🟢 PIX' : '💳 Cartao de Credito';
  const itemsList = (order.order_items ?? [])
    .map((i: any) => `    📌 ${esc(i.product_name ?? 'Produto')} x${i.quantity}  —  ${fmt((i.unit_price ?? 0) * i.quantity)}`)
    .join('\n');

  await tg(cfg,
    `🎉 <b>VENDA APROVADA!</b>\n` +
    `——————————————————\n\n` +
    `📋 <b>Pedido:</b> <code>#${esc(orderNumber)}</code>\n` +
    `👤 <b>Cliente:</b> ${esc(customerName)}\n` +
    (order.customer_email ? `📧 <b>Email:</b> ${esc(order.customer_email)}\n` : '') +
    `\n💳 <b>Pagamento:</b> ${methodEmoji}\n` +
    `✅ <b>Status:</b> Pagamento Confirmado\n\n` +
    (itemsList ? `🛍️ <b>Itens Comprados:</b>\n${itemsList}\n\n` : '') +
    `💰 <b>Total Recebido: ${fmt(order.total_amount)}</b>\n\n` +
    `🕐 ${nowBR()}`,
  );
}

async function processPixOrder(order: any, accessToken: string, cfg: Record<string, any>) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${order.mp_payment_id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return;
  const payment = await res.json();

  if (payment.status === 'approved') {
    await markPaid(order, payment, cfg);
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await supabase.from('orders').update({ status: 'CANCELLED', mp_status: payment.status, updated_at: new Date().toISOString() }).eq('id', order.id);
  }
}

async function processCardOrder(order: any, accessToken: string, cfg: Record<string, any>) {
  // Search payments by external_reference (order id) — card payments don't have mp_payment_id yet
  const res = await fetch(
    `https://api.mercadopago.com/v1/payments/search?external_reference=${order.id}&sort=date_created&criteria=desc&limit=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) return;
  const result = await res.json();
  const payment = result.results?.[0];
  if (!payment) return;

  // Save mp_payment_id even if pending, so webhook can confirm later
  if (!order.mp_payment_id && payment.id) {
    await supabase.from('orders').update({ mp_payment_id: String(payment.id), mp_status: payment.status }).eq('id', order.id);
  }

  if (payment.status === 'approved') {
    await markPaid(order, payment, cfg);
  } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
    await supabase.from('orders').update({ status: 'CANCELLED', mp_status: payment.status, updated_at: new Date().toISOString() }).eq('id', order.id);
  }
}

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const specificOrderId = body?.orderId as string | undefined;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let query = supabase
    .from('orders')
    .select('id, mp_payment_id, mp_preference_id, payment_method, order_items(*, products(delivery_type, delivery_link))')
    .eq('status', 'AWAITING_PAYMENT')
    .gte('created_at', cutoff);

  if (specificOrderId) query = query.eq('id', specificOrderId);

  const { data: pending } = await query;

  if (!pending?.length) return new Response('nothing to do', { status: 200 });

  const cfg = await getSiteConfig();
  const accessToken = cfg.mercadoPagoAccessToken?.trim() || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
  if (!accessToken) return new Response('no access token', { status: 500 });

  await Promise.all(pending.map((o: any) => {
    if (o.mp_payment_id) return processPixOrder(o, accessToken, cfg);
    if (o.mp_preference_id || o.payment_method === 'CREDIT_CARD') return processCardOrder(o, accessToken, cfg);
    return Promise.resolve();
  }));

  return new Response(`reconciled ${pending.length} orders`, { status: 200 });
});
