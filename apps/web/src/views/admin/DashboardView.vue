<template>
  <div class="space-y-6">

    <!-- ── Greeting ──────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="text-2xl font-black text-slate-900">{{ greeting }}, {{ firstName }} 👋</h1>
        <p class="text-sm text-slate-500 mt-0.5">{{ dateLabel }} · Resumo da sua loja</p>
      </div>
      <RouterLink to="/admin/produtos"
        class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 self-start sm:self-auto">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Novo Produto
      </RouterLink>
    </div>

    <!-- ── Stat Cards ─────────────────────────────────────────── -->
    <div v-if="loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse h-32"></div>
    </div>

    <div v-else class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div class="relative bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-violet-500/20">
        <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none"></div>
        <div class="absolute -bottom-6 -right-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none"></div>
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Receita Total</p>
          <p class="text-xl sm:text-2xl font-black truncate">{{ formatPrice(stats.revenue.total) }}</p>
          <p class="text-white/60 text-xs mt-1"><span class="text-emerald-300 font-semibold">{{ formatPrice(stats.revenue.month) }}</span> este mês</p>
        </div>
      </div>

      <div class="relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-emerald-500/20">
        <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none"></div>
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <p class="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Pedidos Pagos</p>
          <p class="text-2xl font-black">{{ stats.orders.total }}</p>
          <p class="text-white/60 text-xs mt-1"><span class="text-emerald-200 font-semibold">{{ stats.orders.month }}</span> este mês</p>
        </div>
      </div>

      <div class="relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-amber-500/20">
        <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none"></div>
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Aguardando</p>
          <p class="text-2xl font-black">{{ stats.orders.pending }}</p>
          <p class="text-white/60 text-xs mt-1">pedidos pendentes</p>
        </div>
      </div>

      <div class="relative bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white overflow-hidden shadow-lg shadow-sky-500/20">
        <div class="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10 pointer-events-none"></div>
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          </div>
          <p class="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Clientes</p>
          <p class="text-2xl font-black">{{ stats.users.total }}</p>
          <p class="text-white/60 text-xs mt-1">cadastrados</p>
        </div>
      </div>
    </div>

    <!-- ── Gráfico + Ações Rápidas ────────────────────────────── -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <!-- Receita mensal bar chart -->
      <div class="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="font-bold text-slate-900">Receita Mensal</h2>
            <p class="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
          </div>
          <div class="text-right">
            <p class="text-lg font-black text-violet-600">{{ formatPrice(stats.revenue.month) }}</p>
            <p class="text-xs text-slate-400">este mês</p>
          </div>
        </div>
        <div v-if="monthlyChart.length" class="flex items-end gap-2 sm:gap-3 h-32">
          <div v-for="(m, i) in monthlyChart" :key="i" class="flex-1 flex flex-col items-center gap-1.5">
            <p class="text-[9px] sm:text-[10px] text-slate-500 font-medium text-center leading-tight">
              {{ m.value > 0 ? formatPriceShort(m.value) : '' }}
            </p>
            <div class="w-full rounded-t-lg transition-all duration-700 ease-out"
              :style="{ height: `${m.pct}%`, minHeight: '6px',
                background: i === monthlyChart.length - 1
                  ? 'linear-gradient(to top, #7c3aed, #a855f7)'
                  : 'linear-gradient(to top, #e2e8f0, #f1f5f9)' }">
            </div>
            <p class="text-[10px] text-slate-400 font-medium capitalize">{{ m.label }}</p>
          </div>
        </div>
        <div v-else class="h-32 flex items-center justify-center text-slate-300 text-sm">
          Sem dados ainda
        </div>
      </div>

      <!-- Ações Rápidas -->
      <div class="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 class="font-bold text-slate-900 mb-4">Ações Rápidas</h2>
        <div class="space-y-1.5">
          <RouterLink v-for="action in quickActions" :key="action.to" :to="action.to"
            class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', action.bg]">
              <span v-html="action.icon" :class="['w-4 h-4', action.color]"></span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800">{{ action.label }}</p>
              <p class="text-xs text-slate-400">{{ action.sub }}</p>
            </div>
            <svg class="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- ── Armazenamento Supabase ───────────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
          </div>
          <div>
            <h2 class="font-bold text-slate-900">Armazenamento Supabase</h2>
            <p class="text-xs text-slate-400 mt-0.5">Limite do plano gratuito: 1 GB</p>
          </div>
        </div>
        <button @click="loadStorage" :disabled="storageLoading"
          class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40">
          <svg :class="['w-4 h-4', storageLoading && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </button>
      </div>

      <div v-if="storageLoading" class="space-y-4 animate-pulse">
        <div class="h-4 bg-slate-100 rounded-full"></div>
        <div v-for="i in 3" :key="i" class="flex items-center gap-3">
          <div class="w-24 h-3 bg-slate-100 rounded"></div>
          <div class="flex-1 h-3 bg-slate-100 rounded-full"></div>
          <div class="w-16 h-3 bg-slate-100 rounded"></div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <!-- Total bar -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-sm font-semibold text-slate-700">Total usado</span>
            <span class="text-sm font-bold" :class="storagePct >= 90 ? 'text-red-600' : storagePct >= 70 ? 'text-amber-600' : 'text-slate-900'">
              {{ formatBytes(storageTotalBytes) }}
              <span class="text-xs font-normal text-slate-400"> / 1 GB</span>
            </span>
          </div>
          <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
              :style="{ width: `${Math.min(storagePct, 100)}%` }"
              :class="storagePct >= 90 ? 'bg-red-500' : storagePct >= 70 ? 'bg-amber-400' : 'bg-indigo-500'">
            </div>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs text-slate-400">{{ storagePct.toFixed(1) }}% utilizado</span>
            <span class="text-xs text-slate-400">{{ formatBytes(1073741824 - storageTotalBytes) }} livres</span>
          </div>
        </div>

        <!-- Per-bucket breakdown -->
        <div class="border-t border-slate-100 pt-4 space-y-3">
          <div v-for="bucket in storageBuckets" :key="bucket.name" class="flex items-center gap-3">
            <div class="w-28 flex-shrink-0">
              <p class="text-xs font-semibold text-slate-600 truncate">{{ bucket.label }}</p>
              <p class="text-[10px] text-slate-400">{{ bucket.count }} arquivo{{ bucket.count !== 1 ? 's' : '' }}</p>
            </div>
            <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full transition-all duration-700"
                :style="{ width: `${storageTotalBytes > 0 ? (bucket.bytes / storageTotalBytes) * 100 : 0}%` }"
                :class="bucket.color">
              </div>
            </div>
            <span class="w-16 text-right text-xs font-semibold text-slate-600 flex-shrink-0">{{ formatBytes(bucket.bytes) }}</span>
          </div>
        </div>

        <!-- Warning -->
        <div v-if="storagePct >= 70" :class="['flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium',
          storagePct >= 90 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700']">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          {{ storagePct >= 90 ? 'Armazenamento crítico! Faça upgrade do plano Supabase.' : 'Armazenamento acima de 70%. Considere fazer upgrade em breve.' }}
        </div>
      </div>
    </div>

    <!-- ── Últimos Pedidos + Mais Vendidos ────────────────────── -->
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <!-- Últimos Pedidos -->
      <div class="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 class="font-bold text-slate-900">Últimos Pedidos</h2>
          <RouterLink to="/admin/pedidos" class="text-xs text-violet-600 font-semibold hover:text-violet-700 flex items-center gap-1">
            Ver todos <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
        <div v-if="loading" class="divide-y divide-slate-50">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-6 py-4 animate-pulse">
            <div class="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0"></div>
            <div class="flex-1 space-y-2"><div class="h-3 bg-slate-100 rounded w-32"></div><div class="h-2.5 bg-slate-50 rounded w-20"></div></div>
            <div class="w-16 h-4 bg-slate-100 rounded"></div>
          </div>
        </div>
        <div v-else class="divide-y divide-slate-50">
          <div v-for="order in recentOrders" :key="order.id"
            class="flex items-center gap-3 px-6 py-4 hover:bg-slate-50/60 transition-colors">
            <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 text-sm font-bold flex-shrink-0">
              {{ (order.user?.name ?? order.customerName ?? '?')[0]?.toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ order.user?.name ?? order.customerName ?? 'Cliente' }}</p>
              <p class="text-xs text-slate-400 font-mono">{{ order.orderNumber }}</p>
            </div>
            <div class="text-right flex-shrink-0 space-y-1">
              <p class="text-sm font-bold text-slate-900">{{ formatPrice(order.totalAmount) }}</p>
              <StatusBadge :status="order.status" />
            </div>
          </div>
          <div v-if="!recentOrders.length" class="px-6 py-12 text-center">
            <div class="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <p class="text-sm text-slate-400">Nenhum pedido ainda</p>
          </div>
        </div>
      </div>

      <!-- Mais Vendidos -->
      <div class="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 class="font-bold text-slate-900">Mais Vendidos</h2>
          <RouterLink to="/admin/produtos" class="text-xs text-violet-600 font-semibold hover:text-violet-700 flex items-center gap-1">
            Ver todos <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
        <div v-if="loading" class="divide-y divide-slate-50">
          <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-6 py-4 animate-pulse">
            <div class="w-5 h-5 rounded-full bg-slate-100 flex-shrink-0"></div>
            <div class="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0"></div>
            <div class="flex-1 space-y-2"><div class="h-3 bg-slate-100 rounded w-28"></div><div class="h-2.5 bg-slate-50 rounded w-16"></div></div>
          </div>
        </div>
        <div v-else class="divide-y divide-slate-50">
          <div v-for="(product, i) in topProducts" :key="product.id"
            class="flex items-center gap-3 px-6 py-4 hover:bg-slate-50/60 transition-colors">
            <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0',
              i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400']">
              {{ i + 1 }}
            </div>
            <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
              <img v-if="product.coverImageUrl" :src="product.coverImageUrl" :alt="product.name" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 truncate">{{ product.name }}</p>
              <p class="text-xs text-slate-400">{{ product.salesCount }} venda{{ product.salesCount !== 1 ? 's' : '' }}</p>
            </div>
            <p class="text-sm font-bold text-violet-600 flex-shrink-0">{{ formatPrice(product.price) }}</p>
          </div>
          <div v-if="!topProducts.length" class="px-6 py-12 text-center">
            <p class="text-sm text-slate-400">Nenhum produto cadastrado</p>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const auth = useAuthStore();
