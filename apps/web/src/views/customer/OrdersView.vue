<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-black text-gray-900 tracking-tight">Meus Pedidos</h1>
        <p class="text-sm text-gray-400 mt-0.5">Histórico completo das suas compras</p>
      </div>
      <div v-if="!loading && orders.length" class="bg-violet-50 border border-violet-100 rounded-2xl px-4 py-2 text-center">
        <p class="text-xl font-black text-violet-600 leading-none">{{ orders.length }}</p>
        <p class="text-xs text-violet-400 font-medium mt-0.5">pedido{{ orders.length !== 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse shadow-sm">
        <div class="flex justify-between items-start mb-4">
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded-lg w-32"></div>
            <div class="h-3 bg-gray-100 rounded-lg w-24"></div>
          </div>
          <div class="h-6 w-20 bg-gray-200 rounded-full"></div>
        </div>
        <div class="flex gap-2 mb-4">
          <div class="h-14 w-14 bg-gray-100 rounded-xl"></div>
          <div class="h-14 w-14 bg-gray-100 rounded-xl"></div>
        </div>
        <div class="h-9 w-32 bg-gray-100 rounded-xl"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-24 text-center">
      <div class="relative mb-6">
        <div class="w-24 h-24 bg-violet-50 rounded-3xl flex items-center justify-center">
          <svg class="w-12 h-12 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <div class="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">0</div>
      </div>
      <h2 class="text-xl font-bold text-gray-900 mb-2">Nenhum pedido ainda</h2>
      <p class="text-gray-400 text-sm mb-8 max-w-xs">Explore nosso catálogo e encontre materiais digitais para sua sala de aula.</p>
      <RouterLink to="/catalogo"
        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:scale-105">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
        </svg>
        Explorar Catálogo
      </RouterLink>
    </div>

    <!-- Order list -->
    <div v-else class="space-y-4">
      <div v-for="order in orders" :key="order.id"
        class="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-200 overflow-hidden">

        <!-- Status stripe -->
        <div :class="['h-1 w-full', statusStripe(order.status)]"></div>

        <div class="p-5">
          <!-- Header row -->
          <div class="flex items-start justify-between gap-3 mb-4">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-black text-gray-900 text-sm tracking-wide">{{ order.orderNumber }}</span>
                <StatusBadge :status="order.status" />
              </div>
              <div class="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ formatDate(order.createdAt) }}
                </span>
                <span v-if="order.paymentMethod" class="flex items-center gap-1">
                  <svg v-if="order.paymentMethod === 'PIX'" class="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 2c4.411 0 8 3.589 8 8s-3.589 8-8 8-8-3.589-8-8 3.589-8 8-8zm-1 3v2H9v2h2v6h2V9h2V7h-2V5h-2z"/>
                  </svg>
                  <svg v-else class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  {{ order.paymentMethod === 'PIX' ? 'PIX' : 'Cartão' }}
                </span>
              </div>
            </div>

            <!-- Total -->
            <div class="text-right flex-shrink-0">
              <p class="text-lg font-black text-gray-900 leading-none">{{ formatPrice(order.totalAmount) }}</p>
              <p class="text-xs text-gray-400 mt-0.5">total</p>
            </div>
          </div>

          <!-- Products -->
          <div class="mb-4">
            <div class="flex flex-wrap gap-2">
              <div v-for="item in order.items" :key="item.id"
                class="flex items-center gap-2.5 bg-gray-50 hover:bg-violet-50 rounded-xl px-3 py-2 transition-colors border border-transparent hover:border-violet-100">
                <div class="relative flex-shrink-0">
                  <img v-if="item.product?.coverImageUrl" :src="item.product.coverImageUrl"
                    class="w-9 h-9 rounded-lg object-cover shadow-sm" />
                  <div v-else class="w-9 h-9 bg-gradient-to-br from-violet-100 to-violet-200 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-gray-700 leading-tight truncate max-w-[140px]">{{ item.productName }}</p>
                  <p class="text-xs text-gray-400">{{ item.quantity }}x · {{ formatPrice(item.unitPrice) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-gray-50 pt-4">
            <!-- Actions -->
            <div class="flex items-center gap-2 flex-wrap">

              <!-- PAID -->
              <RouterLink v-if="order.status === 'PAID'" to="/minha-conta/downloads"
                class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-emerald-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Baixar Arquivos
              </RouterLink>

              <!-- AWAITING_PAYMENT -->
              <RouterLink v-if="order.status === 'AWAITING_PAYMENT'" to="/checkout"
                class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow-amber-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                </svg>
                Concluir Pagamento
              </RouterLink>

              <!-- CANCELLED / EXPIRED -->
              <div v-if="['CANCELLED', 'EXPIRED'].includes(order.status)"
                class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Pedido {{ order.status === 'CANCELLED' ? 'cancelado' : 'expirado' }}
                </span>
                <RouterLink to="/catalogo"
                  class="text-xs text-violet-600 hover:text-violet-700 font-semibold hover:underline">
                  Comprar novamente
                </RouterLink>
              </div>

              <!-- REFUNDED -->
              <span v-if="order.status === 'REFUNDED'"
                class="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-xl font-medium">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/>
                </svg>
                Reembolso processado
              </span>

            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-1.5 pt-2">
        <button @click="loadPage(currentPage - 1)" :disabled="currentPage === 1"
          class="w-9 h-9 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          ‹
        </button>
        <button v-for="p in totalPages" :key="p" @click="loadPage(p)"
          :class="['w-9 h-9 rounded-xl text-sm font-bold transition-all', p === currentPage
            ? 'bg-violet-600 text-white shadow-sm shadow-violet-200'
            : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50']">
          {{ p }}
        </button>
        <button @click="loadPage(currentPage + 1)" :disabled="currentPage === totalPages"
          class="w-9 h-9 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const orders = ref<any[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const LIMIT = 10;

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusStripe(status: string) {
  const map: Record<string, string> = {
    PAID: 'bg-emerald-400',
    AWAITING_PAYMENT: 'bg-amber-400',
    CANCELLED: 'bg-red-400',
    EXPIRED: 'bg-gray-200',
    REFUNDED: 'bg-blue-400',
    PENDING: 'bg-slate-300',
  };
  return map[status] ?? 'bg-gray-200';
}

async function loadPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  loading.value = true;
  try {
    const from = (page - 1) * LIMIT;
    const to = from + LIMIT - 1;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, count } = await supabase
      .from('orders')
      .select('*, order_items(id, product_name, unit_price, quantity, products(id, name, cover_image_url, slug), download_tokens(*))', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    orders.value = (data ?? []).map((o: any) => ({
      ...o,
      orderNumber: o.order_number,
      totalAmount: o.total_amount,
      createdAt: o.created_at,
      paymentMethod: o.payment_method,
      items: (o.order_items ?? []).map((i: any) => ({
        ...i,
        productName: i.product_name,
        unitPrice: i.unit_price,
        product: i.products ? { coverImageUrl: i.products.cover_image_url } : null,
        downloadTokens: i.download_tokens ?? [],
      })),
    }));
    totalPages.value = Math.ceil((count ?? 0) / LIMIT);
    currentPage.value = page;
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadPage(1));
</script>
