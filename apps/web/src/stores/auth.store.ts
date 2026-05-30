import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Query, OAuthProvider } from 'appwrite';
import { account, databases, functions, DB_ID, COLLECTIONS } from '@/lib/appwrite';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  avatarUrl?: string;
  phone?: string;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function init() {
    try {
      await account.getSession('current');
      await fetchMe();
    } catch {
      user.value = null;
    }
  }

  async function fetchMe() {
    try {
      const authUser = await account.get();
      if (!authUser) { user.value = null; return; }

      const result = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
        Query.equal('userId', authUser.$id),
        Query.limit(1),
      ]);
      const profile = result.documents[0] as Record<string, any> | undefined;

      const role = (profile?.role ?? 'CUSTOMER') as 'ADMIN' | 'CUSTOMER';

      user.value = {
        id: authUser.$id,
        name: profile?.name ?? authUser.name ?? authUser.email ?? '',
        email: authUser.email ?? '',
        role,
        avatarUrl: profile?.avatarUrl,
        phone: profile?.phone ?? undefined,
      };
    } catch (e) {
      user.value = null;
    }
  }

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      await account.createEmailPasswordSession(email, password);
      await fetchMe().catch(() => {});

      if (!user.value?.phone) {
        return { needsPhone: true };
      }
      return { needsPhone: false };
    } finally {
      loading.value = false;
    }
  }

  async function loginWithGoogle() {
    const successUrl = `${window.location.origin}/auth/google-callback`;
    const failUrl = `${window.location.origin}/login`;
    return account.createOAuth2Session(OAuthProvider.Google, successUrl, failUrl);
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    loading.value = true;
    try {
      // Use Appwrite function with server role — bypasses rate limits
      let fnExecution: Record<string, any> | null = null;
      let fnError: Error | null = null;
      try {
        fnExecution = await functions.createExecution({
          functionId: 'register-user',
          body: JSON.stringify({ name, email, password, phone }),
        });
      } catch (e: any) {
        fnError = e;
      }

      const fnResponseCode = fnExecution?.responseStatusCode ?? 0;
      const fnResponseBody = (() => {
        try { return JSON.parse(fnExecution?.responseBody ?? '{}'); } catch { return {}; }
      })();

      if (fnError || (fnResponseCode && fnResponseCode >= 400)) {
        const errMsg = (fnResponseBody?.message ?? fnError?.message ?? '').toLowerCase();
        const errStatus = fnResponseCode || 0;
        console.error('[register-user fn error]', errStatus, errMsg);

        // 409 = already exists
        if (errStatus === 409 || errMsg.includes('already') || errMsg.includes('registered')) {
          try {
            await account.createEmailPasswordSession(email, password);
            await fetchMe();
            return;
          } catch {
            throw new Error('Este email já está cadastrado. Tente fazer login.');
          }
        }
        throw new Error('Erro ao criar conta. Tente novamente.');
      }

      // Account created — sign in immediately
      try {
        await account.createEmailPasswordSession(email, password);
      } catch {
        throw new Error('Conta criada com sucesso! Faça login para continuar.');
      }
      await fetchMe();

      // Fallback: se a edge function não salvou o phone, salvar do client diretamente
      if (phone && user.value && !user.value.phone) {
        const profileResult = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
          Query.equal('userId', user.value.id),
          Query.limit(1),
        ]);
        const profileDoc = profileResult.documents[0];
        if (profileDoc) {
          await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, profileDoc.$id, {
            phone,
            updatedAt: new Date().toISOString(),
          });
        }
        await fetchMe();
      }
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await account.deleteSession('current');
    } finally {
      user.value = null;
      // isLoggedIn and isAdmin are computed from user.value — no separate reset needed
    }
  }

  function clearUser() {
    user.value = null;
  }

  return { user, loading, isLoggedIn, isAdmin, init, fetchMe, login, loginWithGoogle, register, logout, clearUser };
});
