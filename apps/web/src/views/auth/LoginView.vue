<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h2>
    <p class="text-gray-500 text-sm mb-6">Entre na sua conta para acessar seus downloads</p>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <AppInput v-model="form.email" label="Email" type="email" placeholder="seu@email.com" required :error="errors.email" />
      <AppInput v-model="form.password" label="Senha" type="password" placeholder="••••••••" required :error="errors.password" />

      <!-- Captcha -->
      <div
        @click="confirmHuman"
        :class="['flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer select-none transition-all', humanConfirmed ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300']"
      >
        <div :class="['w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all', humanConfirmed ? 'bg-green-500' : 'border-2 border-gray-300 bg-white']">
          <svg v-if="humanConfirmed" class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <span class="text-sm font-medium text-gray-700">Não sou um robô</span>
        <div class="ml-auto flex flex-col items-center opacity-60">
          <svg class="w-8 h-8" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="8" width="48" height="48" rx="8" fill="#4285f4"/>
            <path d="M32 16 L16 28 L20 28 L20 48 L28 48 L28 36 L36 36 L36 48 L44 48 L44 28 L48 28 Z" fill="white"/>
          </svg>
          <span class="text-[9px] text-gray-400 leading-tight text-center">reCAPTCHA<br/>Privacidade · Termos</span>
        </div>
      </div>

      <p v-if="errors.captcha" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{{ errors.captcha }}</p>
      <p v-if="errors.general" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{{ errors.general }}</p>

      <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
        Entrar
      </AppButton>
    </form>

    <div class="relative my-5">
      <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
      <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-400">ou continue com</span></div>
    </div>

    <button type="button" @click="loginGoogle" class="flex items-center justify-center gap-3 w-full border-2 border-gray-200 rounded-2xl py-3 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Continuar com Google
    </button>

    <p class="text-center text-sm text-gray-500 mt-6">
      Não tem conta?
      <RouterLink to="/auth/register" class="text-primary-600 font-medium hover:underline">Cadastre-se</RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { supabase } from '@/lib/supabase';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const humanConfirmed = ref(false);
const form = reactive({ email: '', password: '' });
const errors = reactive({ email: '', password: '', captcha: '', general: '' });

async function loginGoogle() {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } });
}

function confirmHuman() {
  humanConfirmed.value = true;
  errors.captcha = '';
}

async function handleLogin() {
  errors.email = '';
  errors.password = '';
  errors.captcha = '';
  errors.general = '';

  if (!humanConfirmed.value) {
    errors.captcha = 'Confirme que você não é um robô.';
    return;
  }

  loading.value = true;
  try {
    await auth.login(form.email, form.password);
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  } catch (err: any) {
    const msg = err?.message || err?.response?.data?.message || 'Erro ao fazer login.';
    errors.general = Array.isArray(msg) ? msg.join(', ') : msg;
    humanConfirmed.value = false;
  } finally {
    loading.value = false;
  }
}
</script>
