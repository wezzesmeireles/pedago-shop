<template>
  <div class="max-w-2xl mx-auto px-4 py-10">

    <!-- Empty cart -->
    <div v-if="cart.items.length === 0" class="text-center py-20">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Carrinho vazio</h2>
      <p class="text-gray-500 mb-6">Adicione produtos antes de finalizar a compra.</p>
      <RouterLink to="/catalogo" class="btn-primary">Ver Produtos</RouterLink>
    </div>

    <div v-else>
      <!-- Step indicator -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            :class="step === 'done' ? 'bg-green-500 text-white' : 'bg-primary-600 text-white'">
            <svg v-if="step === 'done'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
            <span v-else>1</span>
          </div>
          <span class="text-sm font-medium" :class="step === 'done' ? 'text-gray-500' : 'text-gray-900'">Pagamento</span>
        </div>
        <div class="flex-1 h-px bg-gray-200 max-w-[60px]"></div>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            :class="step === 'done' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'">2</div>
          <span class="text-sm font-medium" :class="step === 'done' ? 'text-gray-900' : 'text-gray-400'">Confirmação</span>
        </div>
      </div>

      <!-- Order summary -->
      <div class="card p-5 mb-5">
        <h2 class="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Resumo do Pedido</h2>
        <div class="space-y-3">
          <div v-for="item in cart.items" :key="item.productId" class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              <img v-if="item.coverImageUrl" :src="item.coverImageUrl" :alt="item.name" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 text-sm truncate">{{ item.name }}</p>
              <p class="text-xs text-gray-400">Formato PDF • Entrega imediata</p>
            </div>
            <p class="font-bold text-gray-900 text-sm flex-shrink-0">{{ formatPrice(item.price) }}</p>
          </div>
        </div>
        <div class="flex justify-between items-center pt-3 mt-3 border-t">
          <span class="text-sm text-gray-500">Total</span>
          <span class="text-xl font-bold text-primary-600">{{ formatPrice(cart.total) }}</span>
        </div>
      </div>

      <!-- ── STEP: select method ── -->
      <div v-if="step === 'select'" class="card p-5 mb-5">
        <h2 class="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wide">Forma de Pagamento</h2>

        <div class="grid grid-cols-2 gap-3 mb-5">
          <button
            v-for="method in paymentMethods"
            :key="method.value"
            @click="selectedMethod = method.value"
            :class="['p-4 rounded-2xl border-2 text-left transition-all relative', selectedMethod === method.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white']"
          >
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xl">{{ method.emoji }}</span>
              <span class="font-semibold text-gray-900 text-sm">{{ method.label }}</span>
            </div>
            <p class="text-xs text-gray-500">{{ method.description }}</p>
            <span v-if="method.badge" class="absolute top-2 right-2 text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">{{ method.badge }}</span>
            <div v-if="selectedMethod === method.value" class="absolute top-2 left-2 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
              <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
          </button>
        </div>

        <div v-if="errorMessage" class="mb-4 flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMessage }}
        </div>

        <button @click="createOrder" :disabled="creating" class="w-full btn-primary py-3.5 text-base font-semibold">
          <svg v-if="creating" class="animate-spin mr-2 h-5 w-5 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ creating ? 'Processando...' : 'Confirmar Pedido' }}
        </button>

        <div class="flex items-center justify-center gap-5 mt-4 pt-4 border-t">
          <div class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Pagamento seguro
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Download imediato
          </div>
          <div class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Dados protegidos
          </div>
        </div>
      </div>

      <!-- ── STEP: PIX QR Code ── -->
      <div v-if="step === 'pix'" class="card p-6">
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Aguardando pagamento PIX...
          </div>
          <h2 class="text-xl font-bold text-gray-900">Escaneie o QR Code</h2>
          <p class="text-gray-500 text-sm mt-1">Abra o app do seu banco e escaneie o código abaixo</p>
        </div>

        <div class="flex items-center justify-center gap-3 mb-6">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-sm text-gray-500">Expira em:</span>
          <span class="text-2xl font-mono font-bold tabular-nums" :class="timeLeft < 300 ? 'text-red-500' : 'text-gray-900'">
            {{ formatTime(timeLeft) }}
          </span>
        </div>

        <div class="flex justify-center mb-6">
          <div class="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm inline-block">
            <img v-if="pixData?.qrCodeBase64" :src="`data:image/png;base64,${pixData.qrCodeBase64}`" alt="QR Code PIX" class="w-52 h-52" />
            <div v-else class="w-52 h-52 bg-gray-50 flex flex-col items-center justify-center rounded-2xl gap-2">
              <svg class="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
              <p class="text-xs text-gray-400">QR Code não disponível</p>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-2xl p-4 mb-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Como pagar:</p>
          <div class="space-y-2">
            <div v-for="(s, i) in pixSteps" :key="i" class="flex items-center gap-3 text-sm text-gray-700">
              <div class="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                :class="i === pixSteps.length - 1 ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'">
                {{ i + 1 }}
              </div>
              {{ s }}
            </div>
          </div>
        </div>

        <div class="mb-4">
          <p class="text-xs font-medium text-gray-500 mb-2">PIX Copia e Cola:</p>
          <div class="flex flex-col xs:flex-row gap-2">
            <input :value="pixData?.qrCode" readonly class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 min-w-0 truncate" />
            <button @click="copyCode" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              :class="copied ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'">
              <span v-if="copied" class="flex items-center justify-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Copiado!
              </span>
              <span v-else class="flex items-center justify-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                Copiar Código
              </span>
            </button>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400">Página atualizada automaticamente após confirmação do pagamento</p>
      </div>

      <!-- ── STEP: Card (Checkout Pro redirect) ── -->
      <div v-if="step === 'card'" class="card p-6 text-center">
        <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Redirecionando para o pagamento...</h2>
        <p class="text-gray-500 text-sm mb-6">Você será levado para o ambiente seguro do Mercado Pago para inserir os dados do cartão.</p>
        <div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-6"></div>
        <a :href="cardInitPoint" class="btn-primary w-full block text-center py-3.5">
          Ir para o pagamento →
        </a>
        <p class="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Ambiente 100% seguro — Mercado Pago
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/services/api';
import { useCartStore } from '@/stores/cart.store';

