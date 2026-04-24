<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <!-- Backdrop não clicável — obrigatório preencher -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <!-- Panel -->
        <div class="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8">
          <!-- Ícone -->
          <div class="flex justify-center mb-5">
            <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
              <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
          </div>

          <h2 class="text-xl font-black text-gray-900 text-center mb-1">Complete seu cadastro</h2>
          <p class="text-sm text-gray-500 text-center mb-6">
            Informe seu WhatsApp para continuar. É obrigatório para receber confirmações de compra.
          </p>

          <form @submit.prevent="save" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                WhatsApp <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-gray-400">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
                <input
                  v-model="phone"
                  type="tel"
                  required
                  placeholder="(11) 99999-9999"
                  :class="['w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent placeholder:text-gray-400 transition-all',
                    phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200']"
                />
              </div>
              <p v-if="phoneError" class="text-xs text-red-500 mt-1">{{ phoneError }}</p>
              <p v-else class="text-xs text-gray-400 mt-1">Usado para receber confirmações via WhatsApp</p>
            </div>

            <button
              type="submit"
              :disabled="saving"
              class="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all text-sm"
            >
              {{ saving ? 'Salvando...' : 'Salvar e continuar' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth.store';
import { supabase } from '@/lib/supabase';
import { useRoute } from 'vue-router';

const auth = useAuthStore();
const route = useRoute();

const AUTH_ROUTE_NAMES = ['login', 'register', 'google-callback', 'phone-required', 'forgot-password', 'reset-password', 'admin-login'];

const show = computed(() =>
  auth.isLoggedIn &&
  !auth.user?.phone &&
  !AUTH_ROUTE_NAMES.includes(route.name as string)
);

const phone = ref('');
const saving = ref(false);
const phoneError = ref('');

async function save() {
  phoneError.value = '';
  const digits = phone.value.replace(/\D/g, '');
  if (!digits || digits.length < 10) {
    phoneError.value = 'Informe um número de WhatsApp válido com DDD.';
    return;
  }
  saving.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ phone: digits, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      // Atualiza o store sem recarregar a página
      if (auth.user) auth.user.phone = digits;
    }
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.modal-enter-active { transition: all 0.25s ease-out; }
.modal-leave-active { transition: all 0.2s ease-in; }
.modal-enter-from { opacity: 0; }
.modal-leave-to   { opacity: 0; }
.modal-enter-from .relative { transform: translateY(20px) scale(0.97); }
.modal-leave-to   .relative { transform: translateY(10px) scale(0.98); }
</style>
