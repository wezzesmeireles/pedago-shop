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
            <svg v-if="step === 'done'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span v-else>1</span>
          </div>
          <span class="text-sm font-medium" :class="step === 'done' ? 'text-gray-400' : 'text-gray-900'">Pagamento</span>
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
              <p class="text-xs text-gray-400">PDF • Entrega imediata</p>
            </div>
            <p class="font-bold text-gray-900 text-sm flex-shrink-0">{{ fmt(item.price * item.quantity) }}</p>
          </div>
        </div>
        <div class="flex justify-between items-center pt-3 mt-3 border-t">
          <span class="text-sm text-gray-500">Total</span>
          <span class="text-xl font-bold text-primary-600">{{ fmt(cart.total) }}</span>
        </div>
      </div>

      <!-- ── STEP: select ── -->
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

        <button @click="createOrder" :disabled="creating" class="w-full btn-primary py-3.5 text-base font-semibold flex items-center justify-center gap-2">
          <svg v-if="creating" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ creating ? 'Processando...' : 'Confirmar Pedido' }}
        </button>

        <div class="flex items-center justify-center gap-5 mt-4 pt-4 border-t">
          <span class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            Pagamento seguro
          </span>
          <span class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Download imediato
          </span>
          <span class="flex items-center gap-1 text-xs text-gray-400">
            <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            Dados protegidos
          </span>
        </div>
      </div>

      <!-- ── STEP: PIX ── -->
      <div v-if="step === 'pix'" class="card p-6">
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Aguardando pagamento PIX...
          </div>
          <h2 class="text-xl font-bold text-gray-900">
            {{ pixQrBase64 ? 'Escaneie o QR Code' : 'Pague via PIX' }}
          </h2>
          <p class="text-gray-500 text-sm mt-1">
            {{ pixQrBase64 ? 'Abra o app do seu banco e escaneie o código abaixo' : 'Use a chave PIX abaixo para fazer o pagamento' }}
          </p>
        </div>

        <!-- Timer -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span class="text-sm text-gray-500">Expira em</span>
          <span class="text-2xl font-mono font-bold tabular-nums" :class="timeLeft < 300 ? 'text-red-500' : 'text-gray-900'">
            {{ formatTime(timeLeft) }}
          </span>
        </div>

        <!-- QR Code (MercadoPago) -->
        <div v-if="pixQrBase64" class="flex justify-center mb-5">
          <div class="p-4 bg-white border-2 border-gray-100 rounded-3xl shadow-sm inline-block">
            <img :src="`data:image/png;base64,${pixQrBase64}`" alt="QR Code PIX" class="w-52 h-52" />
          </div>
        </div>

        <!-- Copia e cola (QR Code MP) -->
        <div v-if="pixQrCode" class="mb-5">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">PIX Copia e Cola</p>
          <div class="flex gap-2">
            <input :value="pixQrCode" readonly class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono text-gray-600 truncate min-w-0" />
            <button @click="copyText(pixQrCode)" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              :class="copied ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'">
              {{ copied ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>
        </div>

        <!-- Chave PIX manual (fallback) -->
        <div v-if="!pixQrCode && manualPixKey" class="mb-5 bg-green-50 border border-green-200 rounded-2xl p-5">
          <p class="text-sm font-bold text-green-800 mb-1 flex items-center gap-2">
            <span>⚡</span> Chave PIX para pagamento
          </p>
          <p class="text-xs text-green-600 mb-3">Abra seu banco, selecione PIX → Pagar → Cole a chave abaixo</p>
          <div class="flex gap-2">
            <span class="flex-1 bg-white border border-green-200 rounded-xl px-3 py-2.5 text-sm font-mono text-green-900 break-all">{{ manualPixKey }}</span>
            <button @click="copyText(manualPixKey)" class="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              :class="copied ? 'bg-green-500 text-white' : 'bg-green-700 text-white hover:bg-green-800'">
              {{ copied ? 'Copiado!' : 'Copiar' }}
            </button>
          </div>
          <p class="text-xs text-green-600 mt-3 flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Valor: <strong class="ml-1">{{ fmt(cart.total) }}</strong> — Após o pagamento seu pedido é confirmado automaticamente.
          </p>
        </div>

        <!-- How to pay -->
        <div class="bg-gray-50 rounded-2xl p-4 mb-4">
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

        <p class="text-center text-xs text-gray-400">Página atualizada automaticamente após confirmação do pagamento</p>
      </div>

      <!-- ── STEP: Cartão (Checkout Pro) ── -->
      <div v-if="step === 'card'" class="card p-8 text-center">
        <div class="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Redirecionando para o pagamento...</h2>
        <p class="text-gray-500 text-sm mb-6">Você será levado para o ambiente seguro do Mercado Pago.</p>
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
import { useCartStore } from '@/stores/cart.store';
import { useSiteConfigStore } from '@/stores/site-config.store';

const router = useRouter();
const cart = useCartStore();
const siteConfig = useSiteConfigStore();

type Step = 'select' | 'pix' | 'card' | 'done';

const step = ref<Step>('select');
const selectedMethod = ref('PIX');
const creating = ref(false);
const orderId = ref<string | null>(null);
const errorMessage = ref('');
const copied = ref(false);
const timeLeft = ref(30 * 60);

// PIX data
const pixQrCode = ref('');       // copia e cola string
const pixQrBase64 = ref('');     // base64 QR image
const manualPixKey = ref('');    // fallback: chave PIX da loja

// Card
const cardInitPoint = ref('');

let countdownTimer: ReturnType<typeof setInterval> | null = null;
let pollingTimer: ReturnType<typeof setInterval> | null = null;

const paymentMethods = [
  { value: 'PIX', emoji: '⚡', label: 'PIX', description: 'Aprovação imediata, 24h por dia', badge: 'Recomendado' },
  { value: 'CREDIT_CARD', emoji: '💳', label: 'Cartão', description: 'Crédito em até 12x', badge: null },
];

const pixSteps = [
  'Abra o app do seu banco',
  'Escolha pagar via PIX',
  'Escaneie o QR Code ou cole a chave/código',
  'Seu download fica disponível automaticamente!',
];

function fmt(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

// ── Build order in DB directly (no edge function needed) ──────────────
async function createOrderInDB(paymentMethod: string) {
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
    payment_method: paymentMethod,
    customer_email: user.email,
    customer_name: (profile as any)?.name ?? user.email,
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).select().single();
  if (orderErr || !order) throw new Error('Erro ao criar pedido.');

  const itemsData = cart.items.map((item) => {
    const p = productMap.get(item.productId) as any;
    return { order_id: (order as any).id, product_id: item.productId, product_name: p.name, unit_price: p.price, quantity: item.quantity };
  });
  await supabase.from('order_items').insert(itemsData);

  return order as any;
}

// ── Main flow ─────────────────────────────────────────────────────────
async function createOrder() {
  creating.value = true;
  errorMessage.value = '';
  try {
    // 1. Try edge function (needs to be deployed on Supabase)
    let funcData: any = null;
    try {
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod: selectedMethod.value,
        },
      });
      if (!error && data?.order) funcData = data;
    } catch {
      // Function not deployed or network error — fall through to DB fallback
    }

    if (funcData) {
      // Edge function OK → real MP payment
      orderId.value = funcData.order.id;

      if (selectedMethod.value === 'PIX') {
        pixQrCode.value = funcData.payment?.qrCode ?? '';
        pixQrBase64.value = funcData.payment?.qrCodeBase64 ?? '';
        step.value = 'pix';
        startCountdown();
        startPolling();
      } else {
        const url = funcData.payment?.initPoint ?? funcData.payment?.sandboxInitPoint ?? '';
        if (!url) throw new Error('Erro ao obter link de pagamento. Verifique as credenciais do Mercado Pago.');
        cardInitPoint.value = url;
        step.value = 'card';
        setTimeout(() => { window.location.href = url; }, 2000);
      }
      return;
    }

    // 2. Fallback: create order in DB + show manual PIX key
    const order = await createOrderInDB(selectedMethod.value);
    orderId.value = order.id;

    if (selectedMethod.value === 'CREDIT_CARD') {
      throw new Error('Pagamento com cartão indisponível no momento. Por favor use o PIX.');
    }

    // PIX fallback: show store PIX key configured in Integrações
    manualPixKey.value = (siteConfig.config as any).mercadoPagoPixKey ?? '';
    step.value = 'pix';
    startCountdown();
    startPolling();

  } catch (err: any) {
    errorMessage.value = err?.message || 'Erro ao criar pedido. Tente novamente.';
  } finally {
    creating.value = false;
  }
}

function startCountdown() {
  timeLeft.value = 30 * 60;
  countdownTimer = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) clearInterval(countdownTimer!);
  }, 1000);
}

function startPolling() {
  pollingTimer = setInterval(async () => {
    if (!orderId.value) return;
    try {
      const { data } = await supabase.from('orders').select('status').eq('id', orderId.value).single();
      if (data?.status === 'PAID') {
        clearInterval(pollingTimer!);
        clearInterval(countdownTimer!);
        cart.clear();
        router.push(`/checkout/success/${orderId.value}`);
      } else if (['CANCELLED', 'EXPIRED'].includes(data?.status)) {
        clearInterval(pollingTimer!);
      }
    } catch {}
  }, 5000);
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  if (pollingTimer) clearInterval(pollingTimer);
});
</script>
