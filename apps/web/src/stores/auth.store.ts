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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        // Rate limit hit — account may have been created; try signing in directly
        if (msg.includes('rate limit') || msg.includes('email rate')) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (!signInError) {
            if (phone) {
              const { data: me } = await supabase.auth.getUser();
              if (me.user) await supabase.from('profiles').update({ phone, name }).eq('id', me.user.id);
            }
            await fetchMe();
            return;
          }
          throw new Error('Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.');
        }
        if (msg.includes('already registered') || msg.includes('user already registered')) {
          throw new Error('Este email já está cadastrado. Tente fazer login.');
        }
        throw new Error(error.message);
      }

      // If session exists, email confirmation is disabled — login immediately
      if (data.session) {
        if (phone && data.user) {
          await supabase.from('profiles').update({ phone, name }).eq('id', data.user.id);
        }
        await fetchMe();
        return;
      }

      // Email confirmation is enabled — try to sign in anyway (self-hosted often allows it)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error('Cadastro realizado! Verifique seu email para confirmar a conta.');
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
