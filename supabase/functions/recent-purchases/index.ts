import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function maskName(name: string): string {
  if (!name) return 'Cliente';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function productIcon(name: string): string {
  const n = (name ?? '').toLowerCase();
  if (/matem|número|conta|álgebra/.test(n)) return '🔢';
  if (/arte|desenho|cor|pintura/.test(n)) return '🎨';
  if (/música|musicaliz|ritmo/.test(n)) return '🎵';
  if (/ciência|nature|animal|planta/.test(n)) return '🦋';
  if (/letra|caligrafia|escrita/.test(n)) return '✏️';
  if (/leitura|interpret|texto/.test(n)) return '📖';
  if (/projeto|meio ambiente|sustent/.test(n)) return '🌍';
  if (/inglês|english|idioma/.test(n)) return '🇬🇧';
  return '📚';
}

const iconColors = ['#f3e8ff', '#fce7f3', '#d1fae5', '#dbeafe', '#fef3c7', '#ede9fe'];

const samplePurchases = [
  { icon: '📚', name: 'Kit Alfabetização Completo', buyer: 'Maria S.', price: 'R$ 29,90', color: '#f3e8ff' },
  { icon: '🎨', name: 'Atividades de Artes Vol. 2', buyer: 'Juliana P.', price: 'R$ 14,90', color: '#fce7f3' },
  { icon: '🔢', name: 'Matemática Divertida', buyer: 'Fernanda G.', price: 'R$ 19,90', color: '#d1fae5' },
  { icon: '🌍', name: 'Projeto Meio Ambiente', buyer: 'Carla M.', price: 'R$ 24,90', color: '#dbeafe' },
  { icon: '✏️', name: 'Caderno de Caligrafia', buyer: 'Andressa L.', price: 'R$ 9,90', color: '#fef3c7' },
  { icon: '📖', name: 'Leitura e Interpretação', buyer: 'Patricia S.', price: 'R$ 17,90', color: '#ede9fe' },
  { icon: '🎵', name: 'Musicalização Infantil', buyer: 'Renata B.', price: 'R$ 12,90', color: '#fce7f3' },
  { icon: '🦋', name: 'Ciências da Natureza', buyer: 'Daniela C.', price: 'R$ 16,90', color: '#d1fae5' },
].map((s) => ({ ...s, paidAt: new Date().toISOString(), sample: true }));

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, customer_name, paid_at, created_at, total_amount')
    .eq('status', 'PAID')
    .gte('paid_at', cutoff)
    .order('paid_at', { ascending: false })
    .limit(20);

  const orderIds = (orders ?? []).map((o: any) => o.id);
  const { data: items } = orderIds.length
    ? await supabase.from('order_items').select('order_id, product_name').in('order_id', orderIds)
    : { data: [] };

  const itemsByOrder = new Map<string, string>();
  for (const item of items ?? []) {
    if (!itemsByOrder.has(item.order_id) && item.product_name) {
      itemsByOrder.set(item.order_id, item.product_name);
    }
  }

  const INTERNAL = /^(admin|site|test|supabase)/i;

  const realPurchases = (orders ?? [])
    .filter((o: any) => itemsByOrder.has(o.id) && !INTERNAL.test(o.customer_name ?? ''))
    .map((order: any, idx: number) => {
      const productName = itemsByOrder.get(order.id)!;
      return {
        icon: productIcon(productName),
        name: productName,
        buyer: maskName(order.customer_name),
        paidAt: order.paid_at ?? order.created_at,
        price: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount),
        color: iconColors[idx % iconColors.length],
        sample: false,
      };
    });

  // Use real data if available, otherwise fall back to sample
  const purchases = realPurchases.length >= 3 ? realPurchases : samplePurchases;

  return new Response(JSON.stringify(purchases), {
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
});
