<template>
  <div class="space-y-4">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Produtos</h1>
        <p class="text-sm text-slate-500 mt-0.5">Gerencie o catálogo da loja</p>
      </div>
      <button @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:shadow-violet-200 transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Novo Produto
      </button>
    </div>

    <!-- ── Stats cards (computed from loaded data) ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <button @click="setStatusFilter('')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', !statusFilter && !categoryFilter ? 'border-slate-800 bg-white shadow-sm' : 'border-transparent bg-white hover:border-slate-200 shadow-sm']">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total</p>
        <p class="text-3xl font-black text-slate-900 leading-none">{{ loadingProducts ? '—' : products.length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">produtos</p>
      </button>
      <button @click="setStatusFilter('active')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', statusFilter === 'active' ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-white hover:border-emerald-200 shadow-sm']">
        <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">✓ Ativos</p>
        <p class="text-3xl font-black text-emerald-700 leading-none">{{ loadingProducts ? '—' : products.filter(p => p.isActive).length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">no catálogo</p>
      </button>
      <button @click="setStatusFilter('featured')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', statusFilter === 'featured' ? 'border-amber-500 bg-amber-50' : 'border-transparent bg-white hover:border-amber-200 shadow-sm']">
        <p class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">★ Destaques</p>
        <p class="text-3xl font-black text-amber-700 leading-none">{{ loadingProducts ? '—' : products.filter(p => p.isFeatured).length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">em destaque</p>
      </button>
      <button @click="setStatusFilter('no-cover')"
        :class="['text-left p-4 rounded-2xl border-2 transition-all', statusFilter === 'no-cover' ? 'border-red-400 bg-red-50' : 'border-transparent bg-white hover:border-red-200 shadow-sm']">
        <p class="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1.5">⚠ Sem Capa</p>
        <p class="text-3xl font-black text-red-600 leading-none">{{ loadingProducts ? '—' : products.filter(p => !p.coverImageUrl).length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">sem imagem</p>
      </button>
    </div>

    <!-- ── Search + Filtros ── -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 space-y-3">
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input v-model="search" placeholder="Buscar por nome ou slug..."
          class="w-full pl-10 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-slate-50 hover:bg-white transition-colors" />
        <button v-if="search" @click="search = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-slate-300 hover:bg-slate-400 text-white transition-colors text-xs font-bold">
          ×
        </button>
      </div>
      <div class="flex flex-wrap gap-1.5 items-center justify-between">
        <div class="flex flex-wrap gap-1.5 items-center">
          <!-- Status pills -->
          <button v-for="f in statusFilters" :key="f.value" @click="setStatusFilter(f.value)"
            :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap', statusFilter === f.value ? f.activeClass : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
            {{ f.label }}
          </button>
          <!-- Category pills -->
          <template v-if="categories.length">
            <span class="w-px h-4 bg-slate-200 mx-0.5" />
            <button v-for="cat in categories" :key="cat.id" @click="setCategoryFilter(cat.id)"
              :class="['px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap', categoryFilter === cat.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200']">
              {{ cat.name }}
            </button>
          </template>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="loadingProducts" class="text-xs text-slate-400 animate-pulse">Carregando...</span>
          <span v-else class="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            {{ filteredProducts.length }} produto{{ filteredProducts.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Mobile cards ── -->
    <div class="md:hidden space-y-2.5">
      <!-- Skeleton -->
      <template v-if="loadingProducts">
        <div v-for="i in 5" :key="i" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 animate-pulse">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-14 h-14 rounded-xl bg-slate-100 flex-shrink-0"></div>
            <div class="flex-1">
              <div class="h-4 bg-slate-100 rounded w-40 mb-2"></div>
              <div class="flex gap-1.5">
                <div class="h-5 bg-slate-100 rounded-full w-16"></div>
                <div class="h-5 bg-slate-100 rounded-lg w-20"></div>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <div class="h-8 bg-slate-100 rounded-xl flex-1"></div>
            <div class="h-8 w-10 bg-slate-100 rounded-xl"></div>
            <div class="h-8 w-16 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </template>

      <!-- Empty -->
      <div v-else-if="filteredProducts.length === 0" class="bg-white rounded-2xl border border-slate-100 shadow-sm py-16 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
        </div>
        <p class="text-sm font-semibold text-slate-500">Nenhum produto encontrado</p>
        <p v-if="search || statusFilter || categoryFilter" class="text-xs text-slate-400 mt-1">Tente limpar os filtros</p>
        <button v-else @click="openCreate" class="mt-4 text-xs font-bold text-violet-600 underline underline-offset-2">Criar primeiro produto →</button>
      </div>

      <!-- Cards -->
      <template v-else>
        <div v-for="p in pagedProducts" :key="p.id" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div class="flex items-start gap-3 mb-3">
            <!-- Thumbnail -->
            <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
              <img v-if="p.coverImageUrl" :src="p.coverImageUrl" :alt="p.name" loading="lazy" decoding="async" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-bold text-slate-900 leading-snug line-clamp-2 flex-1">{{ p.name }}</p>
                <span class="text-sm font-black text-violet-600 flex-shrink-0">{{ formatPrice(p.price) }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span :class="['inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full', p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400']">
                  <span :class="['w-1 h-1 rounded-full', p.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                  {{ p.isActive ? 'Ativo' : 'Inativo' }}
                </span>
                <span v-if="p.category?.name" class="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-lg font-semibold">{{ p.category.name }}</span>
                <span v-if="p.deliveryType === 'LINK'" class="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">🔗 Link</span>
                <span v-else class="text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">📄 PDF</span>
                <span v-if="p.isFeatured" class="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">★</span>
                <span v-if="p.salesCount" class="text-[10px] bg-slate-100 text-slate-500 font-semibold px-1.5 py-0.5 rounded-full">{{ p.salesCount }} venda{{ p.salesCount !== 1 ? 's' : '' }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(p)" class="flex-1 py-2 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">Editar</button>
            <button @click="toggleFeatured(p)"
              :class="['w-9 flex items-center justify-center rounded-xl transition-colors text-sm', p.isFeatured ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500']">★</button>
            <button @click="toggleActive(p)"
              :class="['px-3 py-2 rounded-xl transition-colors text-xs font-bold', p.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100']">
              {{ p.isActive ? 'Desativar' : 'Ativar' }}
            </button>
            <button @click="confirmDelete(p)" class="w-9 flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>

        <button v-if="hasMore" @click="loadMore"
          class="w-full py-3.5 text-sm font-bold text-violet-600 bg-white hover:bg-violet-50 border border-slate-100 rounded-2xl transition-colors shadow-sm">
          Carregar mais ({{ filteredProducts.length - visibleCount }} restantes)
        </button>
      </template>
    </div>

    <!-- ── Desktop table ── -->
    <div class="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50/80 border-b border-slate-100">
              <th class="text-left px-5 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Produto</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Categoria</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entrega</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Preço</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden xl:table-cell">Vendas</th>
              <th class="text-left px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-4 py-3.5 w-28"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <!-- Skeleton -->
            <template v-if="loadingProducts">
              <tr v-for="i in 8" :key="i" class="animate-pulse">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0"></div>
                    <div><div class="h-4 bg-slate-100 rounded w-40 mb-1.5"></div><div class="h-3 bg-slate-50 rounded w-28"></div></div>
                  </div>
                </td>
                <td class="px-4 py-4 hidden lg:table-cell"><div class="h-5 bg-slate-100 rounded-lg w-20"></div></td>
                <td class="px-4 py-4"><div class="h-5 bg-slate-100 rounded-full w-14"></div></td>
                <td class="px-4 py-4"><div class="h-4 bg-slate-100 rounded w-16"></div></td>
                <td class="px-4 py-4 hidden xl:table-cell"><div class="h-4 bg-slate-50 rounded w-8"></div></td>
                <td class="px-4 py-4"><div class="h-5 bg-slate-100 rounded-full w-14"></div></td>
                <td class="px-4 py-4"><div class="h-7 bg-slate-100 rounded-xl w-20"></div></td>
              </tr>
            </template>
            <!-- Empty -->
            <tr v-else-if="filteredProducts.length === 0">
              <td colspan="7" class="px-5 py-16 text-center">
                <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                </div>
                <p class="text-sm font-semibold text-slate-400">Nenhum produto encontrado</p>
                <p v-if="search || statusFilter || categoryFilter" class="text-xs text-slate-400 mt-1">Tente limpar os filtros acima</p>
                <button v-else @click="openCreate" class="mt-3 text-xs font-bold text-violet-600 underline underline-offset-2">Criar primeiro produto →</button>
              </td>
            </tr>
            <!-- Rows -->
            <tr v-else v-for="p in pagedProducts" :key="p.id" class="group hover:bg-violet-50/30 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                    <img v-if="p.coverImageUrl" :src="p.coverImageUrl" :alt="p.name" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate max-w-[200px]">{{ p.name }}</p>
                    <p class="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">{{ p.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <span v-if="p.category?.name" class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-semibold">{{ p.category.name }}</span>
                <span v-else class="text-xs text-slate-300">—</span>
              </td>
              <td class="px-4 py-3.5">
                <span v-if="p.deliveryType === 'LINK'" class="text-[10px] bg-blue-100 text-blue-700 font-black px-2 py-1 rounded-full whitespace-nowrap">🔗 Link</span>
                <span v-else class="text-[10px] bg-violet-100 text-violet-700 font-black px-2 py-1 rounded-full whitespace-nowrap">📄 PDF</span>
              </td>
              <td class="px-4 py-3.5">
                <span class="text-sm font-black text-violet-600 whitespace-nowrap">{{ formatPrice(p.price) }}</span>
              </td>
              <td class="px-4 py-3.5 hidden xl:table-cell">
                <span class="text-sm text-slate-600 font-medium">{{ p.salesCount ?? 0 }}</span>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex items-center gap-1.5">
                  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap', p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
                    <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', p.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                    {{ p.isActive ? 'Ativo' : 'Inativo' }}
                  </span>
                  <span v-if="p.isFeatured" class="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">★</span>
                </div>
              </td>
              <td class="px-4 py-3.5" @click.stop>
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="toggleFeatured(p)"
                    :class="['p-1.5 rounded-xl transition-colors', p.isFeatured ? 'text-amber-500 hover:bg-amber-50' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50']"
                    :title="p.isFeatured ? 'Remover destaque' : 'Destacar'">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </button>
                  <button @click="openEdit(p)" class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors" title="Editar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click="toggleActive(p)"
                    :class="['p-1.5 rounded-xl transition-colors', p.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50']"
                    :title="p.isActive ? 'Desativar' : 'Ativar'">
                    <svg v-if="p.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                  <button @click="confirmDelete(p)" class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Apagar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <button v-if="hasMore && !loadingProducts" @click="loadMore"
        class="w-full py-3.5 text-sm font-bold text-violet-600 hover:bg-violet-50 border-t border-slate-100 transition-colors">
        Carregar mais ({{ filteredProducts.length - visibleCount }} restantes)
      </button>
    </div>

    <!-- ── Delete Confirmation Modal ── -->
    <AppModal v-model="deleteModalOpen" title="Apagar Produto">
      <div class="space-y-4">
        <div v-if="productToDelete" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div class="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
            <img v-if="productToDelete.coverImageUrl" :src="productToDelete.coverImageUrl" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center">
              <svg class="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
            </div>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-bold text-slate-900 truncate">{{ productToDelete.name }}</p>
            <p class="text-xs text-slate-400">{{ formatPrice(productToDelete.price) }}</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <p class="text-sm text-red-700">Esta ação <strong>não pode ser desfeita</strong>. O produto e seus itens de pedido serão apagados permanentemente.</p>
        </div>
        <div class="flex gap-3">
          <button @click="deleteProduct" :disabled="deleting"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ deleting ? 'Apagando...' : 'Sim, apagar' }}
          </button>
          <button @click="deleteModalOpen = false" class="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
        </div>
      </div>
    </AppModal>

    <!-- ── Create / Edit Modal ── -->
    <AppModal v-model="modalOpen" :title="editingProduct ? 'Editar Produto' : 'Novo Produto'">
      <form @submit.prevent="saveProduct" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nome *</label>
            <input v-model="form.name" required @blur="autoSlug" placeholder="Ex: Atividades de Alfabetização Vol. 1" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Slug *</label>
            <input v-model="form.slug" required placeholder="atividades-alfabetizacao-v1" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Preço Atual (R$) *</label>
              <input v-model="form.price" type="number" step="0.01" min="0" required placeholder="29.90" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Preço Original (R$) <span class="ml-1 text-[10px] text-slate-400 font-normal normal-case">(riscado)</span>
              </label>
              <input v-model="form.comparePrice" type="number" step="0.01" min="0" placeholder="59.90" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Oferta expira em <span class="ml-1 text-[10px] text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <input v-model="form.offerExpiresAt" type="datetime-local"
              class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nº de páginas <span class="ml-1 text-[10px] text-slate-400 font-normal normal-case">(opcional)</span>
            </label>
            <input v-model="form.pageCount" type="number" min="0" step="1" placeholder="Ex: 12" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Categoria *</label>
            <select v-model="form.categoryId" required class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white">
              <option value="" disabled>Selecione uma categoria...</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descrição</label>
            <textarea v-model="form.description" rows="3" placeholder="Descreva o conteúdo do produto..." class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"></textarea>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vídeo YouTube</label>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <input v-model="form.youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=..." class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent" />
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vídeo Instagram (Reels)</label>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="ig2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f09433"/><stop offset="25%" stop-color="#e6683c"/><stop offset="50%" stop-color="#dc2743"/><stop offset="75%" stop-color="#cc2366"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig2)"/><circle cx="12" cy="12" r="4" stroke="white" stroke-width="1.5" fill="none"/><circle cx="17" cy="7" r="1" fill="white"/></svg>
              <input v-model="form.instagramUrl" type="url" placeholder="https://www.instagram.com/reel/..." class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" />
            </div>
          </div>
        </div>

        <!-- Delivery type toggle -->
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Tipo de Entrega *</label>
          <div class="flex gap-2">
            <button type="button" @click="form.deliveryType = 'pdf'"
              :class="['flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all', form.deliveryType === 'pdf' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-500 hover:border-slate-300']">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              PDF
            </button>
            <button type="button" @click="form.deliveryType = 'link'"
              :class="['flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all', form.deliveryType === 'link' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300']">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
              Link
            </button>
          </div>
        </div>

        <!-- Link input -->
        <div v-if="form.deliveryType === 'link'">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Link de Entrega *</label>
          <input v-model="form.deliveryLink" :required="form.deliveryType === 'link'" type="url"
            placeholder="https://drive.google.com/..."
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <p class="text-xs text-slate-400 mt-1">O cliente receberá esse link após o pagamento.</p>
        </div>

        <!-- File uploads (pdf mode) -->
        <div v-if="form.deliveryType === 'pdf'" class="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">PDF do Produto</label>
            <label :class="['flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors', pdfFile || existingFileKey ? 'border-violet-400 bg-violet-50 hover:bg-violet-100' : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50']">
              <svg class="w-6 h-6" :class="pdfFile || existingFileKey ? 'text-violet-500' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span class="text-xs font-medium text-center px-2" :class="pdfFile || existingFileKey ? 'text-violet-600' : 'text-slate-500'">
                {{ pdfFile ? pdfFile.name : existingFileKey ? '✓ PDF cadastrado' : 'Clique para enviar' }}
              </span>
              <input type="file" accept=".pdf" @change="onPdfSelected" class="hidden" />
            </label>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Imagem de Capa</label>
            <label class="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors overflow-hidden relative">
              <img v-if="coverPreview" :src="coverPreview" class="absolute inset-0 w-full h-full object-cover rounded-xl" />
              <template v-else>
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
                <span class="text-xs text-slate-500">Clique para enviar</span>
              </template>
              <input type="file" accept="image/*" @change="onCoverSelected" class="hidden" />
            </label>
          </div>
        </div>

        <!-- Cover for link type -->
        <div v-if="form.deliveryType === 'link'">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Imagem de Capa</label>
          <label class="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors overflow-hidden relative">
            <img v-if="coverPreview" :src="coverPreview" class="absolute inset-0 w-full h-full object-cover rounded-xl" />
            <template v-else>
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
              <span class="text-xs text-slate-500">Clique para enviar</span>
            </template>
            <input type="file" accept="image/*" @change="onCoverSelected" class="hidden" />
          </label>
        </div>

        <!-- Flags -->
        <div class="flex items-center gap-5 pt-1">
          <label class="flex items-center gap-2.5 cursor-pointer">
            <button type="button" @click="form.isActive = !form.isActive" :class="['w-10 h-5 rounded-full transition-colors relative', form.isActive ? 'bg-violet-600' : 'bg-slate-300']">
              <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.isActive ? 'translate-x-5' : 'translate-x-0.5']"></span>
            </button>
            <span class="text-sm text-slate-700">Ativo</span>
          </label>
          <label class="flex items-center gap-2.5 cursor-pointer">
            <button type="button" @click="form.isFeatured = !form.isFeatured" :class="['w-10 h-5 rounded-full transition-colors relative flex-shrink-0', form.isFeatured ? 'bg-amber-500' : 'bg-slate-300']">
              <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.isFeatured ? 'translate-x-5' : 'translate-x-0.5']"></span>
            </button>
            <span class="text-sm text-slate-700 leading-tight">★ Destaque <span class="text-xs text-slate-400">("Mais Vendidos")</span></span>
          </label>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMsg }}
        </div>

        <div class="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" :disabled="saving"
            class="flex-1 bg-violet-600 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ saving ? 'Salvando...' : editingProduct ? 'Salvar alterações' : 'Criar produto' }}
          </button>
          <button type="button" @click="modalOpen = false" class="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            Cancelar
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { databases, storage, DB_ID, COLLECTIONS, BUCKETS } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import AppModal from '@/components/ui/AppModal.vue';

const products = ref<any[]>([]);
const categories = ref<any[]>([]);
const search = ref('');
const statusFilter = ref('');
const categoryFilter = ref('');
const loadingProducts = ref(false);
const modalOpen = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const editingProduct = ref<any>(null);
const deleteModalOpen = ref(false);
const productToDelete = ref<any>(null);
const deleting = ref(false);
const pdfFile = ref<File | null>(null);
const coverFile = ref<File | null>(null);
const coverPreview = ref('');
const existingFileKey = ref('');

const form = reactive({
  name: '', slug: '', description: '', price: '', comparePrice: '', offerExpiresAt: '', pageCount: '',
  categoryId: '', isActive: true, isFeatured: false,
  deliveryType: 'pdf' as 'pdf' | 'link', deliveryLink: '', youtubeUrl: '', instagramUrl: '',
});

const statusFilters = [
  { value: '', label: 'Todos', activeClass: 'bg-slate-800 text-white' },
  { value: 'active', label: '✓ Ativos', activeClass: 'bg-emerald-600 text-white' },
  { value: 'inactive', label: 'Inativos', activeClass: 'bg-slate-500 text-white' },
  { value: 'featured', label: '★ Destaques', activeClass: 'bg-amber-500 text-white' },
  { value: 'no-cover', label: '⚠ Sem capa', activeClass: 'bg-red-500 text-white' },
];

function setStatusFilter(val: string) {
  statusFilter.value = val;
  categoryFilter.value = '';
  visibleCount.value = PAGE_SIZE;
}
function setCategoryFilter(id: string) {
  categoryFilter.value = categoryFilter.value === id ? '' : id;
  statusFilter.value = '';
  visibleCount.value = PAGE_SIZE;
}

const filteredProducts = computed(() => {
  let list = products.value;
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.slug ?? '').includes(q));
  }
  if (statusFilter.value === 'active') list = list.filter(p => p.isActive);
  else if (statusFilter.value === 'inactive') list = list.filter(p => !p.isActive);
  else if (statusFilter.value === 'featured') list = list.filter(p => p.isFeatured);
  else if (statusFilter.value === 'no-cover') list = list.filter(p => !p.coverImageUrl);
  if (categoryFilter.value) list = list.filter(p => p.categoryId === categoryFilter.value);
  return list;
});

const PAGE_SIZE = 24;
const visibleCount = ref(PAGE_SIZE);
const pagedProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));
const hasMore = computed(() => filteredProducts.value.length > visibleCount.value);
function loadMore() { visibleCount.value += PAGE_SIZE; }
watch([search, statusFilter, categoryFilter], () => { visibleCount.value = PAGE_SIZE; });

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}
function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}
function autoSlug() {
  if (!editingProduct.value && form.name && !form.slug) form.slug = toSlug(form.name);
}
async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base; let suffix = 2;
  while (true) {
    const queries = [Query.equal('slug', slug), Query.isNull('deletedAt'), Query.limit(1)];
    if (excludeId) queries.push(Query.notEqual('$id', excludeId));
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, queries);
    if (result.total === 0) return slug;
    slug = `${base}-${suffix++}`;
  }
}

