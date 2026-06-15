<template>
  <Teleport to="body">
    <Transition name="backdrop">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        :aria-label="screen === 'select' ? 'Escolha como comprar' : 'Dados para compra rápida'"
      >
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="close" />

        <Transition name="sheet" mode="out-in">

          <!-- ── Tela 1: Seleção ── -->
          <div v-if="screen === 'select'" key="select" class="modal-card">

            <!-- Handle bar (mobile only) -->
            <div class="flex justify-center pt-3 pb-1 sm:hidden">
              <div class="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <!-- Fechar (desktop) -->
            <button
              @click="close"
              class="hidden sm:flex absolute top-4 right-4 w-9 h-9 items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all z-10"
              aria-label="Fechar"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <!-- Título -->
            <div class="px-5 pt-3 pb-4 text-center sm:px-6 sm:pt-6">
              <p class="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Finalizar compra</p>
              <h2 class="text-xl font-black text-gray-900">Como prefere comprar?</h2>
            </div>

            <div class="px-4 pb-6 space-y-3 sm:px-5 sm:pb-5">

              <!-- ── Compra Rápida ── -->
              <button
                @click="screen = 'form'"
                class="quick-buy-card group w-full text-left"
                aria-label="Compra Rápida: só nome e celular"
              >
                <div class="absolute inset-0 rounded-2xl ring-2 ring-violet-500" />
                <div class="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 opacity-0 group-active:opacity-100 transition-opacity duration-150" />

                <div class="relative flex items-center gap-3 p-4">
                  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-200">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="font-black text-gray-900 text-base leading-none">Compra Rápida</span>
                      <span class="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-bold whitespace-nowrap">⚡ Mais rápido</span>
                    </div>
                    <p class="text-sm text-gray-500">Só nome e celular — download imediato</p>

                    <!-- Micro-steps — visíveis mas não cortam em telas pequenas -->
                    <div class="flex items-center gap-1 mt-2 flex-wrap">
                      <span class="step-pill">📝 Nome</span>
                      <span class="text-gray-300 text-xs">›</span>
                      <span class="step-pill">📱 Celular</span>
                      <span class="text-gray-300 text-xs">›</span>
                      <span class="step-pill bg-violet-50 text-violet-700">⬇ Download</span>
                    </div>
                  </div>

                  <svg class="w-5 h-5 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>

              <!-- Trust pills — grid 3 colunas p/ não quebrar linha -->
              <div class="grid grid-cols-3 gap-1 text-center">
                <div class="trust-pill">🔒 Seguro</div>
                <div class="trust-pill">⚡ Imediato</div>
                <div class="trust-pill">✅ Sem cadastro</div>
              </div>

              <!-- Separador -->
              <div class="flex items-center gap-3">
                <div class="flex-1 h-px bg-gray-100" />
                <span class="text-xs text-gray-300 font-medium">ou</span>
                <div class="flex-1 h-px bg-gray-100" />
              </div>

              <!-- ── Já tenho conta ── -->
              <button
                @click="goLogin"
                class="w-full flex items-center gap-3 px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 active:bg-gray-100 transition-all"
                aria-label="Entrar na conta existente"
              >
                <div class="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
                <div class="text-left flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-700 leading-none mb-0.5">Já tenho conta</p>
                  <p class="text-xs text-gray-400">Entrar com e-mail e senha</p>
                </div>
                <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- Safe area bottom (iOS) -->
              <div class="h-safe-bottom sm:hidden" />

            </div>
          </div>

          <!-- ── Tela 2: Formulário ── -->
          <div v-else key="form" class="modal-card">

            <!-- Handle bar (mobile) -->
            <div class="flex justify-center pt-3 pb-1 sm:hidden">
              <div class="w-10 h-1 rounded-full bg-white/30" style="background: rgba(0,0,0,0.15)" />
            </div>

            <!-- Header gradiente -->
            <div class="relative overflow-hidden px-5 pt-4 pb-5 sm:px-6 sm:pt-5">
              <div class="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600" />
              <div class="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-14 translate-x-14" />

              <div class="relative">
                <button
                  @click="screen = 'select'"
                  class="inline-flex items-center gap-1.5 text-white/70 active:text-white text-sm font-medium mb-3 -ml-1 p-1 transition-colors"
                  aria-label="Voltar para escolha de compra"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Voltar
                </button>
                <h2 class="text-xl font-black text-white leading-tight">Só mais dois dados</h2>
                <p class="text-white/70 text-sm mt-0.5">Sem senha, sem formulário longo.</p>
              </div>

              <!-- Progress -->
              <div class="relative mt-4">
                <div class="flex items-center gap-2">
                  <div class="progress-step done">1</div>
                  <div class="flex-1 h-0.5 bg-white/40 rounded-full" />
                  <div class="progress-step active">2</div>
                  <div class="flex-1 h-0.5 bg-white/20 rounded-full" />
                  <div class="progress-step">3</div>
                </div>
                <div class="flex justify-between mt-1.5">
                  <span class="text-xs text-white/50">Carrinho</span>
                  <span class="text-xs text-white font-bold">Seus dados</span>
                  <span class="text-xs text-white/50">Pagar</span>
                </div>
              </div>
            </div>

            <!-- Form body -->
            <div class="p-5 space-y-4">

              <!-- Nome -->
              <div>
                <label for="guest-name" class="block text-sm font-semibold text-gray-700 mb-2">Seu nome</label>
                <input
                  id="guest-name"
                  v-model="guestName"
                  ref="nameInputRef"
                  type="text"
                  placeholder="Ex: Maria Silva"
                  autocomplete="name"
                  class="form-input"
                  :class="{ 'ring-2 ring-red-400 border-red-300 bg-red-50': nameError }"
                  @keydown.enter="focusPhone"
                />
                <p v-if="nameError" class="text-sm text-red-500 mt-1.5 font-medium" role="alert">{{ nameError }}</p>
              </div>

              <!-- Celular -->
              <div>
                <label for="guest-phone" class="block text-sm font-semibold text-gray-700 mb-2">
                  Celular com DDD
                </label>
                <input
                  id="guest-phone"
                  ref="phoneInputRef"
                  v-model="guestPhoneDisplay"
                  type="tel"
                  inputmode="numeric"
                  placeholder="(11) 99999-9999"
                  maxlength="15"
                  autocomplete="tel"
                  class="form-input"
                  :class="{ 'ring-2 ring-red-400 border-red-300 bg-red-50': phoneError }"
                  @input="maskPhone"
                  @keydown.enter="submitGuest"
                />
                <p v-if="phoneError" class="text-sm text-red-500 mt-1.5 font-medium" role="alert">{{ phoneError }}</p>
              </div>

              <!-- Hint vinculação — mais visível -->
              <div class="flex items-start gap-2.5 bg-violet-50 border border-violet-100 rounded-xl px-3.5 py-3">
                <span class="text-base flex-shrink-0" aria-hidden="true">💡</span>
                <p class="text-sm text-violet-700 leading-snug">
                  Se criar conta depois com este celular, seus downloads aparecem automaticamente.
                </p>
              </div>

              <!-- CTA -->
              <button
                @click="submitGuest"
                :disabled="loading || !guestName.trim() || !isPhoneValid"
                class="cta-btn w-full"
                :aria-busy="loading"
              >
                <span v-if="loading" class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Aguarde...
                </span>
                <span v-else class="flex items-center justify-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  Ir para pagamento
                </span>
              </button>

              <p class="text-center text-xs text-gray-400">Sem cadastro obrigatório • Pagamento seguro</p>

              <!-- Safe area bottom (iOS) -->
              <div class="h-safe-bottom sm:hidden" />

            </div>
          </div>

        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/stores/auth.store';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits(['update:modelValue', 'navigate']);

