import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return new Response(JSON.stringify({ message: 'Dados obrigatórios.' }), { status: 400, headers: corsHeaders });
  }

  const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
  if ((count ?? 0) > 0) {
    return new Response(JSON.stringify({ message: 'Já existe um administrador.' }), { status: 403, headers: corsHeaders });
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name },
  });

  if (error) return new Response(JSON.stringify({ message: error.message }), { status: 400, headers: corsHeaders });

  await supabase.from('profiles').update({ name, role: 'ADMIN' }).eq('id', data.user!.id);

  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError || !session.session) {
    return new Response(JSON.stringify({ message: 'Admin criado. Faça login.' }), { status: 201, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ accessToken: session.session.access_token }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