function openCreate() {
  editingProduct.value = null;
  Object.assign(form, { name: '', slug: '', description: '', price: '', comparePrice: '', offerExpiresAt: '', pageCount: '', categoryId: '', isActive: true, isFeatured: false, deliveryType: 'pdf', deliveryLink: '', youtubeUrl: '', instagramUrl: '' });
  pdfFile.value = null; coverFile.value = null; coverPreview.value = ''; existingFileKey.value = ''; errorMsg.value = '';
  modalOpen.value = true;
}
function openEdit(product: any) {
  editingProduct.value = product;
  const expires = product.offerExpiresAt ? product.offerExpiresAt.substring(0, 16) : '';
  Object.assign(form, { name: product.name, slug: product.slug, description: product.description || '', price: product.price, comparePrice: product.comparePrice ?? '', offerExpiresAt: expires, pageCount: product.pageCount ?? '', categoryId: product.categoryId, isActive: product.isActive, isFeatured: product.isFeatured, deliveryType: product.deliveryType === 'LINK' ? 'link' : 'pdf', deliveryLink: product.deliveryLink || '', youtubeUrl: product.youtubeUrl || '', instagramUrl: product.instagramUrl || '' });
  pdfFile.value = null; coverFile.value = null; coverPreview.value = product.coverImageUrl || ''; existingFileKey.value = product.fileKey || ''; errorMsg.value = '';
  modalOpen.value = true;
}
function onPdfSelected(e: Event) { pdfFile.value = (e.target as HTMLInputElement).files?.[0] || null; }
function onCoverSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  coverFile.value = file;
  if (file) coverPreview.value = URL.createObjectURL(file);
}