const router = useRouter();
const auth = useAuthStore();

const screen = ref<'select' | 'form'>('select');
const guestName = ref('');
const guestPhoneDisplay = ref('');
const nameError = ref('');
const phoneError = ref('');
const loading = ref(false);
const nameInputRef = ref<HTMLInputElement | null>(null);
const phoneInputRef = ref<HTMLInputElement | null>(null);

const isPhoneValid = computed(() => guestPhoneDisplay.value.replace(/\D/g, '').length >= 10);

// Reset form state when modal closes
watch(() => props.modelValue, (open) => {
  if (!open) {
    setTimeout(() => {
      screen.value = 'select';
      guestName.value = '';
      guestPhoneDisplay.value = '';
      nameError.value = '';
      phoneError.value = '';
    }, 300);
  }
});

// Auto-focus name input when entering form screen
watch(screen, async (val) => {
  if (val === 'form') {
    await nextTick();
    nameInputRef.value?.focus();
  }
});

function close() {
  emit('update:modelValue', false);
}

function focusPhone() {
  phoneInputRef.value?.focus();
}

function maskPhone(e: Event) {
  let v = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
  if (v.length >= 7) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  else if (v.length >= 3) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  else if (v.length) v = `(${v}`;
  guestPhoneDisplay.value = v;
  phoneError.value = '';
}

