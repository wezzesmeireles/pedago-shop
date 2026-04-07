<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-slate-900">Dashboard</h1>
      <p class="text-sm text-slate-500 mt-0.5">Visão geral da sua loja</p>
    </div>

    <!-- Stat cards skeleton -->
    <div v-if="loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div v-for="i in 4" :key="i" class="bg-white rounded-2xl p-5 border border-slate-200 animate-pulse">
        <div class="flex items-center justify-between mb-4">
          <div class="h-3 bg-slate-200 rounded w-24"></div>
          <div class="w-9 h-9 bg-slate-100 rounded-xl"></div>
        </div>
        <div class="h-7 bg-slate-200 rounded w-32 mb-2"></div>
        <div class="h-3 bg-slate-100 rounded w-20"></div>
      </div>
    </div>

    <div v-else>
      <!-- Stat cards -->
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl p-5 border border-slate-200 hover:border-slate-300 transition-colors">
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">{{ stat.label }}</p>
            <div :class="['w-9 h-9 rounded-xl flex items-center justify-center', stat.iconBg]">
              <span v-html="stat.icon" :class="['w-4.5 h-4.5', stat.iconColor]"></span>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-900 mb-1">{{ stat.value }}</p>
          <div class="flex items-center gap-1.5">
            <span v-if="stat.trend !== null" :class="['inline-flex items-center gap-0.5 text-xs font-semibold', stat.trend >= 0 ? 'text-emerald-600' : 'text-red-500']">
              <svg v-if="stat.trend >= 0" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
              <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
              {{ Math.abs(stat.trend) }}%
            </span>
            <span class="text-xs text-slate-400">{{ stat.sub }}</span>
          </div>
        </div>
      </div>

      <!-- Tables row -->
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <!-- Recent Orders -->
        <div class="xl:col-span-3 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 class="font-semibold text-slate-900 text-sm">Últimos Pedidos</h2>
            <RouterLink to="/admin/pedidos" class="text-xs text-violet-600 font-medium hover:text-violet-700">Ver todos →</RouterLink>
          </div>
          <div class="divide-y divide-slate-50">
            <div v-for="order in data?.recentOrders?.slice(0, 6)" :key="order.id"
              class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div class="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                {{ order.user?.name?.[0]?.toUpperCase() ?? '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 truncate">{{ order.user?.name ?? order.customerName }}</p>
                <p class="text-xs text-slate-400 font-mono">{{ order.orderNumber }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-sm font-bold text-slate-900">{{ formatPrice(order.totalAmount) }}</p>
                <StatusBadge :status="order.status" />
              </div>
            </div>
            <div v-if="!data?.recentOrders?.length" class="px-5 py-8 text-center text-slate-400 text-sm">
              Nenhum pedido ainda
            </div>
          </div>
        </div>

        <!-- Top Products -->
        <div class="xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 class="font-semibold text-slate-900 text-sm">Mais Vendidos</h2>
            <RouterLink to="/admin/produtos" class="text-xs text-violet-600 font-medium hover:text-violet-700">Ver produtos →</RouterLink>
          </div>
          <div class="divide-y divide-slate-50">
            <div v-for="(product, i) in data?.topProducts" :key="product.id"
              class="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              <span :class="['w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0', i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-600']">{{ i + 1 }}</span>
              <div class="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                <img v-if="product.coverImageUrl" :src="product.coverImageUrl" :alt="product.name" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-800 truncate">{{ product.name }}</p>
                <p class="text-xs text-slate-400">{{ product.salesCount }} venda{{ product.salesCount !== 1 ? 's' : '' }}</p>
              </div>
              <p class="text-sm font-bold text-violet-600 flex-shrink-0">{{ formatPrice(product.price) }}</p>
            </div>
            <div v-if="!data?.topProducts?.length" class="px-5 py-8 text-center text-slate-400 text-sm">
              Nenhum produto ainda
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const loading = ref(true);
const data = ref<any>(null);

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function trendPercent(current: number, last: number): number | null {
  if (!last) return null;
  return Math.round(((current - last) / last) * 100);
}

const iconRevenue = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
const iconOrders = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>';
const iconPending = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
const iconUsers = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>';

const stats = computed(() => {
  const d = data.value;
  return [
    {
      label: 'Receita Total',
      icon: iconRevenue,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      value: formatPrice(d?.revenue?.total ?? 0),
      trend: trendPercent(d?.revenue?.month ?? 0, d?.revenue?.lastMonth ?? 0),
      sub: 'vs mês anterior',
    },
    {
      label: 'Pedidos Pagos',
      icon: iconOrders,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      value: d?.orders?.total ?? 0,
      trend: null,
      sub: `${d?.orders?.month ?? 0} este mês`,
    },
    {
      label: 'Aguardando',
      icon: iconPending,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      value: d?.orders?.pending ?? 0,
      trend: null,
      sub: 'pedidos pendentes',
    },
    {
      label: 'Clientes',
      icon: iconUsers,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      value: d?.users?.total ?? 0,
      trend: null,
      sub: 'cadastrados',
    },
  ];
});

onMounted(async () => {
  try {
    const res = await api.get('/admin/dashboard');
    data.value = res.data;
  } finally {
    loading.value = false;
  }
});
</script>
