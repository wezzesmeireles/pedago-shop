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

async function processPayment(paymentId: string, orderId: string) {
  const cfg = await getSiteConfig();
  const accessToken = cfg.mercadoPagoAccessToken?.trim() || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return;
  const payment = await res.json();
  const mpStatus = payment.status;

  if (mpStatus === 'approved') {
    const { data: order } = await supabase.from('orders').select('*, order_items(*)').eq('id', orderId).single();
    if (!order || order.status === 'PAID') return;

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
      const { data: existing } = await supabase
        .from('download_tokens')
        .select('id')
        .eq('order_item_id', item.id)
        .single();

      if (!existing) {
        await supabase.from('download_tokens').insert({
          order_id: orderId,
          order_item_id: item.id,
          max_downloads: 99999,
          expires_at: tokenExpires.toISOString(),
        });
      }

      const { data: prod } = await supabase.from('products').select('sales_count').eq('id', item.product_id).single();
      await supabase.from('products').update({ sales_count: (prod?.sales_count ?? 0) + item.quantity }).eq('id', item.product_id);
    }

    console.log(`Reconciled order ${orderId} → PAID`);
  } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
    await supabase.from('orders').update({ status: 'CANCELLED', mp_status: mpStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
  }
}

Deno.serve(async () => {
  // Only process orders awaiting payment with a known mp_payment_id, created within last 2 hours
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: pending } = await supabase
    .from('orders')
    .select('id, mp_payment_id')
    .eq('status', 'AWAITING_PAYMENT')
    .not('mp_payment_id', 'is', null)
    .gte('created_at', cutoff);

  if (!pending?.length) return new Response('nothing to do', { status: 200 });

  await Promise.all(pending.map((o: any) => processPayment(o.mp_payment_id, o.id)));

  return new Response(`reconciled ${pending.length} orders`, { status: 200 });
});
