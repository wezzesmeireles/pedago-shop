<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-2">Criar sua conta</h2>
    <p class="text-gray-500 text-sm mb-6">Cadastre-se para comprar e acessar seus downloads</p>

    <form @submit.prevent="handleRegister" class="space-y-4">
      <AppInput v-model="form.name" label="Nome completo" type="text" placeholder="Seu nome" required />
      <AppInput v-model="form.email" label="Email" type="email" placeholder="seu@email.com" required />

      <!-- Phone / WhatsApp -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          WhatsApp <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <span class="absolute left-3 top-2.5 text-gray-400">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </span>
          <input
            v-model="form.phone"
            type="tel"
            required
            placeholder="(11) 99999-9999"
            :class="['w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-gray-400 transition-all',
              phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200']"
          />
        </div>
        <p v-if="phoneError" class="text-xs text-red-500 mt-1">{{ phoneError }}</p>
        <p v-else class="text-xs text-gray-400 mt-1">Usado para receber confirmações via WhatsApp</p>
      </div>

      <AppInput v-model="form.password" label="Senha" type="password" placeholder="Mínimo 8 caracteres" required hint="Use pelo menos 8 caracteres" />

      <p v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{{ error }}</p>

      <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
        Criar Conta
      </AppButton>
    </form>

    <div class="relative my-5">
      <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
      <div class="relative flex justify-center text-sm"><span class="px-2 bg-white text-gray-400">ou</span></div>
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
      Já tem conta?
      <RouterLink to="/auth/login" class="text-primary-600 font-medium hover:underline">Entrar</RouterLink>
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
const error = ref('');
const phoneError = ref('');
const form = reactive({ name: '', email: '', password: '', phone: '' });

async function loginGoogle() {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/google-callback' } });
}

async function handleRegister() {
  error.value = '';
  phoneError.value = '';

  const digits = form.phone.replace(/\D/g, '');
  if (!digits || digits.length < 10) {
    phoneError.value = 'Informe um número de WhatsApp válido com DDD.';
    return;
  }

  loading.value = true;
  try {
    await auth.register(form.name, form.email, form.password, digits);
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  } catch (err: any) {
    console.error('[register error]', err);
    const msg = err?.message || err?.response?.data?.message || 'Erro ao cadastrar.';
    error.value = Array.isArray(msg) ? msg.join(', ') : msg;
  } finally {
    loading.value = false;
  }
}
</script>
