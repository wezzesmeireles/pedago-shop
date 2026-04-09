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
  if (userId) {
    const { data: profile } = await supabase.from('profiles').select('id, name, phone').eq('id', userId).single();
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(product_name, quantity, unit_price)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return new Response(JSON.stringify({ user: { ...profile, email: authUser?.email ?? '' }, orders: orders ?? [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // List ALL users from auth.users (source of truth), then enrich with profile data
  const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers({ page, perPage: limit });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  // Filter by search (email or name)
  const filtered = search
    ? authUsers.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()))
    : authUsers;

  // Fetch profiles for these users in one query
  const ids = filtered.map((u) => u.id);
  const { data: profiles } = ids.length > 0
    ? await supabase.from('profiles').select('id, name, phone, avatar_url, role, is_active, created_at').in('id', ids)
    : { data: [] };

  const profileMap: Record<string, any> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p;

  // Fetch order counts for these users
  const { data: orderCounts } = ids.length > 0
    ? await supabase.from('orders').select('user_id').in('user_id', ids).eq('status', 'PAID')
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const o of orderCounts ?? []) {
    countMap[o.user_id] = (countMap[o.user_id] ?? 0) + 1;
  }

  const items = filtered.map((authUser) => {
    const profile = profileMap[authUser.id] ?? {};
    return {
      id: authUser.id,
      email: authUser.email ?? '',
      name: profile.name ?? authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? '',
      avatar_url: profile.avatar_url ?? authUser.user_metadata?.avatar_url ?? '',
      role: profile.role ?? 'CUSTOMER',
      is_active: profile.is_active ?? true,
      created_at: authUser.created_at,
      ordersCount: countMap[authUser.id] ?? 0,
    };
  });

  // Get total count for pagination
  const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const total = search
    ? allUsers.filter((u) => u.email?.toLowerCase().includes(search.toLowerCase())).length
    : allUsers.length;

  return new Response(JSON.stringify({ items, total, page, limit }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
