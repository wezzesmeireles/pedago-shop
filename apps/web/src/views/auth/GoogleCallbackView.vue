<template>
  <div class="text-center py-8">
    <div class="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p class="text-gray-500 text-sm">Autenticando com Google...</p>
    <p v-if="errorMsg" class="text-red-500 text-xs mt-2">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth = useAuthStore();
const errorMsg = ref('');

let unsub: (() => void) | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

function clearAll() {
  unsub?.();
  unsub = null;
  if (timer) { clearTimeout(timer); timer = null; }
}

onMounted(async () => {
  let done = false;

  function go() {
    if (done) return;
    done = true;
    clearAll();
    router.push(auth.user?.phone ? '/' : { name: 'phone-required' });
  }

  // 1. auth.init() in router.beforeEach may have already set auth.user
  if (auth.user) { go(); return; }

  // 2. Ask Supabase for the session directly — handles both implicit hash
  //    and PKCE code-exchange transparently.
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    if (!auth.user) await auth.fetchMe().catch(() => {});
    go();
    return;
  }

  // 3. Wait for any auth event that carries a session (covers INITIAL_SESSION,
  //    SIGNED_IN, and TOKEN_REFRESHED — Supabase replays current state to new listeners).
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (done || !session) return;
    if (!auth.user) await auth.fetchMe().catch((e) => console.error('[google-callback] fetchMe:', e.message));
    go();
  });
  unsub = () => data.subscription.unsubscribe();

  // 4. Timeout fallback
  timer = setTimeout(() => {
    if (!done) {
      done = true;
      clearAll();
      errorMsg.value = 'Tempo esgotado. Tente novamente.';
      setTimeout(() => router.push('/auth/login'), 2000);
    }
  }, 10000);
});

onUnmounted(clearAll);
</script>
