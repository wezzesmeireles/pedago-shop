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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      console.error('[register-user] Missing env vars', { supabaseUrl: !!supabaseUrl, serviceKey: !!serviceKey });
      return json({ message: 'Configuração interna inválida.' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json().catch(() => null);
    if (!body) return json({ message: 'Corpo da requisição inválido.' }, 400);

    const { name, email, password, phone } = body;
    if (!name || !email || !password) {
      return json({ message: 'Nome, email e senha são obrigatórios.' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (error) {
      console.error('[register-user] createUser error:', error.message);
      const msg = error.message.toLowerCase();
      const alreadyExists = msg.includes('already') || msg.includes('registered') || msg.includes('exists');
      return json({ message: error.message }, alreadyExists ? 409 : 400);
    }

    if (phone && data.user) {
      await supabase.from('profiles').update({ name, phone, role: 'CUSTOMER', updated_at: new Date().toISOString() }).eq('id', data.user.id);
    } else if (data.user) {
      await supabase.from('profiles').update({ name, role: 'CUSTOMER', updated_at: new Date().toISOString() }).eq('id', data.user.id);
    }

    return json({ message: 'Usuário criado com sucesso.' }, 201);
  } catch (err) {
    console.error('[register-user] Unexpected error:', err);
    return json({ message: 'Erro interno. Tente novamente.' }, 500);
  }
});
