<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Pedidos</h1>
        <p class="text-sm text-slate-500 mt-0.5">Acompanhe e gerencie todos os pedidos</p>
      </div>
      <button @click="reconcileAll" :disabled="reconciling"
        :class="['inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
          reconciling ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-amber-200']">
        <svg :class="['w-4 h-4', reconciling && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        {{ reconciling ? 'Verificando...' : 'Reconciliar Pagamentos' }}
      </button>
    </div>
    <div v-if="reconcileMsg" :class="['text-sm font-medium px-4 py-3 rounded-xl', reconcileMsg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100']">
      {{ reconcileMsg.text }}
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-wrap gap-3 items-center">
      <div class="relative flex-1 min-w-[200px] max-w-xs">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input v-model="search" @input="debouncedLoad" placeholder="Buscar por pedido ou email..." class="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors" />
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="f in statusFilters" :key="f.value" @click="setStatusFilter(f.value)"
          :class="['px-3 py-2 rounded-xl text-xs font-semibold transition-all', statusFilter === f.value ? f.activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
          {{ f.label }}
        </button>
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button v-for="f in dateFilters" :key="f.value" @click="setDateFilter(f.value)"
          :class="['px-3 py-2 rounded-xl text-xs font-semibold transition-all', dateFilter === f.value ? f.activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
          {{ f.label }}
        </button>
      </div>
    </div>

    <!-- Mobile Cards (md:hidden) -->
    <div class="md:hidden space-y-3">
      <div v-if="orders.length === 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <p class="text-sm font-medium text-slate-400">Nenhum pedido encontrado</p>
      </div>
      <div v-for="order in orders" :key="order.id" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2 mb-2">
          <span class="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{{ order.orderNumber }}</span>
          <span class="text-sm font-black text-violet-600">{{ formatPrice(order.totalAmount) }}</span>
        </div>
        <div class="flex items-center gap-2 mb-2">
          <StatusBadge :status="order.status" />
          <span class="text-xs text-slate-400">{{ formatDate(order.createdAt) }}</span>
        </div>
        <p class="text-sm font-semibold text-slate-800 leading-snug">{{ order.customerName }}</p>
        <p class="text-xs text-slate-400 mb-3">{{ order.customerEmail }}</p>
        <p v-if="order.items?.length" class="text-xs text-slate-500 mb-3 line-clamp-2">{{ order.items.map((i: any) => i.productName).join(' · ') }}</p>
        <button @click="openDetails(order.id)"
          class="w-full py-2 text-sm font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">
          Ver Detalhes
        </button>
      </div>
      <div v-if="totalPages > 1" class="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-4 py-3">
        <span class="text-xs text-slate-500">Pág. {{ currentPage }}/{{ totalPages }}</span>
        <div class="flex gap-1">
          <button @click="loadOrders(currentPage - 1)" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 bg-slate-50 disabled:opacity-30 text-sm">‹</button>
          <button v-for="p in pageRange" :key="p" @click="loadOrders(p)" :class="['w-8 h-8 rounded-xl text-sm font-semibold', p === currentPage ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-600']">{{ p }}</button>
          <button @click="loadOrders(currentPage + 1)" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 bg-slate-50 disabled:opacity-30 text-sm">›</button>
        </div>
      </div>
    </div>

    <!-- Desktop Table (hidden md:block) -->
    <div class="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pedido</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Produtos</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Data</th>
              <th class="px-4 py-3.5 w-24"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="orders.length === 0">
              <td colspan="7" class="px-5 py-16 text-center">
                <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <p class="text-sm font-medium text-slate-400">Nenhum pedido encontrado</p>
              </td>
            </tr>
            <tr v-for="order in orders" :key="order.id" class="group hover:bg-violet-50/30 transition-colors">
              <td class="px-5 py-4">
                <span class="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">{{ order.orderNumber }}</span>
              </td>
              <td class="px-4 py-4">
                <p class="text-sm font-semibold text-slate-900">{{ order.customerName }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ order.customerEmail }}</p>
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <p class="text-xs text-slate-500 max-w-[220px] truncate">{{ order.items?.map((i: any) => i.productName).join(', ') }}</p>
              </td>
              <td class="px-4 py-4">
                <span class="text-sm font-black text-violet-600">{{ formatPrice(order.totalAmount) }}</span>
              </td>
              <td class="px-4 py-4">
                <StatusBadge :status="order.status" />
              </td>
              <td class="px-4 py-4 hidden lg:table-cell">
                <span class="text-xs text-slate-400">{{ formatDate(order.createdAt) }}</span>
              </td>
              <td class="px-4 py-4">
                <button @click="openDetails(order.id)"
                  class="opacity-0 group-hover:opacity-100 transition-all px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-100 hover:bg-violet-200 rounded-lg">
                  Detalhes
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <span class="text-xs text-slate-500 font-medium">Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex gap-1">
          <button @click="loadOrders(currentPage - 1)" :disabled="currentPage === 1"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium">‹</button>
          <button v-for="p in pageRange" :key="p" @click="loadOrders(p)"
            :class="['w-8 h-8 rounded-xl text-sm font-semibold transition-all', p === currentPage ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:shadow-sm']">
            {{ p }}
          </button>
          <button @click="loadOrders(currentPage + 1)" :disabled="currentPage === totalPages"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-medium">›</button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <AppModal v-model="detailsOpen" title="Detalhes do Pedido">
      <div v-if="loadingDetail" class="py-16 flex items-center justify-center">
        <div class="animate-spin w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="selectedOrder" class="space-y-5">
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-3.5">
            <p class="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-1">Pedido</p>
            <p class="text-sm font-mono font-black text-slate-900">{{ selectedOrder.orderNumber }}</p>
          </div>
          <div class="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-3.5">
            <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Total</p>
            <p class="text-sm font-black text-emerald-700">{{ formatPrice(selectedOrder.totalAmount) }}</p>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
            <p class="text-sm font-semibold text-slate-900">{{ selectedOrder.customerName }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ selectedOrder.customerEmail }}</p>
          </div>
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Data</p>
            <p class="text-sm text-slate-700 font-medium">{{ formatDate(selectedOrder.createdAt) }}</p>
          </div>
        </div>

        <div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Itens do Pedido</p>
          <div class="space-y-2">
            <div v-for="item in selectedOrder.items" :key="item.id" class="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
              <div class="w-11 h-11 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-slate-200 shadow-sm">
                <img v-if="item.product?.coverImageUrl" :src="item.product.coverImageUrl" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ item.productName }}</p>
                <p class="text-xs text-slate-400">Qtd: {{ item.quantity }} · {{ formatPrice(item.unitPrice) }}</p>
              </div>
              <div v-if="item.downloadTokens?.length" class="text-right flex-shrink-0">
                <p v-for="t in item.downloadTokens" :key="t.id" class="text-xs">
                  <span :class="t.downloadCount >= t.maxDownloads ? 'text-red-500 font-bold' : 'text-emerald-600 font-bold'">{{ t.downloadCount }}</span>
                  <span class="text-slate-400">/{{ t.maxDownloads }} downloads</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reconcile individual order -->
        <div v-if="selectedOrder.status === 'AWAITING_PAYMENT'" class="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <p class="text-xs font-bold text-amber-700 mb-2">Pagamento não reconhecido automaticamente?</p>
          <button @click="reconcileOrder(selectedOrder.id)" :disabled="reconciling"
            class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50">
            <svg :class="['w-3.5 h-3.5', reconciling && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            {{ reconciling ? 'Verificando...' : 'Verificar Pagamento Agora' }}
          </button>
        </div>

        <div>
          <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Alterar Status Manualmente</p>
          <div class="flex flex-wrap gap-2">
            <button v-for="s in statusOptions" :key="s.value"
              @click="updateStatus(selectedOrder.id, s.value)"
              :disabled="selectedOrder.status === s.value || updatingStatus"
              :class="['px-4 py-2 rounded-xl text-xs font-bold transition-all', selectedOrder.status === s.value ? s.activeClass : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50']">
              {{ s.label }}
            </button>
          </div>
          <p class="text-xs text-slate-400 mt-2">⚠️ "Marcar Pago" libera downloads e notifica via Telegram.</p>
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
const dateFilter = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const detailsOpen = ref(false);
const loadingDetail = ref(false);
const selectedOrder = ref<any>(null);
const updatingStatus = ref(false);
const reconciling = ref(false);
const reconcileMsg = ref<{ ok: boolean; text: string } | null>(null);

