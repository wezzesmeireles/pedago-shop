<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-slate-900">Pedidos</h1>
      <p class="text-sm text-slate-500 mt-0.5">Gerencie e acompanhe todos os pedidos</p>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input v-model="search" @input="debouncedLoad" placeholder="Buscar pedido ou email..." class="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl w-64 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="f in statusFilters" :key="f.value" @click="setStatusFilter(f.value)"
          :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', statusFilter === f.value ? f.activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pedido</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Cliente</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Produtos</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Data</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="order in orders" :key="order.id" class="group hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <span class="text-xs font-mono font-semibold text-slate-700">{{ order.orderNumber }}</span>
              </td>
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <p class="text-sm font-medium text-slate-900 leading-tight">{{ order.customerName }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ order.customerEmail }}</p>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <p class="text-xs text-slate-500 max-w-[200px] truncate">{{ order.items?.map((i: any) => i.productName).join(', ') }}</p>
              </td>
              <td class="px-4 py-3.5">
                <span class="text-sm font-bold text-violet-600">{{ formatPrice(order.totalAmount) }}</span>
              </td>
              <td class="px-4 py-3.5">
                <StatusBadge :status="order.status" />
              </td>
              <td class="px-4 py-3.5 hidden md:table-cell">
                <span class="text-xs text-slate-400">{{ formatDate(order.createdAt) }}</span>
              </td>
              <td class="px-4 py-3.5">
                <button @click="openDetails(order.id)" class="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg">
                  Detalhes
                </button>
              </td>
            </tr>
            <tr v-if="orders.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-slate-400 text-sm">Nenhum pedido encontrado</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-slate-100">
        <span class="text-xs text-slate-500">Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex gap-1">
          <button @click="loadOrders(currentPage - 1)" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm">‹</button>
          <button v-for="p in pageRange" :key="p" @click="loadOrders(p)"
            :class="['w-8 h-8 rounded-lg text-sm font-medium', p === currentPage ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100']">
            {{ p }}
          </button>
          <button @click="loadOrders(currentPage + 1)" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm">›</button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <AppModal v-model="detailsOpen" title="Detalhes do Pedido">
      <div v-if="loadingDetail" class="py-12 flex items-center justify-center">
        <div class="animate-spin w-7 h-7 border-3 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="selectedOrder" class="space-y-5">
        <!-- Order meta -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 rounded-xl p-3">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Pedido</p>
            <p class="text-sm font-mono font-bold text-slate-900">{{ selectedOrder.orderNumber }}</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Total</p>
            <p class="text-sm font-bold text-violet-600">{{ formatPrice(selectedOrder.totalAmount) }}</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Cliente</p>
            <p class="text-sm font-semibold text-slate-900 leading-tight">{{ selectedOrder.customerName }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ selectedOrder.customerEmail }}</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-3">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Data</p>
            <p class="text-sm text-slate-700">{{ formatDate(selectedOrder.createdAt) }}</p>
          </div>
        </div>

        <!-- Items -->
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Itens do Pedido</p>
          <div class="space-y-2">
            <div v-for="item in selectedOrder.items" :key="item.id" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <div class="w-10 h-10 rounded-lg overflow-hidden bg-white flex-shrink-0 border border-slate-200">
                <img v-if="item.product?.coverImageUrl" :src="item.product.coverImageUrl" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ item.productName }}</p>
                <p class="text-xs text-slate-400">Qtd: {{ item.quantity }} · {{ formatPrice(item.unitPrice) }}</p>
              </div>
              <div v-if="item.downloadTokens?.length" class="text-right flex-shrink-0">
                <p v-for="t in item.downloadTokens" :key="t.id" class="text-xs text-slate-500">
                  <span :class="t.downloadCount >= t.maxDownloads ? 'text-red-500' : 'text-emerald-600'">{{ t.downloadCount }}</span>/{{ t.maxDownloads }} downloads
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Status update -->
        <div>
          <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Alterar Status</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in statusOptions"
              :key="s.value"
              @click="updateStatus(selectedOrder.id, s.value)"
              :disabled="selectedOrder.status === s.value || updatingStatus"
              :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all', selectedOrder.status === s.value ? s.activeClass : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50']">
              {{ s.label }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import AppModal from '@/components/ui/AppModal.vue';

const orders = ref([]);
const search = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

const detailsOpen = ref(false);
const loadingDetail = ref(false);
const selectedOrder = ref<any>(null);
const updatingStatus = ref(false);

const statusFilters = [
  { value: '', label: 'Todos', activeClass: 'bg-slate-800 text-white' },
  { value: 'PAID', label: 'Pagos', activeClass: 'bg-emerald-600 text-white' },
  { value: 'AWAITING_PAYMENT', label: 'Aguardando', activeClass: 'bg-amber-500 text-white' },
  { value: 'CANCELLED', label: 'Cancelados', activeClass: 'bg-red-500 text-white' },
  { value: 'EXPIRED', label: 'Expirados', activeClass: 'bg-slate-500 text-white' },
];

const statusOptions = [
  { value: 'AWAITING_PAYMENT', label: 'Aguardando', activeClass: 'bg-amber-100 text-amber-700' },
  { value: 'PAID', label: 'Marcar Pago', activeClass: 'bg-emerald-100 text-emerald-700' },
  { value: 'CANCELLED', label: 'Cancelar', activeClass: 'bg-red-100 text-red-600' },
  { value: 'EXPIRED', label: 'Expirar', activeClass: 'bg-slate-200 text-slate-600' },
];

const pageRange = computed(() => {
  const range = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i++) range.push(i);
  return range;
});

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function setStatusFilter(val: string) {
  statusFilter.value = val;
  loadOrders(1);
}

let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedLoad() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadOrders(1), 400);
}

async function loadOrders(page = 1) {
  const limit = 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let q = supabase.from('orders').select('*, profiles(name, avatar_url), order_items(product_name, quantity, unit_price)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
  if (statusFilter.value) q = q.eq('status', statusFilter.value);
  if (search.value) q = q.or(`order_number.ilike.%${search.value}%,customer_email.ilike.%${search.value}%,customer_name.ilike.%${search.value}%`);
  const { data, count } = await q;
  orders.value = (data ?? []).map((o: any) => ({ ...o, orderNumber: o.order_number, totalAmount: o.total_amount, customerName: o.customer_name, createdAt: o.created_at }));
  totalPages.value = Math.ceil((count ?? 0) / limit);
  currentPage.value = page;
}

async function openDetails(id: string) {
  detailsOpen.value = true;
  loadingDetail.value = true;
  selectedOrder.value = null;
  try {
    const { data } = await supabase.from('orders').select('*, profiles(*), order_items(*, products(id, name, cover_image_url), download_tokens(*))').eq('id', id).single();
    selectedOrder.value = data ? { ...data, orderNumber: data.order_number, totalAmount: data.total_amount, customerName: data.customer_name } : null;
  } finally {
    loadingDetail.value = false;
  }
}

async function updateStatus(id: string, status: string) {
  updatingStatus.value = true;
  try {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    selectedOrder.value = { ...selectedOrder.value, status };
    await loadOrders(currentPage.value);
  } finally {
    updatingStatus.value = false;
  }
}

onMounted(() => loadOrders());
</script>
