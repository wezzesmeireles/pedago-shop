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

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n));

function nowBR() {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildItemsList(items: any[]) {
  return (items ?? []).map((i: any) =>
    `    📌 ${esc(i.product_name ?? 'Produto')} x${i.quantity}  —  ${fmt((i.unit_price ?? 0) * i.quantity)}`
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

function orderSummary(order: any) {
  const customerName = order.customer_name ?? order.profiles?.name ?? 'Cliente';
  const orderNumber = order.order_number ?? order.id.slice(0, 8).toUpperCase();
  return { customerName, orderNumber };
}

async function verifySignature(xSignature: string, queryId?: string, xRequestId?: string, secret?: string): Promise<boolean> {
  if (!secret) return true;
  try {
    const parts = xSignature.split(',');
    const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
    const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];
    if (!ts || !v1) return false;
    if (Math.abs(Date.now() / 1000 - parseInt(ts)) > 300) return false;
    const manifest = `id:${queryId ?? ''};request-id:${xRequestId ?? ''};ts:${ts};`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
    const expected = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
    return expected === v1;
  } catch { return false; }
}

async function getPayment(paymentId: string, accessToken: string) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`MP API error ${res.status}`);
  return res.json();
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const queryId = url.searchParams.get('id') ?? undefined;
  const topic = url.searchParams.get('topic') ?? undefined;
  const queryType = url.searchParams.get('type') ?? undefined;

  const xSignature = req.headers.get('x-signature') ?? undefined;
  const xRequestId = req.headers.get('x-request-id') ?? undefined;

  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const paymentId = body?.data?.id ?? queryId;
  const eventType = body?.type ?? queryType ?? topic ?? 'payment';

  if (!paymentId || eventType !== 'payment') return new Response('ok', { status: 200 });

  const cfg = await getSiteConfig();
  const webhookSecret = cfg.mercadoPagoWebhookSecret?.trim() || Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET');

  if (xSignature && webhookSecret) {
    const valid = await verifySignature(xSignature, queryId, xRequestId, webhookSecret);
    if (!valid) return new Response('Invalid signature', { status: 400 });
  }

  const eventId = String(paymentId);

  // Skip only if already fully processed or currently being processed.
  // 'skipped' means a non-actionable status (pending/in_process) was received before —
  // we allow reprocessing so the final 'approved' event is not blocked.
  const { data: existing } = await supabase
    .from('webhook_events')
    .select('status')
    .eq('source', 'mercadopago')
    .eq('event_id', eventId)
    .single();

  if (existing?.status === 'processed' || existing?.status === 'processing') {
    console.log(`[webhook] event ${eventId} already ${existing.status} — skipping`);
    return new Response('ok', { status: 200 });
  }

  await supabase.from('webhook_events').upsert(
    { source: 'mercadopago', event_id: eventId, event_type: eventType, payload: body, status: 'processing' },
    { onConflict: 'source,event_id' },
  );

  try {
    const accessToken = cfg.mercadoPagoAccessToken?.trim() || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
    const payment = await getPayment(eventId, accessToken);
    const mpStatus = payment.status ?? 'unknown';
    const orderId = payment.external_reference;

    console.log(`[webhook] payment ${eventId} status=${mpStatus} order=${orderId}`);

    if (orderId && mpStatus === 'approved') {
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*, products(delivery_type, delivery_link))')
        .eq('id', orderId)
        .single();

      if (order) {
        // Atomic update: only succeeds if order is still AWAITING_PAYMENT.
        // This prevents duplicate notifications if webhook fires multiple times simultaneously.
        const { data: updated } = await supabase.from('orders').update({
          status: 'PAID',
          mp_payment_id: String(payment.id),
          mp_status: mpStatus,
          paid_at: new Date().toISOString(),
          payment_method: payment.payment_type_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
          updated_at: new Date().toISOString(),
        }).eq('id', orderId).eq('status', 'AWAITING_PAYMENT').select('id');

        if (updated?.length) {
          // We won the race — create tokens and notify
          const tokenExpires = new Date();
          tokenExpires.setFullYear(tokenExpires.getFullYear() + 30);

          for (const item of order.order_items) {
            const { data: existingToken } = await supabase
              .from('download_tokens').select('id').eq('order_item_id', item.id).single();
            if (!existingToken) {
              await supabase.from('download_tokens').insert({
                order_id: orderId,
                order_item_id: item.id,
                max_downloads: 99999,
                expires_at: tokenExpires.toISOString(),
                delivery_link: item.products?.delivery_link ?? null,
              });
            }
            const { data: prod } = await supabase.from('products').select('sales_count').eq('id', item.product_id).single();
            const newCount = (prod?.sales_count ?? 0) + item.quantity;
            await supabase.from('products').update({ sales_count: newCount }).eq('id', item.product_id);
          }

          const { customerName, orderNumber } = orderSummary(order);
          const methodEmoji = payment.payment_type_id === 'pix' ? '🟢 PIX' : '💳 Cartao de Credito';
          const installments = payment.installments && payment.installments > 1
            ? ` (${payment.installments}x de ${fmt(payment.transaction_amount / payment.installments)})` : '';
          const itemsList = buildItemsList(order.order_items ?? []);
          const customerEmail = order.customer_email ?? '';

          await tg(cfg,
            `🎉 <b>VENDA APROVADA!</b>\n` +
            `——————————————————\n\n` +
            `📋 <b>Pedido:</b> <code>#${esc(orderNumber)}</code>\n` +
            `👤 <b>Cliente:</b> ${esc(customerName)}\n` +
            (customerEmail ? `📧 <b>Email:</b> ${esc(customerEmail)}\n` : '') +
            `\n💳 <b>Pagamento:</b> ${methodEmoji}${esc(installments)}\n` +
            `✅ <b>Status:</b> Pagamento Confirmado\n\n` +
            `🛍️ <b>Itens Comprados:</b>\n${itemsList}\n\n` +
            `💰 <b>Total Recebido: ${fmt(order.total_amount)}</b>\n\n` +
            `🕐 ${nowBR()}`,
          );
        } else {
          console.log(`[webhook] order ${orderId} already PAID — no duplicate notification sent`);
        }
      }

    } else if (orderId && (mpStatus === 'rejected' || mpStatus === 'cancelled')) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, order_number, customer_name, total_amount, order_items(product_name, quantity)')
        .eq('id', orderId)
        .single();

      if (order) {
        const { data: updated } = await supabase.from('orders')
          .update({ status: 'CANCELLED', mp_status: mpStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId).eq('status', 'AWAITING_PAYMENT').select('id');

        if (updated?.length) {
          const { customerName, orderNumber } = orderSummary(order);
          const statusLabel = mpStatus === 'rejected' ? 'RECUSADO' : 'CANCELADO';
          const statusEmoji = mpStatus === 'rejected' ? '🚫' : '❌';
          await tg(cfg,
            `${statusEmoji} <b>PAGAMENTO ${statusLabel}</b>\n` +
            `——————————————————\n\n` +
            `📋 <b>Pedido:</b> <code>#${esc(orderNumber)}</code>\n` +
            `👤 <b>Cliente:</b> ${esc(customerName)}\n` +
            `💰 <b>Valor:</b> ${fmt(order.total_amount)}\n\n` +
            `⚠️ <b>Motivo:</b> Pagamento ${statusLabel.toLowerCase()} pelo Mercado Pago\n\n` +
            `🕐 ${nowBR()}`,
          );
        }
      }

    } else if (orderId && (mpStatus === 'refunded' || mpStatus === 'charged_back')) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, status, order_number, customer_name, total_amount')
        .eq('id', orderId)
        .single();

      const { data: updated } = await supabase.from('orders')
        .update({ status: 'REFUNDED', mp_status: mpStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId).neq('status', 'REFUNDED').select('id');

      if (updated?.length) {
        await supabase.from('download_tokens').update({ revoked_at: new Date().toISOString() }).eq('order_id', orderId).is('revoked_at', null);
        if (order) {
          const { customerName, orderNumber } = orderSummary(order);
          await tg(cfg,
            `↩️ <b>REEMBOLSO PROCESSADO</b>\n` +
            `——————————————————\n\n` +
            `📋 <b>Pedido:</b> <code>#${esc(orderNumber)}</code>\n` +
            `👤 <b>Cliente:</b> ${esc(customerName)}\n` +
            `💸 <b>Valor Reembolsado:</b> ${fmt(order.total_amount)}\n\n` +
            `ℹ️ Downloads do cliente revogados automaticamente.\n\n` +
            `🕐 ${nowBR()}`,
          );
        }
      }

    } else {
      // Non-actionable status: pending, in_process, authorized, etc.
      // Mark as 'skipped' (not 'processed') so that the later 'approved' webhook
      // for this same payment_id is not blocked by the deduplication check.
      console.log(`[webhook] payment ${eventId} status=${mpStatus} — non-actionable, marking skipped`);
      await supabase.from('webhook_events').update({ status: 'skipped' }).eq('source', 'mercadopago').eq('event_id', eventId);
      return new Response('ok', { status: 200 });
    }

    await supabase.from('webhook_events').update({ status: 'processed' }).eq('source', 'mercadopago').eq('event_id', eventId);
    return new Response('ok', { status: 200 });

  } catch (e) {
    console.error('[webhook] error:', e);
    await supabase.from('webhook_events').update({ status: 'failed', error_message: String(e) }).eq('source', 'mercadopago').eq('event_id', eventId);
    return new Response('error', { status: 500 });
  }
});
