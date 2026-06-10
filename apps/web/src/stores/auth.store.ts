import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { Query, OAuthProvider } from 'appwrite';
import { account, databases, functions, DB_ID, COLLECTIONS, appwriteEndpoint } from '@/lib/appwrite';

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

      let result = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
        Query.equal('userId', authUser.$id),
        Query.limit(1),
      ]);

      // Fallback: busca por email (usuários Google têm novo ID após reinstalação)
      if (!result.documents.length && authUser.email) {
        result = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
          Query.equal('email', authUser.email),
          Query.limit(1),
        ]);
        // Sincroniza o userId no profile para futuras consultas
        if (result.documents.length) {
          const doc = result.documents[0];
          await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, doc.$id, {
            userId: authUser.$id,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      let profile = result.documents[0] as Record<string, any> | undefined;

      // Self-heal: some users have an auth account but no profile — notably
      // Google sign-ups, where OAuth only creates the auth user. Without a
      // profile they don't show up in the admin (which lists from `profiles`)
      // and their name/phone have nowhere to live. Create the missing profile
      // so every logged-in user is represented. Idempotent: the fixed document
      // id ($id === userId) means a concurrent create just 409s.
      if (!profile) {
        try {
          profile = await databases.createDocument(DB_ID, COLLECTIONS.PROFILES, authUser.$id, {
            userId: authUser.$id,
            name: authUser.name ?? authUser.email ?? '',
            email: authUser.email ?? '',
            phone: (authUser as any).phone ?? '',
            role: 'CUSTOMER',
            isActive: true,
            createdAt: authUser.$createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }) as Record<string, any>;
        } catch {
          // Likely created by a concurrent tab/race — re-read so we still get it.
          try {
            const again = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
              Query.equal('userId', authUser.$id), Query.limit(1),
            ]);
            profile = again.documents[0] as Record<string, any> | undefined;
          } catch { /* ignore */ }
        }
      }

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
      // Clear any stale/leftover session first — otherwise Appwrite rejects the
      // new login with "session already exists" (the 403 some users were hitting).
      try { await account.deleteSession('current'); } catch { /* no active session — fine */ }
      await account.createEmailPasswordSession(email, password);
      await fetchMe();

      if (!user.value?.phone) {
        return { needsPhone: true };
      }
      return { needsPhone: false };
    } finally {
      loading.value = false;
    }
  }

  async function loginWithGoogle() {
    // No app (Capacitor) o Google bloqueia OAuth em WebView e o origin é
    // https://localhost (inacessível). Abrimos o Google no Chrome (Custom Tabs)
    // e voltamos por deep link através da página-ponte no domínio real.
    if (import.meta.env.VITE_TARGET === 'mobile') {
      return loginWithGoogleNative();
    }
    const successUrl = `${window.location.origin}/auth/google-callback`;
    const failUrl = `${window.location.origin}/login`;
    // createOAuth2Token passes userId+secret in URL — works cross-domain
    return account.createOAuth2Token(OAuthProvider.Google, successUrl, failUrl);
  }

  // Fluxo OAuth nativo: Custom Tab -> Google -> Appwrite -> app-oauth.html
  // (host permitido) -> deep link com.sitepedagogico.app://oauth?userId&secret
  // -> cria a sessão. Resolve quando a sessão é criada; rejeita em erro/cancel.
  async function loginWithGoogleNative(): Promise<void> {
    const { Browser } = await import('@capacitor/browser');
    const { App } = await import('@capacitor/app');
    const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;
    const bridge = 'https://sitepedagogico.com.br/app-oauth.html';
    const url =
      `${appwriteEndpoint}/account/tokens/oauth2/google?project=${encodeURIComponent(projectId)}` +
      `&success=${encodeURIComponent(bridge)}&failure=${encodeURIComponent(bridge + '?error=1')}`;

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let handle: { remove: () => void } | undefined;
      App.addListener('appUrlOpen', async ({ url: cbUrl }) => {
        // Aceita o App Link verificado (https .../app-oauth) E o esquema custom
        // de fallback (com.sitepedagogico.app://oauth).
        const isCallback =
          !!cbUrl &&
          (cbUrl.startsWith('com.sitepedagogico.app://oauth') ||
            cbUrl.includes('sitepedagogico.com.br/app-oauth'));
        if (!isCallback) return;
        settled = true;
        try {
          await Browser.close().catch(() => {});
          const query = cbUrl.includes('?') ? cbUrl.slice(cbUrl.indexOf('?') + 1) : '';
          const params = new URLSearchParams(query);
          if (params.get('error')) throw new Error('Login com Google cancelado.');
          const userId = params.get('userId');
          const secret = params.get('secret');
          if (!userId || !secret) throw new Error('Falha no login com Google.');
          await account.createSession(userId, secret);
          await fetchMe();
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          handle?.remove();
        }
      }).then((h) => {
        handle = h;
        // Se o usuário fechar o Chrome sem concluir, libera o listener. Esperamos
        // um instante porque o deep link de sucesso também FECHA o Custom Tab —
        // sem o atraso, o 'browserFinished' cancelaria antes do 'appUrlOpen'.
        Browser.addListener('browserFinished', () => {
          setTimeout(() => {
            if (!settled) {
              handle?.remove();
              reject(new Error('cancelled'));
            }
          }, 700);
        });
      });
      Browser.open({ url });
    });
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    loading.value = true;
    try {
      // Use Appwrite function with server role — bypasses rate limits
      let fnExecution: Record<string, any> | null = null;
      let fnError: Error | null = null;
      try {
        fnExecution = await functions.createExecution(
          'register-user',
          JSON.stringify({ name, email, password, phone }),
          false,
          '/',
          'POST' as any,
          { 'Content-Type': 'application/json' },
        );
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