const statusFilters = [
  { value: '', label: 'Todos', activeClass: 'bg-slate-800 text-white' },
  { value: 'PAID', label: '✓ Pagos', activeClass: 'bg-emerald-600 text-white' },
  { value: 'AWAITING_PAYMENT', label: '⏳ Aguardando', activeClass: 'bg-amber-500 text-white' },
  { value: 'CANCELLED', label: '✕ Cancelados', activeClass: 'bg-red-500 text-white' },
  { value: 'EXPIRED', label: 'Expirados', activeClass: 'bg-slate-500 text-white' },
];
const dateFilters = [
  { value: '', label: 'Todos', activeClass: 'bg-violet-600 text-white' },
  { value: 'day', label: 'Dia', activeClass: 'bg-violet-600 text-white' },
  { value: 'week', label: 'Semana', activeClass: 'bg-violet-600 text-white' },
  { value: 'month', label: 'Mês', activeClass: 'bg-violet-600 text-white' },
  { value: 'year', label: 'Ano', activeClass: 'bg-violet-600 text-white' },
];
const statusOptions = [
  { value: 'AWAITING_PAYMENT', label: 'Aguardando', activeClass: 'bg-amber-100 text-amber-700' },
  { value: 'PAID', label: 'Marcar Pago', activeClass: 'bg-emerald-100 text-emerald-700' },
  { value: 'CANCELLED', label: 'Cancelar', activeClass: 'bg-red-100 text-red-600' },
  { value: 'EXPIRED', label: 'Expirar', activeClass: 'bg-slate-200 text-slate-600' },
];
const pageRange = computed(() => {
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function formatPrice(p: number) { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p)); }
function formatDate(d: string) { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function setStatusFilter(val: string) { statusFilter.value = val; loadOrders(1); }
function setDateFilter(val: string) { dateFilter.value = val; loadOrders(1); }

let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedLoad() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => loadOrders(1), 400); }