function goLogin() {
  emit('navigate');
  emit('update:modelValue', false);
  router.push({ name: 'login', query: { redirect: '/checkout' } });
}

async function submitGuest() {
  nameError.value = '';
  phoneError.value = '';

  if (!guestName.value.trim()) {
    nameError.value = 'Informe seu nome.';
    nameInputRef.value?.focus();
    return;
  }
  if (!isPhoneValid.value) {
    phoneError.value = 'Informe um celular válido com DDD.';
    phoneInputRef.value?.focus();
    return;
  }
  if (loading.value) return;

  const rawPhone = guestPhoneDisplay.value.replace(/\D/g, '');
  loading.value = true;
  try {
    // Reutiliza sessão existente se houver — createAnonymousSession lança se já há sessão ativa
    try { await account.getSession('current'); }
    catch { await account.createAnonymousSession(); }

    // Deve salvar ANTES do fetchMe — fetchMe usa pedago_guest para decidir se mantém a sessão
    localStorage.setItem('pedago_guest', JSON.stringify({
      name: guestName.value.trim(),
      phone: rawPhone,
    }));
    await auth.fetchMe();
    emit('navigate');
    emit('update:modelValue', false);
    router.push('/checkout');
  } catch {
    phoneError.value = 'Erro ao iniciar. Tente novamente.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* ── Card shell ── */
.modal-card {
  /* Mobile: bottom sheet com cantos só em cima */
  @apply relative bg-white w-full shadow-2xl overflow-hidden;
  border-radius: 24px 24px 0 0;
  /* Cap width on desktop, and center it with rounded corners all around */
  @apply sm:rounded-3xl sm:max-w-sm sm:mx-4;
}

/* ── Compra Rápida card ── */
.quick-buy-card {
  @apply relative rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50
         transition-all duration-150 active:scale-[0.99];
  /* Minimum tap target */
  min-height: 88px;
}

/* ── Step pills ── */
.step-pill {
  @apply text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap;
}

/* ── Trust pills grid ── */
.trust-pill {
  @apply text-xs font-medium text-gray-400 bg-gray-50 border border-gray-100
         rounded-xl py-2 px-1 text-center;
}

/* ── Progress steps ── */
.progress-step {
  @apply w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0
         bg-white/20 text-white/50;
}
.progress-step.done   { @apply bg-white text-violet-700; }
.progress-step.active { @apply bg-white text-violet-700 ring-2 ring-white/40; }

/* ── Form inputs — 16px font prevents iOS auto-zoom ── */
.form-input {
  @apply w-full border border-gray-200 rounded-xl px-4 py-4 text-gray-900
         placeholder:text-gray-400
         focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent
         transition-all duration-150;
  font-size: 16px; /* explicit: never let Tailwind shrink below 16px */
}

/* ── CTA ── */
.cta-btn {
  @apply py-4 rounded-2xl font-bold text-white
         transition-all duration-150
         disabled:opacity-50 disabled:cursor-not-allowed
         active:scale-[0.98];
  background: linear-gradient(135deg, #7c3aed, #db2777);
  min-height: 56px; /* comfortable mobile tap target */
  font-size: 16px;
}

/* ── iOS safe area ── */
.h-safe-bottom {
  height: env(safe-area-inset-bottom, 0px);
}

/* ── Backdrop ── */
.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.25s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

/* ── Bottom-sheet slide ── */
.sheet-enter-active { transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease; }
.sheet-leave-active { transition: transform 0.18s ease, opacity 0.15s ease; }
.sheet-enter-from   { transform: translateY(48px); opacity: 0; }
.sheet-leave-to     { transform: translateY(24px); opacity: 0; }

@media (min-width: 640px) {
  .sheet-enter-from { transform: scale(0.96) translateY(12px); }
  .sheet-leave-to   { transform: scale(0.98) translateY(8px); }
}
</style>
