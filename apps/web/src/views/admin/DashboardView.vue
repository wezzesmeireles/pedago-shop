<template>
  <div class="relative">
    <!-- ── Playful decorative blobs ──────────────────────────── -->
    <div class="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <div class="absolute -top-12 -left-16 w-72 h-72 rounded-full bg-violet-300/40 blur-3xl"></div>
      <div class="absolute top-24 -right-24 w-80 h-80 rounded-full bg-pink-300/40 blur-3xl"></div>
      <div class="absolute top-[42%] left-1/4 w-72 h-72 rounded-full bg-amber-200/50 blur-3xl"></div>
      <div class="absolute bottom-16 right-1/4 w-72 h-72 rounded-full bg-teal-200/40 blur-3xl"></div>
    </div>

    <div class="relative space-y-6 dash-reveal">

    <!-- ── Greeting ──────────────────────────────────────────── -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="font-display text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {{ greeting }}, {{ firstName }} <span class="inline-block origin-[70%_80%] animate-wave">👋</span>
        </h1>
        <p class="text-sm text-slate-500 mt-1 font-medium">☀️ {{ dateLabel }} · um resumo fresquinho da sua loja</p>
      </div>
      <RouterLink to="/admin/produtos"
        class="font-display inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-sm font-bold px-5 py-3 rounded-full shadow-lg shadow-violet-500/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all self-start sm:self-auto">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Novo Produto
      </RouterLink>
    </div>

    <!-- ── Stat Cards ─────────────────────────────────────────── -->
    <div v-if="loading" class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-[1.75rem] p-5 border border-slate-100 animate-pulse h-36"></div>
    </div>

    <div v-else class="grid grid-cols-2 xl:grid-cols-4 gap-4 dash-stagger">
      <!-- Receita -->
      <div class="stat-card group bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-2xl shadow-violet-500/30">
        <div class="absolute -top-7 -right-7 w-28 h-28 rounded-full bg-white/15"></div>
        <div class="absolute -bottom-9 -left-5 w-24 h-24 rounded-full bg-white/10"></div>
        <div class="relative">
          <div class="stat-emoji">💰</div>
          <p class="stat-label">Receita</p>
          <p :class="['stat-num truncate', { 'opacity-60': revenueLoading }]"><CountUp :value="filteredRevenue" :format="formatPrice" /></p>
          <div class="flex items-center gap-1 mt-3">
            <button
              v-for="f in [{ key: 'day', label: 'Dia' }, { key: 'week', label: 'Semana' }, { key: 'month', label: 'Mês' }, { key: 'year', label: 'Ano' }]"
              :key="f.key"
              @click.stop="revenueFilter = f.key as any"
              :class="['text-[10px] font-bold px-2 py-0.5 rounded-full transition-all',
                revenueFilter === f.key ? 'bg-white text-violet-700' : 'bg-white/25 text-white/90 hover:bg-white/40']"
            >{{ f.label }}</button>
          </div>
        </div>
      </div>

      <!-- Pedidos Pagos -->
      <div class="stat-card group bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-500/30">
        <div class="absolute -top-7 -right-7 w-28 h-28 rounded-full bg-white/15"></div>
        <div class="relative">
          <div class="stat-emoji">🛍️</div>
          <p class="stat-label">Pedidos Pagos</p>
          <p class="stat-num"><CountUp :value="stats.orders.total" /></p>
          <p class="text-white/75 text-xs mt-1.5"><span class="text-white font-bold">+<CountUp :value="stats.orders.month" /></span> este mês</p>
        </div>
      </div>

      <!-- Aguardando -->
      <div class="stat-card group bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl shadow-amber-500/30">
        <div class="absolute -top-7 -right-7 w-28 h-28 rounded-full bg-white/15"></div>
        <div class="relative">
          <div class="stat-emoji">⏳</div>
          <p class="stat-label">Aguardando</p>
          <p class="stat-num"><CountUp :value="stats.orders.pending" /></p>
          <p class="text-white/75 text-xs mt-1.5">pedidos pendentes</p>
        </div>
      </div>

      <!-- Clientes -->
      <div class="stat-card group bg-gradient-to-br from-sky-400 to-blue-600 shadow-2xl shadow-sky-500/30">
        <div class="absolute -top-7 -right-7 w-28 h-28 rounded-full bg-white/15"></div>
        <div class="relative">
          <div class="stat-emoji">👥</div>
          <p class="stat-label">Clientes</p>
          <p class="stat-num"><CountUp :value="stats.users.total" /></p>
          <p class="text-white/75 text-xs mt-1.5">cadastrados</p>
        </div>
      </div>
    </div>

    <!-- ── Gráfico + Ações Rápidas ────────────────────────────── -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <!-- Receita/Pedidos — área interativa -->
      <div class="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
        <div class="flex items-start justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 class="font-bold text-slate-900">{{ chartMetric === 'revenue' ? 'Receita' : 'Pedidos' }} por mês</h2>
            <div class="flex items-center gap-2 mt-1">
              <p class="text-2xl font-black text-slate-900">{{ chartMetric === 'revenue' ? formatPrice(periodTotal) : Math.round(periodTotal) }}</p>
              <span v-if="growthPct !== null"
                :class="['inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full', growthPct >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600']">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" :d="growthPct >= 0 ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'" /></svg>
                {{ Math.abs(growthPct).toFixed(0) }}%
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">últimos {{ chartRange }} meses · vs. mês anterior</p>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <div class="flex bg-slate-100 rounded-full p-0.5 text-[11px] font-bold">
              <button @click="chartMetric = 'revenue'" :class="['px-3 py-1 rounded-full transition-all', chartMetric === 'revenue' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500']">Receita</button>
              <button @click="chartMetric = 'orders'" :class="['px-3 py-1 rounded-full transition-all', chartMetric === 'orders' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500']">Pedidos</button>
            </div>
            <div class="flex bg-slate-100 rounded-full p-0.5 text-[11px] font-bold">
              <button @click="chartRange = 6" :class="['px-3 py-1 rounded-full transition-all', chartRange === 6 ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500']">6M</button>
              <button @click="chartRange = 12" :class="['px-3 py-1 rounded-full transition-all', chartRange === 12 ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500']">12M</button>
            </div>
          </div>
        </div>

        <div v-if="revenueLoading && !paidOrders.length" class="h-44 rounded-xl bg-slate-50 animate-pulse"></div>

        <div v-else-if="paidOrders.length" class="relative select-none">
          <svg :viewBox="`0 0 ${CHART_W} ${CHART_H}`" class="w-full h-auto overflow-visible" @mouseleave="hoverIndex = null">
            <defs>
              <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.32" />
                <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0" />
              </linearGradient>
            </defs>
            <line v-for="(g, k) in gridLines" :key="'g' + k" x1="0" :x2="CHART_W" :y1="g.y" :y2="g.y" stroke="#f1f5f9" stroke-width="1" />
            <path :d="areaPath" fill="url(#dashArea)" />
            <path :d="linePath" fill="none" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            <line v-if="hoverIndex !== null" :x1="chartPoints[hoverIndex].x" :x2="chartPoints[hoverIndex].x" :y1="PAD_T" :y2="PAD_T + plotH" stroke="#c4b5fd" stroke-width="1.5" stroke-dasharray="4 3" />
            <circle v-for="p in chartPoints" :key="'d' + p.i" :cx="p.x" :cy="p.y" :r="hoverIndex === p.i ? 5.5 : 3.5"
              :fill="hoverIndex === p.i ? '#7c3aed' : '#fff'" stroke="#7c3aed" stroke-width="2.5" />
            <rect v-for="(p, i) in chartPoints" :key="'h' + i" :x="p.x - colW / 2" y="0" :width="colW" :height="CHART_H"
              fill="transparent" @mouseenter="hoverIndex = i" @touchstart.passive="hoverIndex = i" />
          </svg>

          <div class="flex justify-between px-1 mt-1.5">
            <span v-for="(m, i) in chartData" :key="'x' + i"
              :class="['text-[10px] font-medium capitalize', i === chartData.length - 1 ? 'text-violet-600 font-bold' : 'text-slate-400']">{{ m.label }}</span>
          </div>

          <div v-if="hoverIndex !== null"
            class="absolute z-10 pointer-events-none -translate-x-1/2 -translate-y-full bg-slate-900 text-white rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap"
            :style="{ left: (chartPoints[hoverIndex].x / CHART_W * 100) + '%', top: (chartPoints[hoverIndex].y / CHART_H * 100) + '%', marginTop: '-10px' }">
            <p class="text-[11px] font-bold capitalize leading-tight">{{ chartData[hoverIndex].monthYear }}</p>
            <p class="text-xs font-semibold">{{ formatPrice(chartData[hoverIndex].revenue) }}</p>
            <p class="text-[10px] text-slate-300">{{ chartData[hoverIndex].orders }} pedido{{ chartData[hoverIndex].orders !== 1 ? 's' : '' }}</p>
          </div>
        </div>
        <div v-else class="h-44 flex items-center justify-center text-slate-300 text-sm">Sem dados ainda</div>

        <!-- Insights -->
        <div class="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100">
          <div class="text-center">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Ticket médio</p>
            <p class="text-sm font-black text-slate-800 mt-0.5">{{ formatPrice(avgTicket) }}</p>
          </div>
          <div class="text-center border-x border-slate-100">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Média/mês</p>
            <p class="text-sm font-black text-slate-800 mt-0.5">{{ chartMetric === 'revenue' ? formatPrice(monthlyAvg) : Math.round(monthlyAvg) }}</p>
          </div>
          <div class="text-center">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Melhor mês</p>
            <p class="text-sm font-black text-slate-800 mt-0.5 capitalize">{{ bestMonth?.label ?? '—' }}</p>
          </div>
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

    <!-- ── Status dos Pedidos + Vendas por Categoria ─────────── -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <!-- Donut de status -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
        <h2 class="font-bold text-slate-900 mb-4">Status dos Pedidos</h2>
        <div class="flex items-center gap-5 sm:gap-6">
          <div class="relative flex-shrink-0">
            <svg width="124" height="124" viewBox="0 0 120 120" class="-rotate-90">
              <circle cx="60" cy="60" r="42" fill="none" stroke="#f1f5f9" stroke-width="15" />
              <circle v-for="(s, i) in statusSegments.items" :key="i" cx="60" cy="60" r="42" fill="none"
                :stroke="s.color" stroke-width="15"
                :stroke-dasharray="`${(s.frac * DONUT_C).toFixed(2)} ${DONUT_C.toFixed(2)}`"
                :stroke-dashoffset="`${(-s.offset * DONUT_C).toFixed(2)}`"
                class="transition-all duration-700" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-2xl font-black text-slate-900 leading-none">{{ statusSegments.total }}</span>
              <span class="text-[10px] text-slate-400 font-semibold mt-0.5">pedidos</span>
            </div>
          </div>
          <div class="flex-1 space-y-2.5">
            <div v-for="(s, i) in statusSegments.items" :key="i" class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ background: s.color }"></span>
              <span class="text-sm text-slate-600 flex-1">{{ s.label }}</span>
              <span class="text-sm font-bold text-slate-900">{{ s.value }}</span>
              <span class="text-xs text-slate-400 w-9 text-right">{{ (s.frac * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Vendas por categoria -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-slate-900">Vendas por Categoria</h2>
          <span class="text-xs text-slate-400">receita estimada</span>
        </div>
        <div v-if="!categoryChart.length" class="h-32 flex items-center justify-center text-slate-300 text-sm">Sem dados ainda</div>
        <div v-else class="space-y-3">
          <div v-for="c in categoryChart" :key="c.name">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs font-semibold text-slate-600 truncate pr-2">{{ c.name }}</span>
              <span class="text-xs font-bold text-slate-800 flex-shrink-0">{{ formatPrice(c.revenue) }} <span class="text-slate-400 font-normal">· {{ c.units }}</span></span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700" :style="{ width: c.pct + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Armazenamento ────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
      <div class="flex items-center justify-between mb-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/></svg>
          </div>
          <div>
            <h2 class="font-bold text-slate-900">Armazenamento</h2>
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
          {{ storagePct >= 90 ? 'Armazenamento crítico! Considere liberar arquivos ou fazer upgrade do plano.' : 'Armazenamento acima de 70%. Considere fazer upgrade em breve.' }}
        </div>
      </div>
    </div>

    <!-- ── WhatsApp ───────────────────────────────────────────── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#25D366">
            <svg class="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div>
            <h2 class="font-bold text-slate-900">WhatsApp</h2>
            <p v-if="whatsappNumber" class="text-sm text-slate-500 font-mono">+{{ whatsappNumber }}</p>
            <p v-else class="text-sm text-slate-400 italic">Número não configurado</p>
          </div>
        </div>
        <button v-if="!editingWhatsapp" @click="startEditWhatsapp"
          class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          Alterar número
        </button>
      </div>

      <!-- Inline edit form -->
      <div v-if="editingWhatsapp" class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div class="flex-1 relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono select-none">+</span>
          <input
            v-model="whatsappInput"
            type="tel"
            placeholder="5511999999999"
            class="w-full border border-emerald-300 rounded-xl pl-7 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
            @keydown.enter="saveWhatsapp"
            @keydown.esc="editingWhatsapp = false"
            autofocus
          />
        </div>
        <div class="flex gap-2">
          <button @click="saveWhatsapp" :disabled="savingWhatsapp"
            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
            <svg v-if="savingWhatsapp" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ savingWhatsapp ? 'Salvando...' : 'Salvar' }}
          </button>
          <button @click="editingWhatsapp = false"
            class="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
        </div>
      </div>
      <p v-if="whatsappSaved" class="mt-2 text-xs text-emerald-600 font-medium flex items-center gap-1">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        Número atualizado com sucesso!
      </p>
    </div>

    <!-- ── Últimos Pedidos + Mais Vendidos ────────────────────── -->
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <!-- Últimos Pedidos -->
      <div class="xl:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
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
            class="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition-colors">
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
        <div class="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
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
            class="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 hover:bg-slate-50/60 transition-colors">
            <div :class="['w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0',
              i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-200 text-slate-500' : i === 2 ? 'bg-orange-100 text-orange-500' : 'bg-slate-100 text-slate-400']">
              {{ i + 1 }}
            </div>
            <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
              <img v-if="product.coverImageUrl" :src="product.coverImageUrl" :alt="product.name" loading="lazy" decoding="async" class="w-full h-full object-cover" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { databases, storage, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuthStore } from '@/stores/auth.store';
import { useSiteConfigStore } from '@/stores/site-config.store';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import CountUp from '@/components/ui/CountUp.vue';

const auth = useAuthStore();
const siteConfigStore = useSiteConfigStore();
const loading = ref(true);
const revenueLoading = ref(true);

// ── WhatsApp ────────────────────────────────────────────────
const whatsappNumber = computed(() => siteConfigStore.config.socialLinks?.whatsapp ?? '');
const editingWhatsapp = ref(false);
const whatsappInput = ref('');
const savingWhatsapp = ref(false);
const whatsappSaved = ref(false);

function startEditWhatsapp() {
  whatsappInput.value = whatsappNumber.value;
  editingWhatsapp.value = true;
  whatsappSaved.value = false;
}

async function saveWhatsapp() {
  savingWhatsapp.value = true;
  try {
    await siteConfigStore.update({
      ...siteConfigStore.config,
      socialLinks: { ...siteConfigStore.config.socialLinks, whatsapp: whatsappInput.value.replace(/\D/g, '') },
    });
    editingWhatsapp.value = false;
    whatsappSaved.value = true;
    setTimeout(() => { whatsappSaved.value = false; }, 3000);
  } finally {
    savingWhatsapp.value = false;
  }
}

const revenueFilter = ref<'day' | 'week' | 'month' | 'year'>('month');
const stats = ref({ revenue: { total: 0, day: 0, week: 0, month: 0, year: 0 }, orders: { total: 0, month: 0, pending: 0, cancelled: 0 }, users: { total: 0 } });
const categorySales = ref<{ name: string; revenue: number; units: number }[]>([]);

const filteredRevenue = computed(() => {
  if (revenueFilter.value === 'day') return stats.value.revenue.day;
  if (revenueFilter.value === 'week') return stats.value.revenue.week;
  if (revenueFilter.value === 'year') return stats.value.revenue.year;
  return stats.value.revenue.month;
});
const recentOrders = ref<any[]>([]);
const topProducts = ref<any[]>([]);
const paidOrders = ref<any[]>([]);
const chartMetric = ref<'revenue' | 'orders'>('revenue');
const chartRange = ref<6 | 12>(6);
const hoverIndex = ref<number | null>(null);

const firstName = computed(() => auth.user?.name?.split(' ')[0] ?? 'Admin');
const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
});
const dateLabel = computed(() =>
  new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
);

