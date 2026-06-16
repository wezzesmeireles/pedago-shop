<template>
  <div class="space-y-4">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Usuários</h1>
        <p class="text-sm text-slate-500 mt-0.5">Gerencie os clientes cadastrados</p>
      </div>
    </div>

    <!-- ── Stats cards ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button @click="setFilter('', '')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', !roleFilter && !statusFilter ? 'border-slate-800 bg-white shadow-sm' : 'border-transparent bg-white hover:border-slate-200 shadow-sm']">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total</p>
        <p class="text-3xl font-black text-slate-900 leading-none">{{ stats.total ?? '—' }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">usuários</p>
      </button>
      <button @click="setFilter('', 'active')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', statusFilter === 'active' ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white hover:border-emerald-200 shadow-sm']">
        <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">✓ Ativos</p>
        <p class="text-3xl font-black text-emerald-700 leading-none">{{ stats.active ?? '—' }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">contas</p>
      </button>
      <button @click="setFilter('', 'phone')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', statusFilter === 'phone' ? 'border-green-500 bg-green-50' : 'border-transparent bg-white hover:border-green-200 shadow-sm']">
        <p class="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1.5">📱 WhatsApp</p>
        <p class="text-3xl font-black text-green-700 leading-none">{{ stats.withPhone ?? '—' }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">com número</p>
      </button>
      <button @click="setFilter('', 'today')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', statusFilter === 'today' ? 'border-violet-500 bg-violet-50' : 'border-transparent bg-white hover:border-violet-200 shadow-sm']">
        <p class="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1.5">📅 Hoje</p>
        <p class="text-3xl font-black text-violet-700 leading-none">{{ stats.today ?? '—' }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">cadastros</p>
      </button>
    </div>

    <!-- ── Search + Filtros ── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 space-y-3">
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="search" @input="debouncedLoad"
          placeholder="Buscar por nome, e-mail ou telefone..."
          class="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors" />
        <button v-if="search" @click="clearSearch"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-300 hover:bg-slate-400 text-white transition-colors text-xs font-bold">
          ×
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5 items-center justify-between">
        <div class="flex flex-wrap gap-1.5 items-center">
          <button v-for="f in roleFilters" :key="f.value" @click="setFilter(f.value, statusFilter)"
            :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap', roleFilter === f.value ? f.activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
            {{ f.label }}
          </button>
          <span class="w-px h-4 bg-slate-200 mx-0.5" />
          <button v-for="f in statusFilters" :key="f.value" @click="setFilter(roleFilter, f.value)"
            :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap', statusFilter === f.value ? f.activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
            {{ f.label }}
          </button>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="loadingUsers" class="text-xs text-slate-400 animate-pulse">Carregando...</span>
          <span v-else class="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            {{ totalCount }} usuário{{ totalCount !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Mobile cards ── -->
    <div class="md:hidden space-y-2.5">
      <!-- Skeleton -->
      <template v-if="loadingUsers">
        <div v-for="i in 5" :key="i" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-11 h-11 rounded-full bg-slate-100 flex-shrink-0"></div>
            <div class="flex-1">
              <div class="h-4 bg-slate-100 rounded w-32 mb-1.5"></div>
              <div class="h-3 bg-slate-50 rounded w-44 mb-1"></div>
              <div class="h-3 bg-slate-50 rounded w-24"></div>
            </div>
          </div>
          <div class="flex gap-2 pt-2 border-t border-slate-50">
            <div class="h-8 bg-slate-100 rounded-xl flex-1"></div>
            <div class="h-8 bg-slate-100 rounded-xl flex-1"></div>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="users.length === 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <p class="text-sm font-semibold text-slate-500">Nenhum usuário encontrado</p>
        <p v-if="search || roleFilter || statusFilter" class="text-xs text-slate-400 mt-1">Tente limpar os filtros</p>
      </div>

      <!-- Cards -->
      <template v-else>
        <div v-for="user in users" :key="user.id" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 cursor-pointer hover:border-violet-200 hover:shadow-md transition-all" @click="openProfile(user)">
          <!-- Top: avatar + info -->
          <div class="flex items-start gap-3 mb-3">
            <div class="flex-shrink-0">
              <img v-if="user.avatarUrl" :src="user.avatarUrl" referrerpolicy="no-referrer" loading="lazy" @error="user.avatarUrl = ''" class="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100" />
              <div v-else class="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-base">
                {{ user.name?.[0]?.toUpperCase() ?? '?' }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-0.5">
                <p class="text-sm font-bold text-slate-900 truncate">{{ user.name }}</p>
                <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded-full', user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500']">
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Cliente' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 truncate mb-1">{{ user.email }}</p>
              <div class="flex items-center gap-2 flex-wrap">
                <span :class="['inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500']">
                  <span :class="['w-1 h-1 rounded-full', user.isActive ? 'bg-emerald-500' : 'bg-red-400']"></span>
                  {{ user.isActive ? 'Ativo' : 'Inativo' }}
                </span>
                <span class="text-[10px] text-slate-400">{{ formatDateShort(user.createdAt) }}</span>
                <span v-if="user.ordersCount" class="inline-flex items-center gap-1 text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">
                  🛍 {{ user.ordersCount }} compra{{ user.ordersCount !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Phone row -->
          <div v-if="user.phone" class="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl px-3 py-2 mb-3">
            <svg class="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            <span class="text-xs font-mono font-semibold text-green-700 flex-1">{{ user.phone }}</span>
            <button @click="openAddPhone(user)" class="text-slate-400 hover:text-violet-600 transition-colors p-0.5" title="Editar">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2" @click.stop>
            <button v-if="user.phone" @click="openWhatsApp(user)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors">
              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button v-else @click="openAddPhone(user)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 rounded-xl transition-colors border border-dashed border-green-200">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Add WhatsApp
            </button>
            <button @click="openOrders(user)"
              class="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Pedidos
            </button>
            <button @click="toggleActive(user)"
              :class="['p-2.5 rounded-xl transition-colors', user.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50']"
              :title="user.isActive ? 'Desativar' : 'Ativar'">
              <svg v-if="user.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
          </div>
        </div>

        <!-- Paginação mobile -->
        <div v-if="totalPages > 1" class="flex items-center justify-between bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-sm">
          <span class="text-xs text-slate-500 font-medium">Pág. {{ currentPage }}/{{ totalPages }}</span>
          <div class="flex gap-1">
            <button @click="loadUsers(currentPage - 1)" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 bg-slate-50 disabled:opacity-30 hover:bg-slate-100 transition-colors">‹</button>
            <button v-for="p in pageRange" :key="p" @click="loadUsers(p)"
              :class="['w-8 h-8 rounded-xl text-sm font-semibold transition-all', p === currentPage ? 'bg-violet-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100']">{{ p }}</button>
            <button @click="loadUsers(currentPage + 1)" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 bg-slate-50 disabled:opacity-30 hover:bg-slate-100 transition-colors">›</button>
          </div>
        </div>
      </template>
    </div>

    <!-- ── Desktop table ── -->
    <div class="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100">
              <th class="text-left px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Telefone</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Compras</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Função</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Cadastro</th>
              <th class="px-4 py-3.5 w-24"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <!-- Skeleton -->
            <template v-if="loadingUsers">
              <tr v-for="i in 8" :key="i" class="animate-pulse">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-slate-100 flex-shrink-0"></div>
                    <div><div class="h-4 bg-slate-100 rounded w-28 mb-1.5"></div><div class="h-3 bg-slate-50 rounded w-40"></div></div>
                  </div>
                </td>
                <td class="px-4 py-4 hidden xl:table-cell"><div class="h-3 bg-slate-50 rounded w-28"></div></td>
                <td class="px-4 py-4"><div class="h-6 bg-slate-100 rounded-lg w-8"></div></td>
                <td class="px-4 py-4 hidden lg:table-cell"><div class="h-5 bg-slate-100 rounded-lg w-16"></div></td>
                <td class="px-4 py-4"><div class="h-5 bg-slate-100 rounded-full w-14"></div></td>
                <td class="px-4 py-4 hidden lg:table-cell"><div class="h-3 bg-slate-50 rounded w-20"></div></td>
                <td class="px-4 py-4"><div class="h-7 bg-slate-100 rounded-xl w-20"></div></td>
              </tr>
            </template>
            <!-- Empty -->
            <tr v-else-if="users.length === 0">
              <td colspan="7" class="px-5 py-16 text-center">
                <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <p class="text-sm font-semibold text-slate-400">Nenhum usuário encontrado</p>
                <p v-if="search || roleFilter || statusFilter" class="text-xs text-slate-400 mt-1">Tente limpar os filtros acima</p>
              </td>
            </tr>
            <!-- Rows -->
            <tr v-else v-for="user in users" :key="user.id + 'd'" class="group hover:bg-violet-50/30 transition-colors cursor-pointer" @click="openProfile(user)">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" referrerpolicy="no-referrer" loading="lazy" @error="user.avatarUrl = ''" class="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm" />
                    <div v-else class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black">
                      {{ user.name?.[0]?.toUpperCase() ?? '?' }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{{ user.name }}</p>
                    <p class="text-xs text-slate-400 truncate max-w-[180px]">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 hidden xl:table-cell">
                <div v-if="user.phone" class="flex items-center gap-1.5">
                  <svg class="w-3 h-3 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span class="text-xs font-mono text-green-700">{{ user.phone }}</span>
                </div>
                <button v-else @click="openAddPhone(user)" class="flex items-center gap-1 text-xs text-slate-300 hover:text-green-600 transition-colors">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  Add
                </button>
              </td>
              <td class="px-4 py-3.5">
                <button @click="openOrders(user)" class="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                  <div class="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  </div>
                  <span class="text-sm font-semibold text-slate-700">{{ user.ordersCount ?? 0 }}</span>
                </button>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <span :class="['inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold', user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600']">
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Cliente' }}
                </span>
              </td>
              <td class="px-4 py-3.5">
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500']">
                  <span :class="['w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-emerald-500' : 'bg-red-400']"></span>
                  {{ user.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <span class="text-xs text-slate-400">{{ formatDateShort(user.createdAt) }}</span>
              </td>
              <td class="px-4 py-3.5" @click.stop>
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openProfile(user)"
                    class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-violet-600 bg-violet-100 hover:bg-violet-200 rounded-xl transition-colors">
                    Perfil
                  </button>
                  <button @click="openAddPhone(user)"
                    :class="['flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-colors', user.phone ? 'text-violet-600 bg-violet-100 hover:bg-violet-200' : 'text-green-700 bg-green-50 hover:bg-green-100']">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                    {{ user.phone ? 'Zap' : '+ Zap' }}
                  </button>
                  <button v-if="user.phone" @click="openWhatsApp(user)"
                    class="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors">
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Enviar
                  </button>
                  <button @click="toggleActive(user)"
                    :class="['p-1.5 rounded-xl transition-colors', user.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50']"
                    :title="user.isActive ? 'Desativar' : 'Ativar'">
                    <svg v-if="user.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Paginação desktop -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
        <span class="text-xs text-slate-500 font-medium">Página {{ currentPage }} de {{ totalPages }} · {{ totalCount }} usuários</span>
        <div class="flex gap-1">
          <button @click="loadUsers(currentPage - 1)" :disabled="currentPage === 1"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">‹</button>
          <button v-for="p in pageRange" :key="p" @click="loadUsers(p)"
            :class="['w-8 h-8 rounded-xl text-sm font-semibold transition-all', p === currentPage ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:shadow-sm']">{{ p }}</button>
          <button @click="loadUsers(currentPage + 1)" :disabled="currentPage === totalPages"
            class="w-8 h-8 flex items-center justify-center rounded-xl text-slate-500 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">›</button>
        </div>
      </div>
    </div>

    <!-- ── Add/Edit Phone Modal ── -->
    <AppModal v-model="addPhoneOpen" :title="`${addPhoneUser?.phone ? 'Editar' : 'Adicionar'} WhatsApp — ${addPhoneUser?.name ?? ''}`">
      <div class="space-y-4">
        <div v-if="addPhoneUser" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
            {{ addPhoneUser.name?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <div>
            <p class="text-sm font-bold text-slate-800">{{ addPhoneUser.name }}</p>
            <p class="text-xs text-slate-400">{{ addPhoneUser.email }}</p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">WhatsApp</label>
          <input v-model="addPhoneValue" type="tel" placeholder="(11) 99999-9999" @keyup.enter="saveAddPhone"
            class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        </div>
        <p v-if="addPhoneError" class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ addPhoneError }}</p>
        <button @click="saveAddPhone" :disabled="addPhoneSaving || !addPhoneValue.trim()"
          class="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all text-sm">
          {{ addPhoneSaving ? 'Salvando...' : 'Salvar número' }}
        </button>
      </div>
    </AppModal>

    <!-- ── WhatsApp Modal ── -->
    <AppModal v-model="waOpen" :title="`WhatsApp — ${waUser?.name ?? ''}`">
      <div class="space-y-4">
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
          <div class="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-800">{{ waUser?.name }}</p>
            <p class="text-xs text-green-700 font-mono">{{ waUser?.phone }}</p>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mensagem</label>
          <textarea v-model="waMessage" rows="5" placeholder="Digite sua mensagem..."
            class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"></textarea>
        </div>
        <button @click="sendWhatsApp"
          class="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:scale-[0.99] text-white font-bold py-3 rounded-xl transition-all text-sm">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Abrir no WhatsApp
        </button>
      </div>
    </AppModal>

    <!-- ── Profile Modal ── -->
    <AppModal v-model="profileOpen" :title="`Perfil — ${profileUser?.name ?? ''}`">
      <div v-if="profileUser" class="space-y-4">
        <!-- Header -->
        <div class="flex items-center gap-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
          <div class="flex-shrink-0">
            <img v-if="profileUser.avatarUrl" :src="profileUser.avatarUrl" referrerpolicy="no-referrer" class="w-16 h-16 rounded-2xl object-cover shadow-md" />
            <div v-else class="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
              {{ profileUser.name?.[0]?.toUpperCase() ?? '?' }}
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-lg font-black text-slate-900 truncate">{{ profileUser.name }}</h3>
            <p class="text-sm text-slate-500 truncate">{{ profileUser.email }}</p>
            <div class="flex items-center gap-2 mt-2 flex-wrap">
              <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold', profileUser.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500']">
                <span :class="['w-1.5 h-1.5 rounded-full', profileUser.isActive ? 'bg-emerald-500' : 'bg-red-400']"></span>
                {{ profileUser.isActive ? 'Ativo' : 'Inativo' }}
              </span>
              <span :class="['inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold', profileUser.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500']">
                {{ profileUser.role === 'ADMIN' ? '👑 Admin' : 'Cliente' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-slate-50 rounded-xl p-3.5 border border-slate-100 space-y-1">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cadastro</p>
            <p class="text-sm font-semibold text-slate-700">{{ formatDate(profileUser.createdAt) }}</p>
          </div>
          <div class="bg-violet-50 rounded-xl p-3.5 border border-violet-100 space-y-1">
            <p class="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Compras</p>
            <p class="text-2xl font-black text-violet-600 leading-none">{{ profileUser.ordersCount ?? 0 }}</p>
          </div>
        </div>

        <!-- Phone -->
        <div class="flex items-center gap-3 p-3.5 rounded-xl border" :class="profileUser.phone ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" :class="profileUser.phone ? 'bg-green-500' : 'bg-slate-200'">
            <svg class="w-4 h-4" :class="profileUser.phone ? 'text-white fill-white' : 'text-slate-400 fill-slate-400'" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-bold uppercase tracking-widest mb-0.5" :class="profileUser.phone ? 'text-green-500' : 'text-slate-400'">WhatsApp</p>
            <p v-if="profileUser.phone" class="text-sm font-mono font-semibold text-green-700">{{ profileUser.phone }}</p>
            <p v-else class="text-xs text-slate-400 italic">Não configurado</p>
          </div>
          <button @click="openAddPhone(profileUser); profileOpen = false"
            class="text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors"
            :class="profileUser.phone ? 'text-violet-600 bg-violet-100 hover:bg-violet-200' : 'text-green-700 bg-green-100 hover:bg-green-200'">
            {{ profileUser.phone ? 'Editar' : 'Adicionar' }}
          </button>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2 pt-1">
          <button @click="openOrders(profileUser); profileOpen = false"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-xl transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            Ver pedidos
          </button>
          <button v-if="profileUser.phone" @click="openWhatsApp(profileUser); profileOpen = false"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors">
            <svg class="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </button>
          <button @click="toggleActive(profileUser)"
            :class="['px-4 py-2.5 text-sm font-bold rounded-xl transition-colors', profileUser.isActive ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100']">
            {{ profileUser.isActive ? 'Desativar' : 'Ativar' }}
          </button>
        </div>
      </div>
    </AppModal>

    <!-- ── User Orders Modal ── -->
    <AppModal v-model="ordersOpen" :title="`Pedidos — ${selectedUser?.name ?? ''}`">
      <div v-if="selectedUser" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
        <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
          {{ selectedUser.name?.[0]?.toUpperCase() ?? '?' }}
        </div>
        <div>
          <p class="text-sm font-bold text-slate-800">{{ selectedUser.name }}</p>
          <p class="text-xs text-slate-400">{{ selectedUser.email }}</p>
        </div>
        <span class="ml-auto text-xs font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full whitespace-nowrap">{{ userOrders.length }} pedido{{ userOrders.length !== 1 ? 's' : '' }}</span>
      </div>
      <div v-if="loadingOrders" class="py-12 flex items-center justify-center">
        <div class="animate-spin w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="userOrders.length === 0" class="py-12 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <p class="text-sm font-semibold text-slate-400">Nenhum pedido encontrado</p>
      </div>
      <div v-else class="space-y-2.5">
        <div v-for="order in userOrders" :key="order.id" class="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div class="flex items-center justify-between gap-2 mb-2">
            <span class="text-xs font-mono font-black text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg">{{ order.orderNumber }}</span>
            <span class="text-sm font-black text-violet-600">{{ formatPrice(order.totalAmount) }}</span>
          </div>
          <div class="flex items-center gap-2 mb-2">
            <StatusBadge :status="order.status" />
            <span v-if="order.paymentMethod === 'PIX'" class="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">💠 PIX</span>
            <span v-else-if="order.paymentMethod === 'CREDIT_CARD'" class="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">💳 Cartão</span>
            <span class="text-xs text-slate-400 ml-auto">{{ formatDateShort(order.createdAt) }}</span>
          </div>
          <p v-if="order.items?.length" class="text-xs text-slate-500 leading-relaxed line-clamp-2">
            {{ order.items.map((i: any) => i.productName).join(' · ') }}
          </p>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import { useRoute } from 'vue-router';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { invokeFunction } from '@/services/api';
import AppModal from '@/components/ui/AppModal.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';
import { useSiteConfigStore } from '@/stores/site-config.store';

const route = useRoute();

const { config } = useSiteConfigStore();

const users = ref([]);
const search = ref('');
const roleFilter = ref('');
const statusFilter = ref('');
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);
const loadingUsers = ref(false);

const profileOpen = ref(false);
const profileUser = ref<any>(null);

function openProfile(user: any) {
  profileUser.value = user;
  profileOpen.value = true;
}

const ordersOpen = ref(false);
const loadingOrders = ref(false);
const selectedUser = ref<any>(null);
const userOrders = ref([]);

const waOpen = ref(false);
const waUser = ref<any>(null);
const waMessage = ref('');

const addPhoneOpen = ref(false);
const addPhoneUser = ref<any>(null);
const addPhoneValue = ref('');
const addPhoneSaving = ref(false);
const addPhoneError = ref('');

const stats = ref<{ total?: number; active?: number; withPhone?: number; today?: number }>({});

const roleFilters = [
  { value: '', label: 'Todos', activeClass: 'bg-slate-800 text-white' },
  { value: 'CUSTOMER', label: 'Clientes', activeClass: 'bg-violet-600 text-white' },
  { value: 'ADMIN', label: 'Admins', activeClass: 'bg-purple-600 text-white' },
];
const statusFilters = [
  { value: '', label: 'Qualquer status', activeClass: 'bg-slate-800 text-white' },
  { value: 'active', label: '✓ Ativos', activeClass: 'bg-emerald-600 text-white' },
  { value: 'inactive', label: '✕ Inativos', activeClass: 'bg-red-500 text-white' },
  { value: 'phone', label: '📱 Com Zap', activeClass: 'bg-green-600 text-white' },
  { value: 'today', label: '📅 Hoje', activeClass: 'bg-violet-600 text-white' },
];

const pageRange = computed(() => {
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(d: string) {
  const date = new Date(d);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function setFilter(role: string, status: string) {
  roleFilter.value = role;
  statusFilter.value = status;
  loadUsers(1);
}

function clearSearch() { search.value = ''; loadUsers(1); }

let timeout: ReturnType<typeof setTimeout>;
function debouncedLoad() { clearTimeout(timeout); timeout = setTimeout(() => loadUsers(1), 400); }

async function loadStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  try {
    const [all, active, withPhone, today] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [Query.equal('isActive', true), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [Query.isNotNull('phone'), Query.notEqual('phone', ''), Query.limit(1)]),
      databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [Query.greaterThanEqual('$createdAt', todayStart.toISOString()), Query.limit(1)]),
    ]);
    stats.value = { total: all.total, active: active.total, withPhone: withPhone.total, today: today.total };
  } catch {}
}

async function loadUsers(page = 1) {
  loadingUsers.value = true;
  try {
    const limit = 20;
    const offset = (page - 1) * limit;
    const data = await invokeFunction('admin-users', {
      limit, offset,
      search: search.value || undefined,
      role: roleFilter.value || undefined,
      status: statusFilter.value || undefined,
    });
    const total = (data as any).total ?? 0;
    totalCount.value = total;
    totalPages.value = Math.max(1, Math.ceil(total / limit));
    currentPage.value = page;
    users.value = ((data as any).users ?? []).map((u: any) => ({
      ...u,
      avatarUrl: u.avatarUrl ?? u.avatar_url,
      isActive: u.isActive ?? u.is_active,
      createdAt: u.createdAt ?? u.created_at,
      ordersCount: Number(u.orderCount ?? u.ordersCount ?? 0),
      phone: u.phone ?? null,
    }));
  } catch {
    users.value = [] as any;
    totalCount.value = 0;
    totalPages.value = 1;
  } finally {
    loadingUsers.value = false;
  }
}

async function toggleActive(user: any) {
  await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, user.id, { isActive: !user.isActive });
  await loadUsers(currentPage.value);
  loadStats();
}

function openAddPhone(user: any) {
  addPhoneUser.value = user;
  addPhoneValue.value = user.phone ?? '';
  addPhoneError.value = '';
  addPhoneOpen.value = true;
}

async function saveAddPhone() {
  if (!addPhoneValue.value.trim() || !addPhoneUser.value) return;
  addPhoneError.value = '';
  const digits = addPhoneValue.value.replace(/\D/g, '');
  if (digits.length < 10) { addPhoneError.value = 'Informe um número válido com DDD.'; return; }
  addPhoneSaving.value = true;
  try {
    const result = await invokeFunction('admin-users', { _method: 'PATCH', userId: addPhoneUser.value.id, phone: digits });
    if ((result as any)?.error) { addPhoneError.value = (result as any).error ?? 'Erro ao salvar.'; return; }
    const idx = (users.value as any[]).findIndex((u: any) => u.id === addPhoneUser.value.id);
    if (idx !== -1) (users.value as any[])[idx] = { ...(users.value as any[])[idx], phone: digits };
    addPhoneOpen.value = false;
    loadStats();
    loadUsers(currentPage.value);
  } catch {
    addPhoneError.value = 'Erro ao salvar. Tente novamente.';
  } finally {
    addPhoneSaving.value = false;
  }
}

function openWhatsApp(user: any) {
  waUser.value = user;
  const firstName = user.name?.split(' ')[0] ?? '';
  const store = config.storeName || 'nossa loja';
  waMessage.value = `Ola, ${firstName}!\n\nAqui e a equipe da ${store}.\n\nEstamos passando para te avisar sobre novidades incriveis que chegaram! Se quiser saber mais, e so responder esta mensagem.\n\nAte logo!`;
  waOpen.value = true;
}

function sendWhatsApp() {
  if (!waUser.value?.phone || !waMessage.value.trim()) return;
  const number = whatsappNumber(waUser.value.phone);
  const text = encodeURIComponent(waMessage.value.trim());
  window.open(`https://wa.me/${number}?text=${text}`, '_blank');
  waOpen.value = false;
}

async function openOrders(user: any) {
  selectedUser.value = user;
  ordersOpen.value = true;
  loadingOrders.value = true;
  userOrders.value = [];
  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
      Query.equal('userId', user.id),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]);
    const withItems = await Promise.all(result.documents.map(async (o: any) => {
      let items: any[] = [];
      try {
        const ir = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [
          Query.equal('orderId', o.$id), Query.limit(50),
        ]);
        items = ir.documents.map((i: any) => ({ productName: i.productName }));
      } catch {}
      return {
        id: o.$id,
        orderNumber: o.orderNumber,
        createdAt: o.$createdAt,
        totalAmount: o.totalAmount,
        status: o.status,
        paymentMethod: o.paymentMethod ?? null,
        items,
      };
    }));
    userOrders.value = withItems as any;
  } finally {
    loadingOrders.value = false;
  }
}

async function initFromRoute() {
  const qSearch = route.query.search ? String(route.query.search) : '';
  const qUserId = route.query.userId ? String(route.query.userId) : '';
  if (qSearch) search.value = qSearch;
  await loadUsers(1);
  loadStats();
  if (qUserId) {
    const user = (users.value as any[]).find((u: any) => u.id === qUserId);
    if (user) openProfile(user);
  }
}

onMounted(initFromRoute);

let firstActivation = true;
onActivated(async () => {
  if (firstActivation) { firstActivation = false; return; }
  await initFromRoute();
});
</script>
