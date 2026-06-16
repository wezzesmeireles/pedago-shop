<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Pedidos</h1>
        <p class="text-sm text-slate-500 mt-0.5">Acompanhe e gerencie todos os pedidos</p>
      </div>
      <button @click="reconcileAll" :disabled="reconciling"
        :class="['inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all',
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
      <div class="ml-auto flex items-center gap-2">
        <span v-if="loadingOrders" class="text-xs text-slate-400 animate-pulse">Carregando...</span>
        <span v-else class="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">{{ totalCount }} pedido{{ totalCount !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Pedidos Filtrados por Data (estilo Dashboard) -->
    <div v-if="dateFilter" class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
        <div class="flex items-center gap-3">
          <h2 class="font-bold text-slate-900">Pedidos - {{ dateFilterLabel }}</h2>
          <span class="text-xs text-violet-600 font-bold bg-violet-50 px-2 py-1 rounded-full">{{ dateFilterModalOrders.length }} pedido{{ dateFilterModalOrders.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="text-right">
          <p class="text-lg font-black text-violet-600">{{ formatPrice(dateFilterModalOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)) }}</p>
          <p class="text-xs text-slate-400">total</p>
        </div>
      </div>
      <div v-if="loadingDateFilterModal" class="divide-y divide-slate-50">
        <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-6 py-4 animate-pulse">
          <div class="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0"></div>
          <div class="flex-1 space-y-2"><div class="h-3 bg-slate-100 rounded w-32"></div><div class="h-2.5 bg-slate-50 rounded w-20"></div></div>
          <div class="w-16 h-4 bg-slate-100 rounded"></div>
        </div>
      </div>
      <div v-else class="divide-y divide-slate-50">
        <div v-for="order in dateFilterModalOrders" :key="order.id"
          class="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition-colors cursor-pointer"
          @click="openDetails(order.id)">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 text-sm font-bold flex-shrink-0">
            {{ (order.customerName ?? '?')[0]?.toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-800 truncate">{{ order.customerName }}</p>
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-xs text-slate-400 font-mono">{{ order.orderNumber }}</p>
            <span v-if="order.paymentMethod" :class="[
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              order.paymentMethod === 'PIX' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            ]">
              {{ order.paymentMethod === 'PIX' ? '💠 PIX' : '💳 Cartão' }}
            </span>
          </div>
          </div>
          <div class="text-right flex-shrink-0 space-y-1">
            <p class="text-sm font-bold text-slate-900">{{ formatPrice(order.totalAmount) }}</p>
            <StatusBadge :status="order.status" />
          </div>
        </div>
        <div v-if="!dateFilterModalOrders.length" class="px-6 py-12 text-center">
          <div class="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <p class="text-sm text-slate-400">Nenhum pedido encontrado</p>
        </div>
      </div>
    </div>

    <!-- Mobile Cards (md:hidden) - only show when no date filter -->
    <div v-if="!dateFilter" class="md:hidden space-y-3">
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
        <div class="flex items-center gap-2 mb-2 flex-wrap">
          <StatusBadge :status="order.status" />
          <span v-if="order.paymentMethod" :class="[
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            order.paymentMethod === 'PIX' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
          ]">
            {{ order.paymentMethod === 'PIX' ? '💠 PIX' : '💳 Cartão' }}
          </span>
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

    <!-- Desktop Table (hidden md:block) - only show when no date filter -->
    <div v-if="!dateFilter" class="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pedido</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Produtos</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Pagamento</th>
              <th class="text-left px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Data</th>
              <th class="px-4 py-3.5 w-24"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="orders.length === 0">
              <td colspan="8" class="px-5 py-16 text-center">
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
                <span v-if="order.paymentMethod" :class="[
                  'text-[10px] font-bold px-2 py-1 rounded-full',
                  order.paymentMethod === 'PIX' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                ]">
                  {{ order.paymentMethod === 'PIX' ? '💠 PIX' : '💳 Cartão' }}
                </span>
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
      <div v-else-if="selectedOrder" class="space-y-4">

        <!-- ── Cabeçalho: número + status + data ── -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-mono font-black text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-xl">{{ selectedOrder.orderNumber }}</span>
            <StatusBadge :status="selectedOrder.status" />
            <span v-if="selectedOrder.guestPhone" class="text-[11px] bg-violet-100 text-violet-700 font-black px-2 py-1 rounded-full">🔰 Compra Rápida</span>
          </div>
          <span class="text-xs text-slate-400 font-medium">{{ formatDate(selectedOrder.createdAt) }}</span>
        </div>

        <!-- ── Cliente + Pagamento ── -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <!-- Cliente -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cliente</p>
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-700 text-sm font-black flex-shrink-0">
                {{ (selectedOrder.customerName ?? '?')[0]?.toUpperCase() }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900 truncate">{{ selectedOrder.customerName || '—' }}</p>
                <p class="text-xs text-slate-400 truncate">{{ selectedOrder.customerEmail || '—' }}</p>
              </div>
            </div>
            <div v-if="selectedOrder.guestPhone" class="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-lg px-2.5 py-2">
              <svg class="w-3.5 h-3.5 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span class="text-xs font-mono font-bold text-violet-700">{{ selectedOrder.guestPhone }}</span>
            </div>
            <div v-if="selectedOrder.meta?.buyerIp" class="space-y-1">
              <div class="flex items-center gap-1.5">
                <svg class="w-3 h-3 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="1.5"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                <span class="text-[11px] font-mono text-slate-400">{{ selectedOrder.meta.buyerIp }}</span>
              </div>
            </div>
          </div>

          <!-- Pagamento -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pagamento</p>
            <div class="flex items-center gap-2 flex-wrap">
              <span v-if="selectedOrder.paymentMethod === 'PIX'" class="text-[11px] bg-emerald-100 text-emerald-700 font-black px-2.5 py-1 rounded-full">💠 PIX</span>
              <span v-else-if="selectedOrder.paymentMethod === 'CREDIT_CARD'" class="text-[11px] bg-blue-100 text-blue-700 font-black px-2.5 py-1 rounded-full">💳 Cartão</span>
              <span v-else-if="selectedOrder.paymentMethod === 'FREE'" class="text-[11px] bg-teal-100 text-teal-700 font-black px-2.5 py-1 rounded-full">🎁 Gratuito</span>
              <span class="text-base font-black text-violet-600">{{ formatPrice(selectedOrder.totalAmount) }}</span>
            </div>
            <div class="space-y-1.5 text-xs">
              <div v-if="selectedOrder.paidAt" class="flex items-center gap-2">
                <span class="text-slate-400 w-20 flex-shrink-0">Pago em</span>
                <span class="font-semibold text-emerald-700">{{ formatDate(selectedOrder.paidAt) }}</span>
              </div>
              <div v-if="selectedOrder.expiresAt && selectedOrder.status === 'AWAITING_PAYMENT'" class="flex items-center gap-2">
                <span class="text-slate-400 w-20 flex-shrink-0">Expira</span>
                <span class="font-semibold text-amber-600">{{ formatDate(selectedOrder.expiresAt) }}</span>
              </div>
              <div v-if="selectedOrder.mpPaymentId" class="flex items-center gap-2">
                <span class="text-slate-400 w-20 flex-shrink-0">ID MP</span>
                <span class="font-mono text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-[11px] truncate max-w-[120px]">{{ selectedOrder.mpPaymentId }}</span>
                <button @click="copyText(selectedOrder.mpPaymentId)" class="text-violet-500 hover:text-violet-700 font-bold text-[10px] flex-shrink-0 transition-colors">{{ copiedId === selectedOrder.mpPaymentId ? '✓' : 'Copiar' }}</button>
              </div>
              <div v-if="selectedOrder.mpStatus" class="flex items-center gap-2">
                <span class="text-slate-400 w-20 flex-shrink-0">Status MP</span>
                <span class="font-mono text-slate-600">{{ selectedOrder.mpStatus }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Itens do Pedido ── -->
        <div>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Itens do Pedido</p>
          <div class="space-y-2">
            <div v-for="item in selectedOrder.items" :key="item.id" class="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-slate-200 shadow-sm">
                  <img v-if="item.product?.coverImageUrl" :src="item.product.coverImageUrl" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-900 truncate">{{ item.productName }}</p>
                  <p class="text-xs text-slate-400">Qtd: {{ item.quantity }} · {{ formatPrice(item.unitPrice) }}</p>
                </div>
                <div class="text-right flex-shrink-0 space-y-1">
                  <div v-if="item.downloadTokens?.length">
                    <p v-for="t in item.downloadTokens" :key="t.id" class="text-xs whitespace-nowrap">
                      <span :class="t.downloadCount > 0 ? 'text-violet-600 font-bold' : 'text-slate-400'">{{ t.downloadCount }}</span>
                      <span class="text-slate-300"> / {{ t.maxDownloads === 999999 ? '∞' : t.maxDownloads }}</span>
                      <span class="text-slate-400"> dl</span>
                    </p>
                  </div>
                  <span v-else-if="item.downloadTokens !== undefined" class="text-[10px] text-amber-500 font-bold">Sem token</span>
                </div>
              </div>
              <!-- Delivery link se existir -->
              <div v-if="item.downloadTokens?.some((t: any) => t.deliveryLink)" class="mt-2 pt-2 border-t border-slate-100">
                <a v-for="t in item.downloadTokens.filter((t: any) => t.deliveryLink)" :key="t.id"
                  :href="t.deliveryLink" target="_blank" rel="noopener"
                  class="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium truncate max-w-full">
                  <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                  {{ t.deliveryLink }}
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Ações ── -->
        <div class="space-y-3 pt-1">
          <!-- Reemitir download -->
          <div v-if="selectedOrder.status === 'PAID'" class="bg-violet-50 border border-violet-100 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs text-violet-700 font-semibold">Cliente não consegue baixar?</p>
            <div class="flex items-center gap-2 flex-wrap">
              <button @click="reissueOrder(selectedOrder.id)" :disabled="reissuing"
                class="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                {{ reissuing ? 'Reemitindo...' : 'Reemitir download' }}
              </button>
              <p v-if="reissueMsg" class="text-xs text-emerald-700 font-medium">{{ reissueMsg }}</p>
            </div>
          </div>

          <!-- Verificar pagamento -->
          <div v-if="selectedOrder.status === 'AWAITING_PAYMENT'" class="bg-amber-50 border border-amber-100 rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <p class="text-xs text-amber-700 font-semibold">Pagamento não reconhecido automaticamente?</p>
            <button @click="reconcileOrder(selectedOrder.id)" :disabled="reconciling"
              class="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all disabled:opacity-50">
              <svg :class="['w-3.5 h-3.5', reconciling && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ reconciling ? 'Verificando...' : 'Verificar Pagamento' }}
            </button>
          </div>

          <!-- Alterar status -->
          <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Alterar Status</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in statusOptions" :key="s.value"
                @click="updateStatus(selectedOrder.id, s.value)"
                :disabled="selectedOrder.status === s.value || updatingStatus"
                :class="['px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed',
                  selectedOrder.status === s.value ? s.activeClass : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40']">
                {{ s.label }}
              </button>
            </div>
            <p class="text-[11px] text-slate-400 mt-2">⚠️ "Marcar Pago" libera downloads e notifica via Telegram.</p>
          </div>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { invokeFunction } from '@/services/api';
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
const reissuing = ref(false);
const reissueMsg = ref('');
const copiedId = ref('');
const loadingOrders = ref(false);
const totalCount = ref(0);
const dateFilterModalOrders = ref<any[]>([]);
const loadingDateFilterModal = ref(false);

const dateFilterLabel = computed(() => {
  const labels: Record<string, string> = { day: 'hoje', week: 'esta semana', month: 'este mês', year: 'este ano' };
  return labels[dateFilter.value] || dateFilter.value;
});

function mapOrder(o: any) {
  return {
    ...o,
    id: o.$id,
    orderNumber: o.orderNumber,
    totalAmount: o.totalAmount,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    createdAt: o.$createdAt,
    paymentMethod: o.paymentMethod,
    items: (o.items ?? []).map((i: any) => ({
      ...i,
      id: i.$id,
      productName: i.productName,
      unitPrice: i.unitPrice,
    })),
  };
}

async function openDateFilterModal() {
  loadingDateFilterModal.value = true;
  try {
    const dateFrom = getDateFrom();
    const queries: any[] = [Query.orderDesc('$createdAt'), Query.limit(500)];
    if (statusFilter.value) queries.push(Query.equal('status', statusFilter.value));
    if (dateFrom) queries.push(Query.greaterThanEqual('$createdAt', dateFrom));

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, queries);
    dateFilterModalOrders.value = result.documents.map(mapOrder);
  } finally {
    loadingDateFilterModal.value = false;
  }
}

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
function getDateFrom(): string | null {
  const now = new Date();
  if (dateFilter.value === 'day') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (dateFilter.value === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (dateFilter.value === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (dateFilter.value === 'year') {
    const d = new Date(now.getFullYear(), 0, 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  return null;
}

function setStatusFilter(val: string) { statusFilter.value = val; dateFilterModalOrders.value = []; loadOrders(1); }
function setDateFilter(val: string) { dateFilter.value = val; loadOrders(1); openDateFilterModal(); }

let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedLoad() { clearTimeout(searchTimeout); searchTimeout = setTimeout(() => loadOrders(1), 400); }

async function loadOrders(page = 1) {
  loadingOrders.value = true;
  try {
    const limit = 20;
    const offset = (page - 1) * limit;
    const dateFrom = getDateFrom();

    const queries: any[] = [Query.orderDesc('$createdAt'), Query.limit(limit), Query.offset(offset)];
    if (statusFilter.value) queries.push(Query.equal('status', statusFilter.value));
    if (search.value) queries.push(Query.or([
      Query.startsWith('orderNumber', search.value),
      Query.startsWith('customerEmail', search.value),
      Query.search('customerName', search.value),
    ]));
    if (dateFrom) queries.push(Query.greaterThanEqual('$createdAt', dateFrom));

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, queries);
    const mapped = result.documents.map(mapOrder) as any[];

    // Enrich with order_items so product names render in the list
    const orderIds = result.documents.map((o) => o.$id);
    if (orderIds.length) {
      const itemsResult = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [
        Query.equal('orderId', orderIds),
        Query.limit(500),
      ]);
      const byOrder: Record<string, any[]> = {};
      for (const it of itemsResult.documents) {
        (byOrder[it.orderId] ??= []).push({ id: it.$id, productName: it.productName, quantity: it.quantity });
      }
      for (const o of mapped) o.items = byOrder[o.id] ?? [];
    }

    orders.value = mapped as any;
    totalCount.value = result.total;
    totalPages.value = Math.ceil(result.total / limit);
    currentPage.value = page;
  } catch (e: any) {
    // Don't let a failed query silently freeze the list (e.g. a missing
    // fulltext index returning 400). Surface it and reset the view.
    orders.value = [] as any;
    totalCount.value = 0;
    totalPages.value = 1;
    reconcileMsg.value = { ok: false, text: 'Erro ao buscar pedidos. Tente um termo diferente.' };
    setTimeout(() => { reconcileMsg.value = null; }, 6000);
    console.error('loadOrders failed:', e?.message ?? e);
  } finally {
    loadingOrders.value = false;
  }
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text).catch(() => {});
  copiedId.value = text;
  setTimeout(() => { if (copiedId.value === text) copiedId.value = ''; }, 2000);
}

async function openDetails(id: string) {
  detailsOpen.value = true; loadingDetail.value = true; selectedOrder.value = null; reissueMsg.value = '';
  try {
    const order = await databases.getDocument(DB_ID, COLLECTIONS.ORDERS, id);
    // Parse metadata JSON (IP, QR code, etc.)
    let meta: Record<string, any> = {};
    try { meta = JSON.parse((order as any).metadata ?? '{}'); } catch {}

    // Load order items with download tokens
    const itemsResult = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [
      Query.equal('orderId', id),
      Query.limit(50),
    ]);
    const itemsWithTokens = await Promise.all(itemsResult.documents.map(async (item: any) => {
      const tokensResult = await databases.listDocuments(DB_ID, COLLECTIONS.DOWNLOAD_TOKENS, [
        Query.equal('orderItemId', item.$id),
        Query.limit(10),
      ]);
      let product = null;
      if (item.productId) {
        try {
          const p = await databases.getDocument(DB_ID, COLLECTIONS.PRODUCTS, item.productId);
          product = { coverImageUrl: p.coverImageUrl };
        } catch {}
      }
      return {
        ...item,
        id: item.$id,
        productName: item.productName,
        unitPrice: item.unitPrice,
        product,
        downloadTokens: tokensResult.documents.map((t: any) => ({
          ...t,
          id: t.$id,
          downloadCount: t.downloadCount,
          maxDownloads: t.maxDownloads,
          deliveryLink: t.deliveryLink ?? null,
        })),
      };
    }));
    selectedOrder.value = {
      ...order,
      id: order.$id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      guestPhone: (order as any).guestPhone ?? null,
      paymentMethod: (order as any).paymentMethod ?? null,
      mpPaymentId: (order as any).mpPaymentId ?? null,
      mpPreferenceId: (order as any).mpPreferenceId ?? null,
      mpStatus: (order as any).mpStatus ?? null,
      paidAt: (order as any).paidAt ?? null,
      expiresAt: (order as any).expiresAt ?? null,
      userId: (order as any).userId ?? null,
      meta,
      createdAt: order.$createdAt,
      items: itemsWithTokens,
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
    await databases.updateDocument(DB_ID, COLLECTIONS.ORDERS, id, { status });
    selectedOrder.value = { ...selectedOrder.value, status };
    await loadOrders(currentPage.value);
  } finally { updatingStatus.value = false; }
}

async function reissueOrder(orderId: string) {
  reissuing.value = true; reissueMsg.value = '';
  try {
    const r = await invokeFunction<any>('admin-ops', { action: 'reissue', orderId });
    const n = (r.items ?? []).filter((i: any) => i.token || i.deliveryLink).length;
    await openDetails(orderId);
    reissueMsg.value = `✓ Entrega garantida (${n} item(s)). Peça à cliente para abrir "Meus Downloads".`;
  } catch (e: any) {
    reissueMsg.value = 'Erro: ' + (e?.message ?? e);
  } finally {
    reissuing.value = false;
  }
}

async function reconcileOrder(orderId: string) {
  reconciling.value = true;
  reconcileMsg.value = null;
  try {
    await invokeFunction('reconcile-orders', { orderId });
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
    await invokeFunction('reconcile-orders', {});
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

// Under <KeepAlive>: refresh quietly on every revisit (skip the first, which
// onMounted already handled). The visible list stays until new data arrives.
let firstActivation = true;
onActivated(() => {
  if (firstActivation) { firstActivation = false; return; }
  loadOrders(currentPage.value);
});
</script>