const loading = ref(true);

const stats = ref({ revenue: { total: 0, month: 0 }, orders: { total: 0, month: 0, pending: 0 }, users: { total: 0 } });
const recentOrders = ref<any[]>([]);
const topProducts = ref<any[]>([]);
const monthlyRevenue = ref<{ label: string; value: number }[]>([]);

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? 'Admin');
const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
});
const dateLabel = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
);

const monthlyChart = computed(() => {
  const vals = monthlyRevenue.value.map(m => m.value);
  const max = Math.max(...vals, 1);
  return monthlyRevenue.value.map(m => ({ ...m, pct: Math.max((m.value / max) * 100, 4) }));
});

const quickActions = [
  { to: '/admin/produtos', label: 'Adicionar Produto', sub: 'Cadastrar novo produto', bg: 'bg-violet-100', color: 'text-violet-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>' },
  { to: '/admin/pedidos', label: 'Ver Pedidos', sub: 'Gerenciar todos os pedidos', bg: 'bg-emerald-100', color: 'text-emerald-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>' },
  { to: '/admin/categorias', label: 'Categorias', sub: 'Organizar categorias', bg: 'bg-orange-100', color: 'text-orange-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>' },
  { to: '/admin/customizar', label: 'Customizar Site', sub: 'Editar visual da loja', bg: 'bg-pink-100', color: 'text-pink-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>' },
];

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function formatPriceShort(p: number) {
  if (p >= 1000) return `R$${(p / 1000).toFixed(1)}k`;
  return `R$${p.toFixed(0)}`;
}

