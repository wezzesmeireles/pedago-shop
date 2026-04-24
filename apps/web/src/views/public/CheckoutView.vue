<template>
  <div class="max-w-lg mx-auto px-4 py-10">

    <!-- Carrinho vazio -->
    <div v-if="cart.items.length === 0 && step === 'confirm'" class="text-center py-20">
      <div class="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-5 float">
        <svg class="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <h2 class="text-2xl font-black text-gray-900 mb-2">Carrinho vazio</h2>
      <p class="text-gray-500 mb-8">Adicione produtos antes de finalizar a compra.</p>
      <RouterLink to="/catalogo" class="btn-primary">Ver Produtos</RouterLink>
    </div>

    <div v-else>

      <!-- ── STEP: Confirmar pedido ── -->
      <div v-if="step === 'confirm'" class="animate-slide-in-up">

        <!-- Header da página -->
        <div class="mb-7">
          <h1 class="text-2xl font-black text-gray-900 mb-1">Finalizar Pedido</h1>
          <p class="text-sm text-gray-400">Revise os itens e escolha como pagar</p>
        </div>

        <!-- Itens do carrinho -->
        <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div class="px-5 py-4 border-b border-gray-50">
            <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider">Seus itens</h2>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="item in cart.items" :key="item.productId" class="flex items-center gap-4 px-5 py-4">
              <div class="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                <img v-if="item.coverImageUrl" :src="item.coverImageUrl" :alt="item.name" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">{{ item.name }}</p>
                <span class="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full font-medium">PDF • Download imediato</span>
              </div>
              <p class="font-black text-gray-900 text-sm flex-shrink-0">{{ fmt(item.price * item.quantity) }}</p>
            </div>
          </div>
          <!-- Total -->
          <div class="flex justify-between items-center px-5 py-4 bg-gray-50">
            <span class="text-sm font-medium text-gray-500">Total a pagar</span>
            <span class="text-2xl font-black text-primary-600">{{ fmt(cart.total) }}</span>
          </div>
        </div>

        <!-- Método de pagamento -->
        <div class="mb-5">
          <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Como pagar</h2>
          <div class="grid grid-cols-2 gap-3">
            <!-- PIX -->
            <button
              @click="selectedMethod = 'PIX'"
              :class="['relative p-4 rounded-2xl border-2 text-left transition-all',
                selectedMethod === 'PIX'
                  ? 'border-green-500 bg-green-50 shadow-md shadow-green-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white']"
            >
              <div v-if="selectedMethod === 'PIX'" class="absolute top-2.5 right-2.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </div>
              <PixLogo class="w-9 h-9 mb-1" />
              <span class="font-black text-gray-900 text-sm block">PIX</span>
              <p class="text-xs text-gray-500 mt-0.5">Aprovação imediata</p>
              <span class="absolute bottom-2 right-2 text-xs bg-green-100 text-green-700 font-semibold px-1.5 py-0.5 rounded-full">Recomendado</span>
            </button>
            <!-- Cartão -->
            <button
              @click="selectedMethod = 'CREDIT_CARD'"
              :class="['relative p-4 rounded-2xl border-2 text-left transition-all',
                selectedMethod === 'CREDIT_CARD'
                  ? 'border-primary-500 bg-primary-50 shadow-md shadow-primary-100'
                  : 'border-gray-200 hover:border-gray-300 bg-white']"
            >
              <div v-if="selectedMethod === 'CREDIT_CARD'" class="absolute top-2.5 right-2.5 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
              </div>
              <span class="text-2xl block mb-1">💳</span>
              <span class="font-black text-gray-900 text-sm block">Cartão</span>
              <p class="text-xs text-gray-500 mt-0.5">Crédito em até 12x</p>
            </button>
          </div>
        </div>

        <!-- Erro -->
        <div v-if="errorMessage" class="mb-4 flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-2xl">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMessage }}
        </div>

        <!-- Botão finalizar -->
        <button
          @click="createOrder"
          :disabled="creating"
          class="relative overflow-hidden w-full text-white font-black py-4 rounded-2xl transition-all duration-200 shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
          :style="selectedMethod === 'PIX' ? 'background: linear-gradient(135deg,#16a34a,#15803d)' : 'background: linear-gradient(135deg,#7c3aed,#db2777)'"
        >
          <svg v-if="creating" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <template v-if="creating">{{ selectedMethod === 'PIX' ? 'Gerando PIX...' : 'Processando...' }}</template>
          <template v-else-if="selectedMethod === 'PIX'">
            <PixLogo class="w-5 h-5" color="white" />
            Gerar PIX — {{ fmt(cart.total) }}
          </template>
          <template v-else>💳 Pagar com Cartão — {{ fmt(cart.total) }}</template>
        </button>

        <!-- Selos de segurança -->
        <div class="flex items-center justify-center gap-5 mt-5">
          <span class="flex items-center gap-1.5 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Pagamento seguro
          </span>
          <span class="flex items-center gap-1.5 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Download imediato
          </span>
        </div>
      </div>

      <!-- ── STEP: Cartão ── -->
      <div v-if="step === 'card'" class="text-center py-8 animate-slide-in-up">
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mx-auto mb-5">
          <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h2 class="text-xl font-black text-gray-900 mb-2">Complete o pagamento</h2>
        <p class="text-gray-500 text-sm mb-6">Uma nova aba foi aberta com o Mercado Pago. Após pagar, clique em "Já paguei".</p>
        <a :href="cardInitPoint" target="_blank" class="btn-primary w-full block text-center py-4 mb-3">
          Abrir Mercado Pago →
        </a>
        <button
          @click="checkCardPayment"
          :disabled="checkingCard"
          class="w-full border-2 border-primary-600 text-primary-600 font-bold py-4 rounded-2xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <svg v-if="checkingCard" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ checkingCard ? 'Verificando...' : 'Já paguei — Verificar' }}
        </button>
        <p v-if="cardCheckMsg" class="mt-3 text-sm font-medium" :class="cardCheckMsg.ok ? 'text-green-600' : 'text-red-500'">
          {{ cardCheckMsg.text }}
        </p>
      </div>

      <!-- ── STEP: PIX ── -->
      <div v-if="step === 'pix'" class="animate-slide-in-up">

        <!-- Status badge -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <div class="relative">
            <div class="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute"></div>
            <div class="w-3 h-3 bg-blue-500 rounded-full relative"></div>
          </div>
          <span class="text-sm font-bold text-blue-700">Aguardando pagamento PIX...</span>
        </div>

        <!-- Timer -->
        <div class="text-center mb-6">
          <p class="text-xs text-gray-400 mb-1 uppercase tracking-wider font-medium">Expira em</p>
          <span
            class="text-5xl font-mono font-black tabular-nums"
            :class="timeLeft < 300 ? 'text-red-500' : 'text-gradient'"
          >
            {{ formatTime(timeLeft) }}
          </span>
        </div>

        <!-- QR Code estilizado com logo PIX no centro -->
        <div class="flex justify-center mb-6">
          <div class="relative">
            <!-- Moldura gradiente animada -->
            <div class="p-[3px] rounded-3xl qr-gradient-border">
              <div class="bg-white rounded-[22px] p-5 relative">

                <!-- QR image -->
                <img
                  v-if="pixQrBase64"
                  :src="`data:image/png;base64,${pixQrBase64}`"
                  alt="QR Code PIX"
                  class="w-52 h-52 block"
                />
                <div v-else class="w-52 h-52 flex items-center justify-center">
                  <div class="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
                </div>

                <!-- Logo PIX centralizado no QR -->
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div class="bg-white rounded-xl p-2 shadow-md border border-gray-100">
                    <PixLogo class="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Badge PIX embaixo -->
            <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border border-gray-100 shadow-md rounded-full px-3 py-1.5 whitespace-nowrap">
              <PixLogo class="w-3.5 h-3.5" />
              <span class="text-xs font-black text-gray-700">Pague com PIX</span>
            </div>
          </div>
        </div>

        <!-- Valor -->
        <div class="text-center mb-6 mt-6">
          <p class="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Valor</p>
          <p class="text-4xl font-black text-gray-900">{{ fmt(cart.total) }}</p>
        </div>

        <!-- Copia e cola -->
        <div v-if="pixQrCode" class="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">PIX Copia e Cola</p>
          <div class="flex gap-2">
            <input
              :value="pixQrCode"
              readonly
              class="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 truncate min-w-0"
            />
            <button
              @click="copyText(pixQrCode)"
              :class="['flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap',
                copied ? 'bg-green-500 text-white' : 'text-white']"
              :style="!copied ? 'background: linear-gradient(135deg,#7c3aed,#db2777)' : ''"
            >
              {{ copied ? '✓ Copiado!' : 'Copiar' }}
            </button>
          </div>
        </div>

        <!-- Chave PIX manual (fallback) -->
        <div v-if="!pixQrCode && manualPixKey" class="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
          <p class="text-sm font-bold text-green-800 mb-3">Chave PIX para pagamento:</p>
          <div class="flex gap-2 mb-3">
            <span class="flex-1 bg-white border border-green-200 rounded-xl px-3 py-2.5 text-sm font-mono text-green-900 break-all select-all">{{ manualPixKey }}</span>
            <button
              @click="copyText(manualPixKey)"
              :class="['flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                copied ? 'bg-green-500 text-white' : 'bg-green-700 text-white hover:bg-green-800']"
            >
              {{ copied ? '✓ Copiado' : 'Copiar' }}
            </button>
          </div>
        </div>

        <!-- Como pagar -->
        <div class="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-sm">
          <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Como pagar</p>
          <div class="space-y-3">
            <div v-for="(s, i) in howToPay" :key="i" class="flex items-center gap-3 text-sm text-gray-700">
              <div
                class="w-7 h-7 rounded-full text-xs font-black flex items-center justify-center flex-shrink-0"
                :style="i === howToPay.length - 1
                  ? 'background:linear-gradient(135deg,#16a34a,#15803d);color:white'
                  : 'background:linear-gradient(135deg,#7c3aed,#db2777);color:white'"
              >
                {{ i + 1 }}
              </div>
              {{ s }}
            </div>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          Página atualizada automaticamente após o pagamento
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/stores/cart.store';
import { useSiteConfigStore } from '@/stores/site-config.store';
import type { RealtimeChannel } from '@supabase/supabase-js';
import PixLogo from '@/components/ui/PixLogo.vue';

