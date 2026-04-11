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
  const { data: existing } = await supabase.from('webhook_events').select('status').eq('source', 'mercadopago').eq('event_id', eventId).single();
  if (existing?.status === 'processed') return new Response('ok', { status: 200 });

  await supabase.from('webhook_events').upsert(
    { source: 'mercadopago', event_id: eventId, event_type: eventType, payload: body, status: 'processing' },
    { onConflict: 'source,event_id' },
  );

  try {
    const accessToken = cfg.mercadoPagoAccessToken?.trim() || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
    const payment = await getPayment(eventId, accessToken);
    const mpStatus = payment.status ?? 'unknown';
    const orderId = payment.external_reference;

    if (orderId && mpStatus === 'approved') {
      const { data: order } = await supabase.from('orders').select('*, order_items(*, products(delivery_type, delivery_link))').eq('id', orderId).single();
      if (order && order.status !== 'PAID') {
        await supabase.from('orders').update({
          status: 'PAID',
          mp_payment_id: String(payment.id),
          mp_status: mpStatus,
          paid_at: new Date().toISOString(),
          payment_method: payment.payment_type_id === 'pix' ? 'PIX' : 'CREDIT_CARD',
          updated_at: new Date().toISOString(),
        }).eq('id', orderId);

        const tokenExpires = new Date();
        tokenExpires.setFullYear(tokenExpires.getFullYear() + 30);

        for (const item of order.order_items) {
          await supabase.from('download_tokens').insert({
            order_id: orderId,
            order_item_id: item.id,
            max_downloads: 99999,
            expires_at: tokenExpires.toISOString(),
            delivery_link: item.products?.delivery_link ?? null,
          });

          const { data: prod } = await supabase.from('products').select('sales_count').eq('id', item.product_id).single();
          const newCount = (prod?.sales_count ?? 0) + item.quantity;
          await supabase.from('products').update({ sales_count: newCount }).eq('id', item.product_id);
        }
      }
    } else if (orderId && (mpStatus === 'rejected' || mpStatus === 'cancelled')) {
      const { data: order } = await supabase.from('orders').select('id, status').eq('id', orderId).single();
      if (order && order.status !== 'PAID') {
        await supabase.from('orders').update({ status: 'CANCELLED', mp_status: mpStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      }
    } else if (orderId && (mpStatus === 'refunded' || mpStatus === 'charged_back')) {
      await supabase.from('orders').update({ status: 'REFUNDED', mp_status: mpStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      await supabase.from('download_tokens').update({ revoked_at: new Date().toISOString() }).eq('order_id', orderId).is('revoked_at', null);
    }

    await supabase.from('webhook_events').update({ status: 'processed' }).eq('source', 'mercadopago').eq('event_id', eventId);
    return new Response('ok', { status: 200 });
  } catch (e) {
    await supabase.from('webhook_events').update({ status: 'failed', error_message: String(e) }).eq('source', 'mercadopago').eq('event_id', eventId);
    return new Response('error', { status: 500 });
  }
});
