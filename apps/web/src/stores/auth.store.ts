import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) await fetchMe();

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        if (!user.value) await fetchMe();
      } else {
        user.value = null;
      }
    });
  }

  async function fetchMe() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { user.value = null; return; }

      // Role from app_metadata (set by admin SQL or edge functions)
      const metaRole = authUser.app_metadata?.role as string | undefined;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, role, avatar_url')
        .eq('id', authUser.id)
        .single();

      const role = (profile?.role ?? metaRole ?? 'CUSTOMER') as 'ADMIN' | 'CUSTOMER';

      user.value = {
        id: authUser.id,
        name: profile?.name ?? authUser.user_metadata?.name ?? authUser.email ?? '',
        email: authUser.email ?? '',
        role,
        avatarUrl: profile?.avatar_url,
      };
    } catch (e) {
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[login error]', error.code, error.message);
        throw error; // preserve AuthApiError with .code property
      }
      await fetchMe().catch(() => {});
    } finally {
      loading.value = false;
    }
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    loading.value = true;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      // Use the edge function with service role key — bypasses captcha/rate limits on signUp
      const res = await fetch(`${supabaseUrl}/functions/v1/register-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ name, email, password, phone }),
      });

      const json = await res.json().catch(() => ({}));
      const errMsg = (json?.message ?? '').toLowerCase();

      if (!res.ok) {
        // Account already exists → try to sign in
        if (res.status === 400 && (errMsg.includes('already') || errMsg.includes('existe') || errMsg.includes('registered'))) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (!signInErr) { await fetchMe(); return; }
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        }
        throw new Error('Erro ao criar conta. Tente novamente.');
      }

      // Account created — sign in immediately
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) throw new Error('Conta criada com sucesso! Faça login para continuar.');
      await fetchMe();
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    user.value = null;
  }

  function clearUser() {
    user.value = null;
  }

  return { user, loading, isLoggedIn, isAdmin, init, fetchMe, login, register, logout, clearUser };
});
