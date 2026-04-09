<template>
  <div class="max-w-xl mx-auto px-4 py-10">

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

      <!-- ── STEP: Confirmar pedido ── -->
      <div v-if="step === 'confirm'">
        <h1 class="text-2xl font-black text-gray-900 mb-1">Finalizar Pedido</h1>
        <p class="text-sm text-gray-500 mb-6">Revise os itens e confirme para gerar o PIX</p>

        <!-- Items -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <div class="space-y-3 mb-4">
            <div v-for="item in cart.items" :key="item.productId" class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <img v-if="item.coverImageUrl" :src="item.coverImageUrl" :alt="item.name" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">{{ item.name }}</p>
                <p class="text-xs text-gray-400">PDF • Entrega imediata por e-mail</p>
              </div>
              <p class="font-bold text-gray-900 text-sm flex-shrink-0">{{ fmt(item.price * item.quantity) }}</p>
            </div>
          </div>

          <div class="flex justify-between items-center pt-3 border-t border-gray-100">
            <span class="text-sm text-gray-500">Total a pagar</span>
            <span class="text-2xl font-black text-primary-600">{{ fmt(cart.total) }}</span>
          </div>
        </div>

        <!-- Payment method selector -->
        <div class="grid grid-cols-2 gap-3 mb-5">
          <button
            @click="selectedMethod = 'PIX'"
            :class="['p-4 rounded-2xl border-2 text-left transition-all relative', selectedMethod === 'PIX' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300 bg-white']"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">⚡</span>
              <span class="font-bold text-gray-900 text-sm">PIX</span>
            </div>
            <p class="text-xs text-gray-500">Aprovação imediata, 24h por dia</p>
            <span class="absolute top-2 right-2 text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">Recomendado</span>
            <div v-if="selectedMethod === 'PIX'" class="absolute top-2 left-2 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/></svg>
            </div>
          </button>
          <button
            @click="selectedMethod = 'CREDIT_CARD'"
            :class="['p-4 rounded-2xl border-2 text-left transition-all relative', selectedMethod === 'CREDIT_CARD' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300 bg-white']"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">💳</span>
              <span class="font-bold text-gray-900 text-sm">Cartão</span>
            </div>
            <p class="text-xs text-gray-500">Crédito em até 12x</p>
            <div v-if="selectedMethod === 'CREDIT_CARD'" class="absolute top-2 left-2 w-3.5 h-3.5 bg-primary-600 rounded-full flex items-center justify-center">
              <svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/></svg>
            </div>
          </button>
        </div>

        <div v-if="errorMessage" class="mb-4 flex items-start gap-2 bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMessage }}
        </div>

        <button @click="createOrder" :disabled="creating"
          :class="['w-full font-bold py-4 rounded-2xl transition-all duration-200 shadow text-base flex items-center justify-center gap-2 active:scale-[0.99]',
            selectedMethod === 'PIX' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white']">
          <svg v-if="creating" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span v-if="creating">{{ selectedMethod === 'PIX' ? 'Gerando PIX...' : 'Processando...' }}</span>
          <span v-else>
            {{ selectedMethod === 'PIX' ? `⚡ Gerar PIX — ${fmt(cart.total)}` : `💳 Pagar com Cartão — ${fmt(cart.total)}` }}
          </span>
        </button>

        <div class="flex items-center justify-center gap-5 mt-4">
          <span class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Pagamento seguro
          </span>
          <span class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Download imediato
          </span>
        </div>
      </div>

      <!-- ── STEP: Cartão (Checkout Pro redirect) ── -->
      <div v-if="step === 'card'" class="text-center py-8">
        <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Complete o pagamento no Mercado Pago</h2>
        <p class="text-gray-500 text-sm mb-5">Uma nova aba foi aberta. Após pagar, clique em "Já paguei" abaixo.</p>
        <a :href="cardInitPoint" target="_blank" class="btn-primary w-full block text-center py-3.5 font-bold mb-3">
          Abrir Mercado Pago →
        </a>
        <button @click="checkCardPayment" :disabled="checkingCard"
          class="w-full border-2 border-primary-600 text-primary-600 font-bold py-3.5 rounded-2xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
          <svg v-if="checkingCard" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ checkingCard ? 'Verificando...' : 'Já paguei — Verificar pagamento' }}
        </button>
        <p v-if="cardCheckMsg" class="mt-3 text-sm" :class="cardCheckMsg.ok ? 'text-green-600' : 'text-red-500'">{{ cardCheckMsg.text }}</p>
        <p class="text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
          <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          Ambiente 100% seguro — Mercado Pago
        </p>
      </div>

      <!-- ── STEP: PIX ── -->
      <div v-if="step === 'pix'">
        <!-- Waiting badge -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <div class="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></div>
          <span class="text-sm font-semibold text-blue-700">Aguardando pagamento PIX...</span>
        </div>

        <!-- Timer -->
        <div class="text-center mb-6">
          <p class="text-xs text-gray-400 mb-1">Expira em</p>
          <span class="text-4xl font-mono font-black tabular-nums" :class="timeLeft < 300 ? 'text-red-500' : 'text-gray-900'">
            {{ formatTime(timeLeft) }}
          </span>
        </div>

        <!-- QR Code (automático via MercadoPago) -->
        <div v-if="pixQrBase64" class="flex justify-center mb-5">
          <div class="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm inline-block">
            <img :src="`data:image/png;base64,${pixQrBase64}`" alt="QR Code PIX" class="w-56 h-56" />
          </div>
        </div>

        <!-- Valor -->
        <div class="text-center mb-5">
          <p class="text-xs text-gray-400">Valor</p>
          <p class="text-3xl font-black text-gray-900">{{ fmt(cart.total) }}</p>
        </div>

        <!-- Copia e cola (MP automático) -->
        <div v-if="pixQrCode" class="bg-gray-50 rounded-2xl p-4 mb-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PIX Copia e Cola</p>
          <div class="flex gap-2">
            <input :value="pixQrCode" readonly class="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 truncate min-w-0" />
            <button @click="copyText(pixQrCode)" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              :class="copied ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'">
              {{ copied ? '✓ Copiado' : 'Copiar' }}
            </button>
          </div>
        </div>

        <!-- Chave PIX manual (fallback quando a edge function não está deployada) -->
        <div v-if="!pixQrCode && manualPixKey" class="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
          <p class="text-sm font-bold text-green-800 mb-3">Chave PIX para pagamento:</p>
          <div class="flex gap-2 mb-3">
            <span class="flex-1 bg-white border border-green-200 rounded-xl px-3 py-2.5 text-sm font-mono text-green-900 break-all select-all">{{ manualPixKey }}</span>
            <button @click="copyText(manualPixKey)" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              :class="copied ? 'bg-green-500 text-white' : 'bg-green-700 text-white hover:bg-green-800'">
              {{ copied ? '✓ Copiado' : 'Copiar' }}
            </button>
          </div>
          <p class="text-xs text-green-700">Valor: <strong>{{ fmt(cart.total) }}</strong> — Após confirmar o pagamento no banco, aguarde até 1h para receber o download.</p>
        </div>

        <!-- Como pagar -->
        <div class="bg-gray-50 rounded-2xl p-4 mb-4">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Como pagar:</p>
          <div class="space-y-2.5">
            <div v-for="(s, i) in howToPay" :key="i" class="flex items-center gap-3 text-sm text-gray-700">
              <div class="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0"
                :class="i === howToPay.length - 1 ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'">
                {{ i + 1 }}
              </div>
              {{ s }}
            </div>
          </div>
        </div>

        <p class="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
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