const sum = (rows: any[]) => (rows ?? []).reduce((s: number, r: any) => s + Number(r.total_amount), 0);

// ── Storage monitoring ──────────────────────────────────────
const PLAN_LIMIT_BYTES = 1073741824; // 1 GB free tier

interface BucketStat { name: string; label: string; color: string; bytes: number; count: number }
const storageLoading = ref(true);
const storageBuckets = ref<BucketStat[]>([
  { name: 'product-covers', label: 'Capas / Banners', color: 'bg-violet-500', bytes: 0, count: 0 },
  { name: 'product-previews', label: 'Pré-visualizações', color: 'bg-sky-500', bytes: 0, count: 0 },
  { name: 'product-files', label: 'Arquivos PDF', color: 'bg-emerald-500', bytes: 0, count: 0 },
]);

const storageTotalBytes = computed(() => storageBuckets.value.reduce((s, b) => s + b.bytes, 0));
const storagePct = computed(() => (storageTotalBytes.value / PLAN_LIMIT_BYTES) * 100);

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

async function listFolderSize(bucket: string, prefix: string): Promise<{ bytes: number; count: number }> {
  const { data } = await supabase.storage.from(bucket).list(prefix || undefined, { limit: 1000 });
  if (!data) return { bytes: 0, count: 0 };
  let bytes = 0, count = 0;
  await Promise.all(data.map(async item => {
    if (item.id) {
      bytes += (item.metadata as any)?.size ?? 0;
      count += 1;
    } else {
      const sub = await listFolderSize(bucket, prefix ? `${prefix}/${item.name}` : item.name);
      bytes += sub.bytes;
      count += sub.count;
    }
  }));
  return { bytes, count };
}

