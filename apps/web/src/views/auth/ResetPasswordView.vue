<template>
  <div>
    <!-- Invalid/expired token -->
    <div v-if="tokenError" class="text-center py-4">
      <div class="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Link inválido ou expirado</h3>
      <p class="text-gray-500 text-sm mb-6">Este link de redefinição já foi usado ou expirou.<br>Solicite um novo link.</p>
      <RouterLink to="/auth/esqueci-senha"
        class="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all">
        Solicitar novo link
      </RouterLink>
    </div>

    <!-- Reset form -->
    <div v-else-if="!done">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
          <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Nova senha</h2>
          <p class="text-gray-500 text-sm">Escolha uma senha segura para sua conta</p>
        </div>
      </div>

      <form @submit.prevent="handleReset" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nova Senha</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="8"
              placeholder="Mínimo 8 caracteres"
              :class="['w-full rounded-xl border px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all',
                errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200']"
            />
            <button type="button" @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>

          <!-- Strength indicator -->
          <div class="flex gap-1 mt-2">
            <div v-for="i in 4" :key="i" :class="['h-1 flex-1 rounded-full transition-colors', i <= strength ? strengthColor : 'bg-slate-200']"></div>
          </div>
          <p class="text-xs mt-1" :class="strength > 0 ? strengthTextColor : 'text-slate-400'">
            {{ strength === 0 ? 'Digite sua senha' : strength === 1 ? 'Fraca' : strength === 2 ? 'Razoável' : strength === 3 ? 'Boa' : 'Forte' }}
          </p>
          <p v-if="errors.password" class="mt-1 text-xs text-red-600">{{ errors.password }}</p>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Confirmar Nova Senha</label>
          <input
            v-model="confirm"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Repita a senha"
            :class="['w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all',
              errors.confirm ? 'border-red-400 bg-red-50' : 'border-slate-200']"
          />
          <p v-if="errors.confirm" class="mt-1 text-xs text-red-600">{{ errors.confirm }}</p>
        </div>

        <p v-if="errors.general" class="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{{ errors.general }}</p>

        <AppButton type="submit" variant="primary" size="lg" :loading="loading" class="w-full">
          Redefinir Senha
        </AppButton>
      </form>
    </div>

    <!-- Success state -->
    <div v-else class="text-center py-4">
      <div class="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <h3 class="text-xl font-bold text-gray-900 mb-2">Senha redefinida!</h3>
      <p class="text-gray-500 text-sm mb-6">Sua senha foi atualizada com sucesso. Você já pode fazer login.</p>
      <RouterLink to="/auth/login"
        class="inline-flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all">
        Ir para o login
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import AppButton from '@/components/ui/AppButton.vue';

const router = useRouter();
const password = ref('');
const confirm = ref('');
const showPassword = ref(false);
const loading = ref(false);
const done = ref(false);
const tokenError = ref(false);
const errors = ref({ password: '', confirm: '', general: '' });

const strength = computed(() => {
  const p = password.value;
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
});

const strengthColor = computed(() => {
  if (strength.value === 1) return 'bg-red-400';
  if (strength.value === 2) return 'bg-amber-400';
  if (strength.value === 3) return 'bg-blue-400';
  return 'bg-emerald-500';
});

const strengthTextColor = computed(() => {
  if (strength.value === 1) return 'text-red-500';
  if (strength.value === 2) return 'text-amber-500';
  if (strength.value === 3) return 'text-blue-500';
  return 'text-emerald-600';
});

onMounted(async () => {
  // Supabase puts recovery tokens in the URL hash — exchange them for a session
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    tokenError.value = true;
  }
});

async function handleReset() {
  errors.value = { password: '', confirm: '', general: '' };

  if (password.value.length < 8) {
    errors.value.password = 'A senha deve ter pelo menos 8 caracteres.';
    return;
  }
  if (password.value !== confirm.value) {
    errors.value.confirm = 'As senhas não coincidem.';
    return;
  }

  loading.value = true;
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value });
    if (error) throw error;
    done.value = true;
  } catch (err: any) {
    const raw = (err?.message || '').toLowerCase();
    if (raw.includes('same password') || raw.includes('different from'))
      errors.value.general = 'A nova senha deve ser diferente da senha atual.';
    else if (raw.includes('weak') || raw.includes('too short'))
      errors.value.general = 'Senha muito fraca. Use pelo menos 8 caracteres com letras e números.';
    else
      errors.value.general = 'Erro ao redefinir a senha. Solicite um novo link.';
  } finally {
    loading.value = false;
  }
}
</script>