const router = useRouter();
const cart = useCartStore();

type Step = 'select' | 'pix' | 'card' | 'done';

const step = ref<Step>('select');
const selectedMethod = ref('PIX');
const creating = ref(false);
const pixData = ref<{ qrCode: string; qrCodeBase64: string } | null>(null);
const cardInitPoint = ref('');
const orderId = ref<string | null>(null);
const copied = ref(false);
const timeLeft = ref(30 * 60);
const errorMessage = ref('');

let countdownInterval: ReturnType<typeof setInterval>;
let pollingInterval: ReturnType<typeof setInterval>;

const paymentMethods = [
  { value: 'PIX', emoji: '⚡', label: 'PIX', description: 'Aprovação imediata, 24h por dia', badge: 'Recomendado' },
  { value: 'CREDIT_CARD', emoji: '💳', label: 'Cartão', description: 'Crédito em até 12x', badge: null },
];

const pixSteps = [
  'Abra o app do seu banco',
  'Escolha pagar via PIX → QR Code',
  'Escaneie o código acima ou use Copia e Cola',
  'Seu download ficará disponível automaticamente!',
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function createOrder() {
  creating.value = true;
  errorMessage.value = '';
  try {
    const res = await invokeFunction('create-order', {
      items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      paymentMethod: selectedMethod.value,
    });

    orderId.value = res.data.order.id;

    if (selectedMethod.value === 'PIX') {
      pixData.value = {
        qrCode: res.data.payment?.qrCode ?? '',
        qrCodeBase64: res.data.payment?.qrCodeBase64 ?? '',
      };
      step.value = 'pix';
      startCountdown();
      startPolling();
    } else {
      // Card: Checkout Pro redirect
      const url = res.data.payment?.initPoint ?? res.data.payment?.sandboxInitPoint ?? '';
      if (!url) {
        errorMessage.value = 'Erro ao obter link de pagamento. Tente novamente.';
        return;
      }
      cardInitPoint.value = url;
      step.value = 'card';
      // Auto-redirect after 2s
      setTimeout(() => { window.location.href = url; }, 2000);
    }
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || 'Erro ao criar pedido. Tente novamente.';
  } finally {
    creating.value = false;
  }
}

function startCountdown() {
  countdownInterval = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) clearInterval(countdownInterval);
  }, 1000);
}

function startPolling() {
  pollingInterval = setInterval(async () => {
    if (!orderId.value) return;
    try {
      const { data: orderStatus } = await supabase.from('orders').select('status').eq('id', orderId.value).single();
      const res = { data: orderStatus };
      if (res.data?.status === 'PAID') {
        clearInterval(pollingInterval);
        clearInterval(countdownInterval);
        step.value = 'done';
        cart.clear();
        router.push(`/checkout/success/${orderId.value}`);
      } else if (['CANCELLED', 'EXPIRED'].includes(res.data?.status)) {
        clearInterval(pollingInterval);
      }
    } catch {}
  }, 5000);
}

async function copyCode() {
  if (!pixData.value?.qrCode) return;
  await navigator.clipboard.writeText(pixData.value.qrCode);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

onUnmounted(() => {
  clearInterval(countdownInterval);
  clearInterval(pollingInterval);
});
</script>