async function createOrderInDB() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const productIds = cart.items.map((i) => i.productId);
  const { data: products } = await supabase
    .from('products').select('id, name, price')
    .in('id', productIds).eq('is_active', true).is('deleted_at', null);
  if (!products?.length) throw new Error('Produto não disponível.');

  const productMap = new Map((products as any[]).map((p) => [p.id, p]));
  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(productMap.get(item.productId)?.price ?? 0) * item.quantity, 0,
  );

  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const orderNumber = `ORD-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(6, '0')}`;
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();

  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    order_number: orderNumber,
    user_id: user.id,
    status: 'AWAITING_PAYMENT',
    total_amount: totalAmount,
    payment_method: 'PIX',
    customer_email: user.email,
    customer_name: (profile as any)?.name ?? user.email,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).select().single();
  if (orderErr || !order) throw new Error('Erro ao criar pedido.');

  await supabase.from('order_items').insert(
    cart.items.map((item) => {
      const p = productMap.get(item.productId) as any;
      return { order_id: (order as any).id, product_id: item.productId, product_name: p.name, unit_price: p.price, quantity: item.quantity };
    }),
  );

  return order as any;
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
        // FunctionsHttpError exposes the response body via context
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
      cardInitPoint.value = url;
      step.value = 'card';
      setTimeout(() => { window.open(url, '_blank'); }, 1000);
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

  // Realtime subscription — reacts instantly when order status changes
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

  // Every 5s: call reconcile (forces MP status check) then read order status
  pollingTimer = setInterval(async () => {
    if (!orderId.value) return;
    try {
      // Trigger reconcile so MP is checked server-side
      await supabase.functions.invoke('reconcile-orders', { body: {} });
      // Then read the updated status
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
