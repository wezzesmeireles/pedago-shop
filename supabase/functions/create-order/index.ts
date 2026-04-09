import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import { MercadoPagoConfig, Payment, Preference } from 'https://esm.sh/mercadopago@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getSiteConfig(supabase: any) {
  const { data } = await supabase.from('site_config').select('value').eq('key', 'global').single();
  return (data?.value as Record<string, any>) ?? {};
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Verify user auth
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response(JSON.stringify({ message: 'Não autenticado.' }), { status: 401, headers: corsHeaders });

  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authError || !user) return new Response(JSON.stringify({ message: 'Token inválido.' }), { status: 401, headers: corsHeaders });

  const body = await req.json();
  const { items, paymentMethod } = body;

  if (!items?.length || !paymentMethod) {
    return new Response(JSON.stringify({ message: 'Dados inválidos.' }), { status: 400, headers: corsHeaders });
  }

  // Fetch profile
  const { data: profile } = await supabase.from('profiles').select('id, name').eq('id', user.id).single();

  // Validate products
  const productIds = items.map((i: any) => i.productId);
  const { data: products } = await supabase.from('products').select('id, name, price').in('id', productIds).eq('is_active', true).is('deleted_at', null);
  if (!products || products.length !== productIds.length) {
    return new Response(JSON.stringify({ message: 'Produto não disponível.' }), { status: 400, headers: corsHeaders });
  }

  const productMap = new Map(products.map((p: any) => [p.id, p]));
  const totalAmount = items.reduce((sum: number, item: any) => {
    return sum + Number(productMap.get(item.productId)!.price) * item.quantity;
  }, 0);

  // Generate order number
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = `ORD-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, '0')}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Create order
  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    order_number: orderNumber,
    user_id: user.id,
    status: 'AWAITING_PAYMENT',
    total_amount: totalAmount,
    payment_method: paymentMethod,
    customer_email: user.email,
    customer_name: profile?.name ?? user.email,
    expires_at: expiresAt,
  }).select().single();

  if (orderErr || !order) return new Response(JSON.stringify({ message: 'Erro ao criar pedido.' }), { status: 500, headers: corsHeaders });

  // Create order items
  const itemsData = items.map((item: any) => {
    const p = productMap.get(item.productId)!;
    return { order_id: order.id, product_id: item.productId, product_name: p.name, unit_price: p.price, quantity: item.quantity };
  });
  const { data: orderItems } = await supabase.from('order_items').insert(itemsData).select();
  const fullOrder = { ...order, items: orderItems ?? [] };

  // Get MP credentials
  const cfg = await getSiteConfig(supabase);
  const accessToken = cfg.mercadoPagoAccessToken?.trim() || Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN') || '';
  const client = new MercadoPagoConfig({ accessToken });

  const frontendUrl = Deno.env.get('FRONTEND_URL') || '';
  const roundAmount = (v: number) => Math.round(Number(v) * 100) / 100;

  try {
    if (paymentMethod === 'PIX') {
      const payment = new Payment(client);
      const [firstName, ...rest] = (profile?.name ?? 'Cliente').trim().split(' ');
      const expiresAt30 = new Date(Date.now() + 30 * 60_000).toISOString().replace('Z', '-03:00');

      const result = await payment.create({
        requestOptions: { idempotencyKey: `pix-${order.id}` },
        body: {
          transaction_amount: roundAmount(totalAmount),
          description: `Pedido ${orderNumber}`,
          payment_method_id: 'pix',
          binary_mode: false,
          payer: { email: user.email, first_name: firstName, last_name: rest.join(' ') || firstName },
          additional_info: {
            items: (orderItems ?? []).map((item: any) => ({
              id: item.product_id, title: item.product_name, description: item.product_name,
              category_id: 'education', quantity: item.quantity, unit_price: roundAmount(item.unit_price),
            })),
          },
          metadata: { order_id: order.id, order_number: orderNumber },
          external_reference: order.id,
          date_of_expiration: expiresAt30,
        },
      });

      const qrCode = result.point_of_interaction?.transaction_data?.qr_code ?? '';
      const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';

      await supabase.from('orders').update({
        mp_payment_id: String(result.id),
        metadata: { qr_code: qrCode, qr_code_base64: qrCodeBase64 },
      }).eq('id', order.id);

      return new Response(JSON.stringify({
        order: fullOrder,
        payment: { type: 'PIX', qrCode, qrCodeBase64 },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else {
      const preference = new Preference(client);
      const pref = await preference.create({
        body: {
          items: (orderItems ?? []).map((item: any) => ({
            id: item.product_id, title: item.product_name,
            description: `Produto digital — ${item.product_name}`,
            category_id: 'education', quantity: item.quantity,
            unit_price: roundAmount(item.unit_price), currency_id: 'BRL',
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
          metadata: { order_id: order.id, order_number: orderNumber },
        },
      });

      await supabase.from('orders').update({ mp_preference_id: pref.id }).eq('id', order.id);

      return new Response(JSON.stringify({
        order: fullOrder,
        payment: { type: 'CARD', initPoint: pref.init_point, sandboxInitPoint: pref.sandbox_init_point },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (mpErr: any) {
    // Cancel the order since payment creation failed
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);

    const cause = mpErr?.cause ?? mpErr;
    const detail = cause?.message ?? String(mpErr);
    return new Response(JSON.stringify({
      error: `Erro ao processar pagamento: ${detail}`,
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