async function saveProduct() {
  saving.value = true; errorMsg.value = '';
  try {
    let coverUrl = editingProduct.value?.coverImageUrl ?? '';
    let fileKey = editingProduct.value?.fileKey ?? '';
    let fileSize = editingProduct.value?.fileSize ?? 0;
    if (coverFile.value) {
      const uploadedCover = await storage.createFile(BUCKETS.PRODUCT_COVERS, ID.unique(), coverFile.value);
      coverUrl = storage.getFilePreview(BUCKETS.PRODUCT_COVERS, uploadedCover.$id).toString();
    }
    if (pdfFile.value) {
      const uploadedPdf = await storage.createFile(BUCKETS.PRODUCT_FILES, ID.unique(), pdfFile.value);
      fileKey = uploadedPdf.$id; fileSize = pdfFile.value.size;
    }
    const uniqueSlug = await ensureUniqueSlug(toSlug(form.slug || form.name), editingProduct.value?.$id);
    const payload: any = {
      name: form.name, slug: uniqueSlug, description: form.description,
      price: parseFloat(form.price), comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : null,
      offerExpiresAt: form.offerExpiresAt ? new Date(form.offerExpiresAt).toISOString() : null,
      categoryId: form.categoryId || null,
      pageCount: form.pageCount !== '' && form.pageCount != null ? parseInt(String(form.pageCount), 10) : null,
      isActive: form.isActive, isFeatured: form.isFeatured,
      deliveryType: form.deliveryType === 'link' ? 'LINK' : 'FILE',
      deliveryLink: form.deliveryType === 'link' ? form.deliveryLink : null,
      youtubeUrl: form.youtubeUrl || null, instagramUrl: form.instagramUrl || null,
      coverImageUrl: coverUrl, fileKey, fileSize,
    };
    if (editingProduct.value) {
      await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, editingProduct.value.$id, payload);
    } else {
      await databases.createDocument(DB_ID, COLLECTIONS.PRODUCTS, ID.unique(), payload);
    }
    await loadData(); modalOpen.value = false;
  } catch (err: any) {
    errorMsg.value = err?.message || 'Erro ao salvar produto.';
  } finally {
    saving.value = false;
  }
}