const router = useRouter();
const cart = useCartStore();
const siteConfig = useSiteConfigStore();

type Step = 'confirm' | 'pix' | 'card';

const step = ref<Step>('confirm');
const selectedMethod = ref('PIX');
const creating = ref(false);
const orderId = ref<string | null>(null);
const errorMessage = ref('');
const copied = ref(false);
const timeLeft = ref(30 * 60);

const pixQrCode = ref('');
const pixQrBase64 = ref('');
const manualPixKey = ref('');
const cardInitPoint = ref('');
const checkingCard = ref(false);
const cardCheckMsg = ref<{ ok: boolean; text: string } | null>(null);

let countdownTimer: ReturnType<typeof setInterval> | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;
let realtimeChannel: RealtimeChannel | null = null;

const howToPay = [
  'Abra o app do seu banco',
  'Vá em PIX → Pagar → QR Code ou Copia e Cola',
  'Escaneie ou cole o código acima',
  'Confirme e pronto! Download disponível automaticamente.',
];

function fmt(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

async function createOrder() {
  creating.value = true;
  errorMessage.value = '';
  try {
    const { data: funcData, error: funcErr } = await supabase.functions.invoke('create-order', {
      body: {
        items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod: selectedMethod.value,
      },
    });

    if (funcErr) {
      let msg = 'Erro ao processar pagamento.';
      try {
        const errBody = await (funcErr as any).context?.json?.();
        msg = errBody?.error ?? errBody?.message ?? funcErr.message ?? msg;
      } catch {
        msg = funcErr.message ?? msg;
      }
      throw new Error(msg);
    }

    if (funcData?.error || funcData?.message) {
      throw new Error(funcData.error ?? funcData.message);
    }

    if (!funcData?.order) throw new Error('Resposta inválida do servidor.');

    orderId.value = funcData.order.id;

    if (selectedMethod.value === 'CREDIT_CARD') {
      const url = funcData.payment?.initPoint ?? funcData.payment?.sandboxInitPoint ?? '';
      if (!url) throw new Error('Erro ao obter link de pagamento. Tente novamente.');
      sessionStorage.setItem('pending_order_id', funcData.order.id);
      window.location.href = url;
      return;
    }

    pixQrCode.value = funcData.payment?.qrCode ?? '';
    pixQrBase64.value = funcData.payment?.qrCodeBase64 ?? '';
    step.value = 'pix';
    startCountdown();
    startPolling();
  } catch (err: any) {
    errorMessage.value = err?.message || 'Erro ao gerar pagamento. Tente novamente.';
  } finally {
    creating.value = false;
  }
}

async function checkCardPayment() {
  if (!orderId.value || checkingCard.value) return;
  checkingCard.value = true;
  cardCheckMsg.value = null;
  try {
    await supabase.functions.invoke('reconcile-orders', { body: { orderId: orderId.value } });
    const { data } = await supabase.from('orders').select('status').eq('id', orderId.value).single();
    if (data?.status === 'PAID') {
      cart.clear();
      router.push(`/checkout/success/${orderId.value}`);
    } else {
      cardCheckMsg.value = { ok: false, text: 'Pagamento ainda não confirmado. Tente novamente em alguns segundos.' };
    }
  } catch {
    cardCheckMsg.value = { ok: false, text: 'Erro ao verificar. Tente novamente.' };
  } finally {
    checkingCard.value = false;
  }
}

function startCountdown() {
  timeLeft.value = 30 * 60;
  countdownTimer = setInterval(() => {
    if (--timeLeft.value <= 0) clearInterval(countdownTimer!);
  }, 1000);
}

function startPolling() {
  if (!orderId.value) return;

  realtimeChannel = supabase
    .channel(`order-${orderId.value}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId.value}` },
      (payload) => {
        const status = payload.new?.status;
        if (status === 'PAID') {
          clearInterval(countdownTimer!);
          cart.clear();
          router.push(`/checkout/success/${orderId.value}`);
        } else if (['CANCELLED', 'EXPIRED'].includes(status ?? '')) {
          clearInterval(countdownTimer!);
          errorMessage.value = 'Pagamento cancelado ou expirado.';
          step.value = 'confirm';
        }
      },
    )
    .subscribe();

  pollingTimer = setInterval(async () => {
    if (!orderId.value) return;
    try {
      await supabase.functions.invoke('reconcile-orders', { body: {} });
      const { data } = await supabase.from('orders').select('status').eq('id', orderId.value).single();
      if (data?.status === 'PAID') {
        clearInterval(pollingTimer!);
        clearInterval(countdownTimer!);
        cart.clear();
        router.push(`/checkout/success/${orderId.value}`);
      } else if (['CANCELLED', 'EXPIRED'].includes(data?.status ?? '')) {
        clearInterval(pollingTimer!);
      }
    } catch {}
  }, 5000);
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  if (pollingTimer) clearInterval(pollingTimer);
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
});
</script>

<style scoped>
.animate-slide-in-up { animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes slideInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.float { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

/* Borda gradiente animada no QR */
.qr-gradient-border {
  background: linear-gradient(135deg, #7c3aed, #ec4899, #32BCAD, #7c3aed);
  background-size: 300% 300%;
  animation: gradientShift 4s ease infinite;
}
@keyframes gradientShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
</style>