// ── Receita/Pedidos por mês (área interativa) ───────────────
const chartData = computed(() => {
  const now = new Date();
  const n = chartRange.value;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (n - 1 - i), 1);
    const start = d.toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    let revenue = 0, orders = 0;
    for (const o of paidOrders.value) {
      if (o.paidAt && o.paidAt >= start && o.paidAt < end) { revenue += Number(o.totalAmount || 0); orders++; }
    }
    return {
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      monthYear: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      revenue, orders,
    };
  });
});
const chartValues = computed(() => chartData.value.map(m => chartMetric.value === 'revenue' ? m.revenue : m.orders));
const chartMax = computed(() => Math.max(...chartValues.value, 1));

// SVG geometry (uniform scaling — circles stay round)
const CHART_W = 640, CHART_H = 200, PAD_T = 18, PAD_B = 8, PAD_X = 8;
const plotH = CHART_H - PAD_T - PAD_B;
const plotW = CHART_W - PAD_X * 2;
const chartPoints = computed(() => {
  const vals = chartValues.value, n = vals.length;
  return vals.map((v, i) => ({
    x: PAD_X + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW),
    y: PAD_T + plotH - (v / chartMax.value) * plotH,
    v, i,
  }));
});
const linePath = computed(() => {
  const p = chartPoints.value;
  if (!p.length) return '';
  if (p.length < 2) return `M ${p[0].x} ${p[0].y}`;
  let d = `M ${p[0].x.toFixed(1)} ${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const cx = (p[i].x + p[i + 1].x) / 2;
    d += ` C ${cx.toFixed(1)} ${p[i].y.toFixed(1)} ${cx.toFixed(1)} ${p[i + 1].y.toFixed(1)} ${p[i + 1].x.toFixed(1)} ${p[i + 1].y.toFixed(1)}`;
  }
  return d;
});
const areaPath = computed(() => {
  const p = chartPoints.value;
  if (p.length < 2) return '';
  const base = (PAD_T + plotH).toFixed(1);
  return `${linePath.value} L ${p[p.length - 1].x.toFixed(1)} ${base} L ${p[0].x.toFixed(1)} ${base} Z`;
});
const gridLines = computed(() => Array.from({ length: 5 }, (_, k) => ({
  y: PAD_T + plotH * (k / 4),
  value: chartMax.value * (1 - k / 4),
})));
const colW = computed(() => plotW / Math.max(chartData.value.length, 1));

const periodTotal = computed(() => chartValues.value.reduce((s, v) => s + v, 0));
const monthlyAvg = computed(() => periodTotal.value / (chartData.value.length || 1));
const bestMonth = computed(() => chartData.value.reduce((best: any, m) => (!best || m.revenue > best.revenue ? m : best), null));
const growthPct = computed(() => {
  const d = chartData.value;
  if (d.length < 2) return null;
  const k = chartMetric.value;
  const cur = (d[d.length - 1] as any)[k], prev = (d[d.length - 2] as any)[k];
  if (!prev) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
});
const avgTicket = computed(() => stats.value.orders.total ? stats.value.revenue.total / stats.value.orders.total : 0);

// ── Status dos pedidos (donut) ──────────────────────────────
const DONUT_C = 2 * Math.PI * 42; // r = 42
const statusSegments = computed(() => {
  const o = stats.value.orders;
  const items = [
    { label: 'Pagos', value: o.total, color: '#10b981' },
    { label: 'Aguardando', value: o.pending, color: '#f59e0b' },
    { label: 'Cancelados', value: o.cancelled, color: '#ef4444' },
  ];
  const total = items.reduce((s, i) => s + i.value, 0);
  let acc = 0;
  return {
    total,
    items: items.map(i => {
      const frac = total ? i.value / total : 0;
      const seg = { ...i, frac, offset: acc };
      acc += frac;
      return seg;
    }),
  };
});

// ── Vendas por categoria ────────────────────────────────────
const categoryChart = computed(() => {
  const max = Math.max(...categorySales.value.map(c => c.revenue), 1);
  return categorySales.value.slice(0, 6).map(c => ({ ...c, pct: Math.max((c.revenue / max) * 100, 3) }));
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

const sum = (docs: any[]) => (docs ?? []).reduce((s: number, r: any) => s + Number(r.totalAmount), 0);

// ── Storage monitoring ──────────────────────────────────────
const PLAN_LIMIT_BYTES = 1073741824; // 1 GB free tier

interface BucketStat { name: string; label: string; color: string; bytes: number; count: number }
const storageLoading = ref(true);
const storageBuckets = ref<BucketStat[]>([
  { name: 'product-covers', label: 'Capas / Banners', color: 'bg-violet-500', bytes: 0, count: 0 },
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

async function getBucketSize(bucketId: string): Promise<{ bytes: number; count: number }> {
  try {
    const result = await storage.listFiles(bucketId, [Query.limit(500)]);
    const bytes = result.files.reduce((s, f) => s + (f.sizeOriginal ?? 0), 0);
    return { bytes, count: result.total };
  } catch {
    return { bytes: 0, count: 0 };
  }
}

async function loadStorage() {
  storageLoading.value = true;
  try {
    await Promise.all(storageBuckets.value.map(async bucket => {
      const { bytes, count } = await getBucketSize(bucket.name);
      bucket.bytes = bytes;
      bucket.count = count;
    }));
  } catch (e) {
    console.error('Storage load error', e);
  } finally {
    storageLoading.value = false;
  }
}

async function loadCategorySales() {
  try {
    const [prods, cats] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [Query.isNull('deletedAt'), Query.limit(500), Query.select(['$id', 'price', 'salesCount', 'categoryId'])]),
      // No select here: Query.select omits $id unless you ask for it, and we key
      // the category map by $id. (7 categories — nothing to optimise anyway.)
      databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [Query.limit(100)]),
    ]);
    const catName: Record<string, string> = Object.fromEntries(cats.documents.map((c: any) => [c.$id, c.name]));
    const map: Record<string, { name: string; revenue: number; units: number }> = {};
    for (const p of prods.documents as any[]) {
      const key = p.categoryId || '__none';
      const entry = (map[key] ??= { name: catName[p.categoryId] || 'Sem categoria', revenue: 0, units: 0 });
      const units = Number(p.salesCount || 0);
      entry.units += units;
      entry.revenue += Number(p.price || 0) * units;
    }
    categorySales.value = Object.values(map).filter(c => c.units > 0).sort((a, b) => b.revenue - a.revenue);
  } catch (e) {
    console.error('[DashboardView] category sales', e);
  }
}

async function loadDashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();

  // ── Phase 1: cheap counts + lists — shows the cards/lists immediately ──
  // (counts are limit(1) queries that return only `.total`; recent orders
  // fetch just the 8 rows we render, selecting only the needed fields.)
  try {
    const [paidCount, monthOrders, pending, cancelled, usersRes, recentRes, topProds] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [Query.equal('status', 'PAID'), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [Query.equal('status', 'PAID'), Query.greaterThanEqual('$createdAt', startOfMonth), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [Query.equal('status', 'AWAITING_PAYMENT'), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [Query.equal('status', 'CANCELLED'), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [Query.equal('role', 'CUSTOMER'), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [Query.equal('status', 'PAID'), Query.orderDesc('paidAt'), Query.limit(8), Query.select(['$id', 'orderNumber', 'totalAmount', 'customerName', 'status', 'paidAt'])]),
      databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [Query.isNull('deletedAt'), Query.orderDesc('salesCount'), Query.limit(5)]),
    ]);
    // keep any revenue we already have (e.g. on KeepAlive revisit) so it doesn't flash to 0
    stats.value = {
      revenue: stats.value.revenue,
      orders: { total: paidCount.total, month: monthOrders.total, pending: pending.total, cancelled: cancelled.total },
      users: { total: usersRes.total },
    };
    topProducts.value = topProds.documents.map((p: any) => ({
      ...p, id: p.$id, coverImageUrl: p.coverImageUrl, salesCount: p.salesCount,
    }));
    recentOrders.value = recentRes.documents.map((o: any) => ({
      ...o, id: o.$id, orderNumber: o.orderNumber, totalAmount: o.totalAmount,
      customerName: o.customerName, status: o.status,
    }));
  } catch (e) {
    console.error('[DashboardView] counts', e);
  } finally {
    loading.value = false;
  }

  loadStorage(); // independent, non-blocking
  loadCategorySales(); // independent, non-blocking

  // ── Phase 2: revenue dataset — heavier, but fetch ONLY the 2 fields we sum ──
  revenueLoading.value = true;
  try {
    const paidRes = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
      Query.equal('status', 'PAID'), Query.orderDesc('paidAt'), Query.limit(5000),
      Query.select(['totalAmount', 'paidAt']),
    ]);
    const paid = paidRes.documents as any[];
    const sumIf = (pred: (o: any) => boolean) => paid.reduce((s, o) => s + (pred(o) ? Number(o.totalAmount || 0) : 0), 0);

    stats.value = {
      ...stats.value,
      revenue: {
        total: sum(paid),
        day: sumIf(o => o.paidAt >= startOfDay),
        week: sumIf(o => o.paidAt >= startOfWeek),
        month: sumIf(o => o.paidAt >= startOfMonth),
        year: sumIf(o => o.paidAt >= startOfYear),
      },
    };

    paidOrders.value = paid; // feeds the interactive monthly chart (revenue + orders)
  } catch (e) {
    console.error('[DashboardView] revenue', e);
  } finally {
    revenueLoading.value = false;
  }
}

onMounted(loadDashboard);
// Under <KeepAlive>: silently refresh on revisit (skip the first activation,
// which onMounted already covers). `loading` stays false so no skeleton flash.
let firstActivation = true;
onActivated(() => {
  if (firstActivation) { firstActivation = false; return; }
  loadDashboard();
});
</script>

<style scoped>
/* Playful "educational" dashboard ------------------------------------------ */
.font-display { font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; }
/* All dashboard headings get the rounded display face */
h1, h2 { font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; }

/* Chunky stat cards */
.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 1.75rem;
  padding: 1.25rem;
  color: #fff;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stat-emoji {
  width: 3rem; height: 3rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.25);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; line-height: 1;
  margin-bottom: 0.75rem;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stat-label {
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 2px;
}
.stat-num {
  font-family: 'Fredoka', 'Nunito', system-ui, sans-serif;
  font-size: 1.875rem; font-weight: 700; line-height: 1;
}

/* Waving hand on the greeting */
@keyframes wave {
  0%, 60%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(14deg); }
  20% { transform: rotate(-8deg); }
  40% { transform: rotate(10deg); }
  50% { transform: rotate(-4deg); }
}
.animate-wave { animation: wave 2.6s ease-in-out infinite; transform-origin: 70% 80%; }

/* Orchestrated bouncy entrance ---------------------------------------------- */
@keyframes dashUp {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}
.dash-reveal > * { animation: dashUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) backwards; }
.dash-reveal > *:nth-child(1) { animation-delay: 0.04s; }
.dash-reveal > *:nth-child(2) { animation-delay: 0.10s; }
.dash-reveal > *:nth-child(3) { animation-delay: 0.16s; }
.dash-reveal > *:nth-child(4) { animation-delay: 0.22s; }
.dash-reveal > *:nth-child(5) { animation-delay: 0.28s; }
.dash-reveal > *:nth-child(6) { animation-delay: 0.34s; }
.dash-reveal > *:nth-child(7) { animation-delay: 0.40s; }

/* Stat cards pop in individually (with a little overshoot) + react on hover */
.dash-reveal > .dash-stagger { animation: none; }
.dash-stagger > * { animation: dashUp 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; }
.dash-stagger > *:nth-child(1) { animation-delay: 0.12s; }
.dash-stagger > *:nth-child(2) { animation-delay: 0.20s; }
.dash-stagger > *:nth-child(3) { animation-delay: 0.28s; }
.dash-stagger > *:nth-child(4) { animation-delay: 0.36s; }

@media (hover: hover) {
  .dash-stagger > .stat-card:hover { transform: translateY(-6px) rotate(-1deg); }
  .group:hover .stat-emoji { transform: rotate(-10deg) scale(1.12); }
}

@media (prefers-reduced-motion: reduce) {
  .dash-reveal > *, .dash-stagger > *, .animate-wave { animation: none; }
}
</style>
