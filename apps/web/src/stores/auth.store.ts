import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
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
    // Try to refresh on app load (uses HttpOnly cookie)
    try {
      const res = await api.post('/auth/refresh');
      setAccessToken(res.data.accessToken);
      await fetchMe();
    } catch {
      // No valid session — that's ok
    }
  }

  async function fetchMe() {
    const res = await api.get('/users/me');
    user.value = res.data;
  }

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const res = await api.post('/auth/login', { email, password });
      setAccessToken(res.data.accessToken);
      await fetchMe();
    } finally {
      loading.value = false;
    }
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    loading.value = true;
    try {
      const res = await api.post('/auth/register', { name, email, password, phone });
      setAccessToken(res.data.accessToken);
      await fetchMe();
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {}
    setAccessToken(null);
    user.value = null;
  }

  function clearUser() {
    user.value = null;
    setAccessToken(null);
  }

  return { user, loading, isLoggedIn, isAdmin, init, fetchMe, login, register, logout, clearUser };
});
