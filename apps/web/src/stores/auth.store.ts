import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import api, { setAccessToken } from '@/services/api';

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
    if (session) {
      setAccessToken(session.access_token);
      await fetchMe();
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setAccessToken(session.access_token);
        if (!user.value) await fetchMe();
      } else {
        setAccessToken(null);
        user.value = null;
      }
    });
  }

  async function fetchMe() {
    try {
      const [profileRes, { data: { user: authUser } }] = await Promise.all([
        api.get('/users/me'),
        supabase.auth.getUser(),
      ]);
      user.value = {
        id: profileRes.data.id,
        name: profileRes.data.name,
        email: authUser?.email ?? '',
        role: profileRes.data.role,
        avatarUrl: profileRes.data.avatar_url,
      };
    } catch {
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw { response: { data: { message: error.message } } };
      setAccessToken(data.session!.access_token);
      await fetchMe();
    } finally {
      loading.value = false;
    }
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    loading.value = true;
    try {
      // Backend uses admin.createUser with email_confirm:true — no email confirmation needed
      const res = await api.post('/auth/register', { name, email, password, phone });
      setAccessToken(res.data.accessToken);
      // Sync Supabase session on the client
      await supabase.auth.signInWithPassword({ email, password });
      await fetchMe();
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    await api.post('/auth/logout').catch(() => {});
    setAccessToken(null);
    user.value = null;
  }

  function clearUser() {
    setAccessToken(null);
    user.value = null;
  }

  return { user, loading, isLoggedIn, isAdmin, init, fetchMe, login, register, logout, clearUser };
});