async function loadStorage() {
  storageLoading.value = true;
  try {
    await Promise.all(storageBuckets.value.map(async bucket => {
      const { bytes, count } = await listFolderSize(bucket.name, '');
      bucket.bytes = bytes;
      bucket.count = count;
    }));
  } catch (e) {
    console.error('Storage load error', e);
  } finally {
    storageLoading.value = false;
  }
}

onMounted(async () => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [{ data: totalRev }, { data: monthRev }, { count: totalOrders }, { count: monthOrders }, { count: pending }, { count: users }, { data: topProds }, { data: recent }] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('status', 'PAID'),
      supabase.from('orders').select('total_amount').eq('status', 'PAID').gte('paid_at', startOfMonth),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAID'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'PAID').gte('created_at', startOfMonth),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'AWAITING_PAYMENT'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER'),
      supabase.from('products').select('id, name, sales_count, cover_image_url, price').is('deleted_at', null).order('sales_count', { ascending: false }).limit(5),
      supabase.from('orders').select('*, profiles(name), order_items(product_name)').eq('status', 'PAID').order('paid_at', { ascending: false }).limit(6),
    ]);

    stats.value = {
      revenue: { total: sum(totalRev ?? []), month: sum(monthRev ?? []) },
      orders: { total: totalOrders ?? 0, month: monthOrders ?? 0, pending: pending ?? 0 },
      users: { total: users ?? 0 },
    };
    topProducts.value = (topProds ?? []).map((p: any) => ({ ...p, coverImageUrl: p.cover_image_url, salesCount: p.sales_count }));
    recentOrders.value = (recent ?? []).map((o: any) => ({ ...o, orderNumber: o.order_number, totalAmount: o.total_amount, user: o.profiles, customerName: o.customer_name }));

    // Monthly chart — last 6 months
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { label: d.toLocaleDateString('pt-BR', { month: 'short' }), start: d.toISOString(), end: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString() };
    });
    const revs = await Promise.all(months.map(m => supabase.from('orders').select('total_amount').eq('status', 'PAID').gte('paid_at', m.start).lt('paid_at', m.end)));
    monthlyRevenue.value = months.map((m, i) => ({ label: m.label, value: sum((revs[i]?.data ?? []) as any[]) }));
  } finally {
    loading.value = false;
  }

  // Load storage independently so it doesn't block the main stats
  loadStorage();
});
</script>