async function loadOrders(page = 1) {
  const limit = 20;
  const from = (page - 1) * limit;
  let q = supabase.from('orders').select('*, profiles(name), order_items(product_name, quantity, unit_price)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (statusFilter.value) q = q.eq('status', statusFilter.value);
  if (search.value) q = q.or(`order_number.ilike.%${search.value}%,customer_email.ilike.%${search.value}%,customer_name.ilike.%${search.value}%`);
  if (dateFilter.value) {
    const now = new Date();
    let dateFrom: string;
    if (dateFilter.value === 'day') dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    else if (dateFilter.value === 'week') dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    else if (dateFilter.value === 'month') dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    else dateFrom = new Date(now.getFullYear(), 0, 1).toISOString();
    q = q.gte('created_at', dateFrom);
  }
  const { data, count } = await q;
  orders.value = (data ?? []).map((o: any) => ({
    ...o, orderNumber: o.order_number, totalAmount: o.total_amount, customerName: o.customer_name, createdAt: o.created_at,
    items: (o.order_items ?? []).map((i: any) => ({ ...i, productName: i.product_name, unitPrice: i.unit_price })),
  }));
  totalPages.value = Math.ceil((count ?? 0) / limit);
  currentPage.value = page;
}

async function openDetails(id: string) {
  detailsOpen.value = true; loadingDetail.value = true; selectedOrder.value = null;
  try {
    const { data } = await supabase.from('orders').select('*, profiles(*), order_items(*, products(id, name, cover_image_url), download_tokens(*))').eq('id', id).single();
    if (data) selectedOrder.value = {
      ...data, orderNumber: data.order_number, totalAmount: data.total_amount,
      customerName: data.customer_name, customerEmail: data.customer_email, createdAt: data.created_at,
      items: (data.order_items ?? []).map((i: any) => ({
        ...i, productName: i.product_name, unitPrice: i.unit_price,
        product: i.products ? { coverImageUrl: i.products.cover_image_url } : null,
        downloadTokens: (i.download_tokens ?? []).map((t: any) => ({ ...t, downloadCount: t.download_count, maxDownloads: t.max_downloads })),
      })),
    };
  } finally { loadingDetail.value = false; }
}

async function updateStatus(id: string, status: string) {
  updatingStatus.value = true;
  try {
    if (status === 'PAID') {
      // Use reconcile-orders to properly process payment (creates download tokens, notifies Telegram)
      await reconcileOrder(id);
      return;
    }
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    selectedOrder.value = { ...selectedOrder.value, status };
    await loadOrders(currentPage.value);
  } finally { updatingStatus.value = false; }
}

async function reconcileOrder(orderId: string) {
  reconciling.value = true;
  reconcileMsg.value = null;
  try {
    const { error } = await supabase.functions.invoke('reconcile-orders', { body: { orderId } });
    if (error) throw error;
    await loadOrders(currentPage.value);
    if (selectedOrder.value) await openDetails(selectedOrder.value.id);
    reconcileMsg.value = { ok: true, text: 'Verificação concluída. Status atualizado conforme o Mercado Pago.' };
  } catch (e: any) {
    reconcileMsg.value = { ok: false, text: 'Erro ao verificar pagamento. Tente novamente.' };
  } finally {
    reconciling.value = false;
    setTimeout(() => { reconcileMsg.value = null; }, 6000);
  }
}

async function reconcileAll() {
  reconciling.value = true;
  reconcileMsg.value = null;
  try {
    const { error } = await supabase.functions.invoke('reconcile-orders', { body: {} });
    if (error) throw error;
    await loadOrders(currentPage.value);
    reconcileMsg.value = { ok: true, text: 'Todos os pedidos pendentes foram verificados junto ao Mercado Pago.' };
  } catch (e: any) {
    reconcileMsg.value = { ok: false, text: 'Erro ao reconciliar. Tente novamente.' };
  } finally {
    reconciling.value = false;
    setTimeout(() => { reconcileMsg.value = null; }, 6000);
  }
}

onMounted(() => loadOrders());
</script>
