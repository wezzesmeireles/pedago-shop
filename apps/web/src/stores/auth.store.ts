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
      
      // Check if user has phone
      if (data.session?.user.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('id', data.session.user.id)
          .single();
        
        if (!profile?.phone) {
          return { needsPhone: true };
        }
      }
    } finally {
      loading.value = false;
    }
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    loading.value = true;
    try {
      // Use edge function with service role — bypasses captcha/rate limits on signUp
      const { data: fnData, error: fnError } = await supabase.functions.invoke('register-user', {
        body: { name, email, password, phone },
      });

      if (fnError) {
        let errMsg = '';
        let errStatus = 0;
        try {
          const ctx = (fnError as any).context;
          errStatus = ctx?.status ?? 0;
          const body = await ctx?.json();
          errMsg = (body?.message ?? '').toLowerCase();
        } catch { /**/ }
        if (!errMsg) errMsg = (fnError.message ?? '').toLowerCase();
        console.error('[register-user fn error]', errStatus, errMsg);

        // 409 = already exists
        if (errStatus === 409 || errMsg.includes('already') || errMsg.includes('registered')) {
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
