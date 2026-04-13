<template>
  <div>
    <div v-if="!sent">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Esqueci minha senha</h2>
          <p class="text-gray-500 text-sm">Enviaremos um link para redefinir sua senha</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email da sua conta</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="seu@email.com"
            :class="['w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all',
              error ? 'border-red-400 bg-red-50' : 'border-slate-200']"
          />
          <p v-if="error" class="mt-1.5 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{{ error }}</p>
        </div>

        <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
          Enviar link de redefinição
        </AppButton>
      </form>
    </div>

    <!-- Sent state -->
    <div v-else class="text-center py-4">
      <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Link enviado!</h3>
      <p class="text-gray-500 text-sm mb-1">Enviamos um link para:</p>
      <p class="font-semibold text-gray-800 mb-4">{{ email }}</p>
      <p class="text-xs text-gray-400 mb-6">Verifique sua caixa de entrada e pasta de spam. O link expira em 1 hora.</p>
      <button @click="sent = false; email = ''"
        class="text-sm text-primary-600 hover:underline font-medium">
        Tentar com outro email
      </button>
    </div>

    <p class="text-center text-sm text-gray-500 mt-6">
      Lembrou a senha?
      <RouterLink to="/auth/login" class="text-primary-600 font-medium hover:underline">Voltar ao login</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';
import AppButton from '@/components/ui/AppButton.vue';

const email = ref('');
const loading = ref(false);
const error = ref('');
const sent = ref(false);

async function handleSubmit() {
  error.value = '';
  loading.value = true;
  try {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.value.trim(), {
      redirectTo: window.location.origin + '/auth/reset-senha',
    });
    if (err) throw err;
    sent.value = true;
  } catch (err: any) {
    const raw = (err?.message || '').toLowerCase();
    if (raw.includes('rate limit') || raw.includes('too many'))
      error.value = 'Muitas tentativas. Aguarde alguns minutos.';
    else if (raw.includes('user not found') || raw.includes('no user'))
      error.value = 'Nenhuma conta encontrada com este email.';
    else
      error.value = 'Erro ao enviar o link. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>