async function toggleActive(product: any) {
  await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, product.$id, { isActive: !product.isActive });
  await loadData();
}
function confirmDelete(product: any) { productToDelete.value = product; deleteModalOpen.value = true; }
async function deleteProduct() {
  if (!productToDelete.value) return;
  deleting.value = true;
  try {
    const items = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [Query.equal('productId', productToDelete.value.$id), Query.limit(500)]);
    await Promise.all(items.documents.map(i => databases.deleteDocument(DB_ID, COLLECTIONS.ORDER_ITEMS, i.$id)));
    await databases.deleteDocument(DB_ID, COLLECTIONS.PRODUCTS, productToDelete.value.$id);
    deleteModalOpen.value = false; productToDelete.value = null;
    await loadData();
  } finally {
    deleting.value = false;
  }
}
async function toggleFeatured(product: any) {
  await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, product.$id, { isFeatured: !product.isFeatured });
  await loadData();
}

async function loadData() {
  loadingProducts.value = true;
  try {
    const [prodsResult, catsResult] = await Promise.all([
      databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [Query.isNull('deletedAt'), Query.orderDesc('$createdAt'), Query.limit(300)]),
      databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [Query.orderAsc('sortOrder'), Query.limit(100)]),
    ]);
    const catMap = Object.fromEntries(catsResult.documents.map((c: any) => [c.$id, c.name]));
    products.value = prodsResult.documents.map((p: any) => ({
      ...p, id: p.$id,
      coverImageUrl: p.coverImageUrl, categoryId: p.categoryId,
      isActive: p.isActive, isFeatured: p.isFeatured, salesCount: p.salesCount,
      category: p.categoryId ? { id: p.categoryId, name: catMap[p.categoryId] ?? '' } : null,
    }));
    categories.value = catsResult.documents.map((c: any) => ({ ...c, id: c.$id }));
  } finally {
    loadingProducts.value = false;
  }
}

onMounted(loadData);
</script>
