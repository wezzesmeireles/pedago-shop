<template>
  <div class="min-h-screen bg-gray-950 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo / Header -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-900/50">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">Painel Administrativo</h1>
        <p class="text-gray-400 text-sm mt-1">Acesso restrito a administradores</p>
      </div>

      <!-- Card -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">

        <!-- Setup mode banner -->
        <div v-if="setupMode" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex gap-3">
          <svg class="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <p class="text-amber-400 text-sm font-medium">Configuração inicial</p>
            <p class="text-amber-300/70 text-xs mt-0.5">Nenhum admin encontrado. Crie o primeiro administrador.</p>
          </div>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-5">
          <div v-if="setupMode">
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Nome</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Seu nome"
              required
              class="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="admin@exemplo.com"
              required
              class="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
            <div class="relative">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                required
                class="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              <button @click="showPassword = !showPassword" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                <svg v-if="showPassword" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <p v-if="errorMsg" class="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
            {{ errorMsg }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            <svg v-if="loading" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ loading ? 'Aguarde...' : setupMode ? 'Criar Administrador' : 'Entrar no Painel' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-gray-800 text-center">
          <RouterLink to="/" class="text-xs text-gray-500 hover:text-gray-400 transition-colors">
            ← Voltar para a loja
          </RouterLink>
        </div>
      </div>

      <p class="text-center text-xs text-gray-600 mt-6">
        Acesso não autorizado será registrado
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/services/api';

const auth = useAuthStore();
const router = useRouter();

const loading = ref(false);
const setupMode = ref(false);
const showPassword = ref(false);
const errorMsg = ref('');
const form = reactive({ name: '', email: '', password: '' });

onMounted(async () => {
  if (auth.isAdmin) {
    router.replace('/admin/dashboard');
    return;
  }
  try {
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
    setupMode.value = (count ?? 0) === 0;
  } catch {
    setupMode.value = false;
  }
});

async function handleSubmit() {
  errorMsg.value = '';
  loading.value = true;
  try {
    if (setupMode.value) {
      await invokeFunction('create-admin', { name: form.name, email: form.email, password: form.password });
      await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
      await auth.fetchMe();
    } else {
      await auth.login(form.email, form.password);
      if (!auth.isAdmin) {
        await auth.logout();
        errorMsg.value = 'Acesso negado. Esta conta não tem permissão de administrador.';
        return;
      }
    }
    router.replace('/admin/dashboard');
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Erro ao fazer login.';
    errorMsg.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    loading.value = false;
  }
}
</script>
