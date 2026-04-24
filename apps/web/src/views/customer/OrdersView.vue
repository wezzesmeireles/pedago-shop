<template>
  <div class="space-y-5">

    <!-- Page header -->
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Meus Pedidos</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-0.5">Suas compras realizadas com sucesso</p>
      </div>
      <div v-if="!loading && orders.length"
        class="flex-shrink-0 bg-gradient-to-br from-violet-500 to-violet-700 text-white rounded-2xl px-4 py-2.5 text-center shadow-lg shadow-violet-200">
        <p class="text-2xl font-black leading-none">{{ orders.length }}</p>
        <p class="text-xs font-medium opacity-80 mt-0.5">{{ orders.length !== 1 ? 'pedidos' : 'pedido' }}</p>
      </div>
    </div>

    <!-- Summary cards (only when there are orders) -->
    <div v-if="!loading && orders.length" class="grid grid-cols-2 gap-2 sm:gap-3">
      <div class="bg-white rounded-2xl border border-emerald-100 p-3 sm:p-4 text-center shadow-sm">
        <p class="text-lg sm:text-2xl font-black text-emerald-600">{{ orders.length }}</p>
        <p class="text-xs text-gray-400 font-medium mt-0.5">{{ orders.length !== 1 ? 'Compras' : 'Compra' }}</p>
      </div>
      <div class="bg-white rounded-2xl border border-violet-100 p-3 sm:p-4 text-center shadow-sm">
        <p class="text-lg sm:text-2xl font-black text-violet-600">{{ formatPrice(totalSpent) }}</p>
        <p class="text-xs text-gray-400 font-medium mt-0.5">Total investido</p>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm stagger-item" :style="{ '--i': i - 1 }">
        <div class="h-1 shimmer"></div>
        <div class="p-4 sm:p-5">
          <div class="flex justify-between items-start mb-4">
            <div class="space-y-2 flex-1 mr-4">
              <div class="h-4 shimmer rounded-lg w-36"></div>
              <div class="h-3 shimmer rounded-lg w-28"></div>
            </div>
            <div class="h-5 w-16 shimmer rounded-full"></div>
          </div>
          <div class="flex gap-2 mb-4">
            <div class="h-16 w-16 shimmer rounded-xl"></div>
            <div class="flex-1 space-y-2 py-1">
              <div class="h-3 shimmer rounded w-3/4"></div>
              <div class="h-3 shimmer rounded w-1/2"></div>
            </div>
          </div>
          <div class="flex justify-between items-center pt-3 border-t border-gray-50">
            <div class="h-8 w-28 shimmer rounded-xl"></div>
            <div class="h-5 w-20 shimmer rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center">
      <div class="relative inline-block mb-6">
        <div class="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-50 to-violet-100 rounded-3xl flex items-center justify-center">
          <svg class="w-10 h-10 sm:w-12 sm:h-12 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <span class="absolute -top-1.5 -right-1.5 bg-amber-400 text-white text-xs font-black w-7 h-7 rounded-full flex items-center justify-center shadow-md">0</span>
      </div>
      <h2 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">Nenhum pedido ainda</h2>
      <p class="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
        Explore nosso catálogo e encontre materiais digitais incríveis para a sua sala de aula.
      </p>
      <RouterLink to="/catalogo"
        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0 text-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
        </svg>
        Explorar Catálogo
      </RouterLink>
    </div>

    <!-- Order list -->
    <div v-else class="space-y-3">
      <div v-for="(order, i) in orders" :key="order.id"
        class="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-200 overflow-hidden stagger-item" :style="{ '--i': i }">

        <!-- Status stripe top -->
        <div :class="['h-1', statusStripe(order.status)]"></div>

        <div class="p-4 sm:p-5">

          <!-- Header: order number + badge + total -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center flex-wrap gap-1.5 mb-1">
                <span class="font-black text-gray-900 text-sm sm:text-base tracking-wide">
                  {{ order.orderNumber }}
                </span>
                <StatusBadge :status="order.status" />
              </div>
              <!-- Meta row -->
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="flex items-center gap-1 text-xs text-gray-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ formatDate(order.createdAt) }}
                </span>
                <span v-if="order.paymentMethod"
                  :class="['flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
                    order.paymentMethod === 'PIX' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600']">
                  <!-- PIX icon -->
                  <svg v-if="order.paymentMethod === 'PIX'" class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.5 2h11a1 1 0 01.8.4l3 4A1 1 0 0121 7H3a1 1 0 01-.8-1.6l3-4A1 1 0 016.5 2zM3 9h18l-1.5 12a1 1 0 01-1 .9H5.5a1 1 0 01-1-.9L3 9z"/>
                  </svg>
                  <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                  </svg>
                  {{ order.paymentMethod === 'PIX' ? 'PIX' : 'Cartão' }}
                </span>
              </div>
            </div>

            <!-- Total -->
            <div class="text-right flex-shrink-0">
              <p class="text-base sm:text-lg font-black text-gray-900 leading-none">{{ formatPrice(order.totalAmount) }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ order.items.length }} {{ order.items.length !== 1 ? 'itens' : 'item' }}</p>
            </div>
          </div>

          <!-- Product list -->
          <div class="space-y-2 mb-4">
            <div v-for="item in order.items" :key="item.id"
              class="flex items-center gap-3 bg-gray-50 rounded-xl p-2.5 sm:p-3 border border-gray-100/80 hover:bg-violet-50 hover:border-violet-100 transition-colors">
              <!-- Thumbnail -->
              <div class="flex-shrink-0">
                <img v-if="item.product?.coverImageUrl"
                  :src="item.product.coverImageUrl"
                  class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover shadow-sm" />
                <div v-else
                  class="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-100 to-purple-200 rounded-xl flex items-center justify-center shadow-sm">
                  <svg class="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 leading-tight truncate">{{ item.productName }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ item.quantity }}x · {{ formatPrice(item.unitPrice) }}</p>
              </div>
              <!-- Download badge on paid -->
              <div v-if="order.status === 'PAID'" class="flex-shrink-0">
                <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="hidden sm:inline">Disponível</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Footer: actions -->
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-50">

            <div class="flex flex-wrap gap-2">
              <RouterLink to="/minha-conta/downloads"
                class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-emerald-200 w-full sm:w-auto justify-center sm:justify-start">
                <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Baixar Arquivos
              </RouterLink>
            </div>

            <!-- Paid timestamp -->
            <p v-if="order.status === 'PAID' && order.paidAt" class="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
              Pago em {{ formatDate(order.paidAt) }}
            </p>
          </div>

        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-1.5 pt-2">
        <button @click="loadPage(currentPage - 1)" :disabled="currentPage === 1"
          class="w-9 h-9 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          ‹
        </button>
        <button v-for="p in totalPages" :key="p" @click="loadPage(p)"
          :class="['w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-95',
            p === currentPage
              ? 'bg-violet-600 text-white shadow-sm shadow-violet-200 scale-105'
              : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50']">
          {{ p }}
        </button>
        <button @click="loadPage(currentPage + 1)" :disabled="currentPage === totalPages"
          class="w-9 h-9 rounded-xl text-sm font-bold bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          ›
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const orders = ref<any[]>([]);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(1);
const LIMIT = 10;

const totalSpent = computed(() =>
  orders.value
    .filter(o => o.status === 'PAID')
    .reduce((sum, o) => sum + Number(o.totalAmount), 0),
);

function countByStatus(status: string) {
  return orders.value.filter(o => o.status === status).length;
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusStripe(status: string) {
  const map: Record<string, string> = {
    PAID: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    AWAITING_PAYMENT: 'bg-gradient-to-r from-amber-400 to-amber-500',
    CANCELLED: 'bg-gradient-to-r from-red-400 to-red-500',
    EXPIRED: 'bg-gray-200',
    REFUNDED: 'bg-gradient-to-r from-blue-400 to-blue-500',
    PENDING: 'bg-gray-300',
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
      .eq('status', 'PAID')
      .order('created_at', { ascending: false })
      .range(from, to);

    orders.value = (data ?? []).map((o: any) => ({
      ...o,
      orderNumber: o.order_number,
      totalAmount: o.total_amount,
      createdAt: o.created_at,
      paidAt: o.paid_at,
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
