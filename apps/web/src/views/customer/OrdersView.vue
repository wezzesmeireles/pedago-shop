<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Meus Pedidos</h1>
      <span v-if="!loading && orders.length" class="text-sm text-gray-500">{{ orders.length }} pedido{{ orders.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card p-5 animate-pulse">
        <div class="flex justify-between mb-3">
          <div class="space-y-2">
            <div class="h-3.5 bg-gray-200 rounded w-24"></div>
            <div class="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div class="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div class="flex gap-2">
          <div class="h-8 w-28 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="orders.length === 0" class="text-center py-20">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nenhum pedido ainda</h2>
      <p class="text-gray-500 text-sm mb-6">Explore o catálogo e faça sua primeira compra.</p>
      <RouterLink to="/catalogo" class="btn-primary">Ver Produtos</RouterLink>
    </div>

    <!-- Order list -->
    <div v-else class="space-y-3">
      <div v-for="order in orders" :key="order.id" class="card p-5 hover:shadow-md transition-shadow">
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 mb-4">
          <div class="min-w-0">
            <p class="font-bold text-gray-900 text-sm truncate">{{ order.orderNumber }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="flex flex-col xs:flex-row items-end xs:items-center gap-1.5 flex-shrink-0">
            <StatusBadge :status="order.status" />
            <span class="font-bold text-primary-600 text-sm whitespace-nowrap">{{ formatPrice(order.totalAmount) }}</span>
          </div>
        </div>

        <!-- Products -->
        <div class="flex flex-wrap gap-2 mb-4">
          <div v-for="item in order.items" :key="item.id" class="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <img v-if="item.product?.coverImageUrl" :src="item.product.coverImageUrl" class="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
            <div v-else class="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <span class="text-xs font-medium text-gray-700">{{ item.productName }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 flex-wrap">
          <RouterLink
            v-if="order.status === 'PAID'"
            :to="`/minha-conta/downloads`"
            class="inline-flex items-center gap-1.5 text-sm bg-primary-600 text-white px-4 py-2 rounded-xl hover:bg-primary-700 transition-colors font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Ver Downloads
          </RouterLink>
          <RouterLink
            v-if="order.status === 'AWAITING_PAYMENT'"
            :to="`/checkout`"
            class="inline-flex items-center gap-1.5 text-sm bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition-colors font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
            Retomar Pagamento
          </RouterLink>
          <span v-if="['CANCELLED', 'EXPIRED'].includes(order.status)" class="text-xs text-gray-400 flex items-center">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Pedido {{ order.status === 'CANCELLED' ? 'cancelado' : 'expirado' }}
          </span>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center gap-1.5 mt-6">
        <button @click="loadPage(currentPage - 1)" :disabled="currentPage === 1"
          class="w-9 h-9 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
          ‹
        </button>
        <button v-for="p in totalPages" :key="p" @click="loadPage(p)"
          :class="['w-9 h-9 rounded-xl text-sm font-medium transition-colors', p === currentPage ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50']">
          {{ p }}
        </button>
        <button @click="loadPage(currentPage + 1)" :disabled="currentPage === totalPages"
          class="w-9 h-9 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
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

async function loadPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  loading.value = true;
  try {
    const from = (page - 1) * LIMIT;
    const to = from + LIMIT - 1;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, count } = await supabase
      .from('orders')
      .select('*, order_items(id, product_name, products(id, name, cover_image_url, slug), download_tokens(*))', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    orders.value = (data ?? []).map((o: any) => ({
      ...o,
      orderNumber: o.order_number,
      totalAmount: o.total_amount,
      createdAt: o.created_at,
      items: (o.order_items ?? []).map((i: any) => ({
        ...i,
        productName: i.product_name,
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
