import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function requireAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'ADMIN' ? user : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const admin = await requireAdmin(req);
  if (!admin) return new Response(JSON.stringify({ message: 'Acesso negado.' }), { status: 403, headers: corsHeaders });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = parseInt(url.searchParams.get('limit') ?? '20');
  const search = url.searchParams.get('search') ?? '';
  const userId = url.searchParams.get('userId');

  // Get orders for a specific user
  if (userId && req.method === 'GET') {
    const { data: profile } = await supabase.from('profiles').select('id, name, phone').eq('id', userId).single();
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const { data: orders } = await supabase.from('orders').select('*, order_items(product_name, quantity, unit_price)').eq('user_id', userId).order('created_at', { ascending: false });
    return new Response(JSON.stringify({ user: { ...profile, email: authUser?.email ?? '' }, orders: orders ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // List users with emails
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let q = supabase.from('profiles').select('id, name, phone, avatar_url, role, is_active, created_at, orders(count)', { count: 'exact' }).is('deleted_at', null).order('created_at', { ascending: false }).range(from, to);
  if (search) q = q.or(`name.ilike.%${search}%`);

  const { data, count } = await q;

  const items = await Promise.all((data ?? []).map(async (profile: any) => {
    const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
    return { ...profile, email: user?.email ?? '' };
  }));

  return new Response(JSON.stringify({ items, total: count ?? 0, page, limit }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
