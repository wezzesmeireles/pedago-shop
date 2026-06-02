<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Produtos</h1>
        <p class="text-sm text-slate-500 mt-0.5">{{ filteredProducts.length }} produto{{ filteredProducts.length !== 1 ? 's' : '' }}</p>
      </div>
      <button @click="openCreate" class="btn-pill text-sm px-5 py-2.5">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Novo Produto
      </button>
    </div>

    <!-- Search bar -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div class="relative flex-1 max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input v-model="search" placeholder="Buscar produtos..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
      </div>

      <!-- Mobile Cards (md:hidden) -->
      <div class="md:hidden divide-y divide-slate-50">
        <div v-if="filteredProducts.length === 0" class="px-5 py-12 text-center text-slate-400 text-sm">Nenhum produto encontrado</div>
        <div v-for="p in pagedProducts" :key="p.id" class="p-4">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
              <img v-if="p.coverImageUrl" :src="p.coverImageUrl" :alt="p.name" loading="lazy" decoding="async" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 leading-snug mb-0.5">{{ p.name }}</p>
              <div class="flex flex-wrap items-center gap-1.5 mt-1">
                <span class="text-sm font-bold text-violet-600">{{ formatPrice(p.price) }}</span>
                <span v-if="p.category?.name" class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-medium">{{ p.category.name }}</span>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
                  <span :class="['w-1.5 h-1.5 rounded-full', p.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                  {{ p.isActive ? 'Ativo' : 'Inativo' }}
                </span>
                <span v-if="p.isFeatured" class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">★ Destaque</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(p)" class="flex-1 py-2 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-colors">Editar</button>
            <button @click="toggleFeatured(p)" :class="['px-3 py-2 rounded-xl transition-colors text-xs font-semibold', p.isFeatured ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500']">★</button>
            <button @click="toggleActive(p)" :class="['px-3 py-2 rounded-xl transition-colors text-xs font-semibold', p.isActive ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600']">
              {{ p.isActive ? 'Desativar' : 'Ativar' }}
            </button>
            <button @click="confirmDelete(p)" class="px-3 py-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </div>
        <button v-if="hasMore" @click="loadMore"
          class="w-full py-3.5 text-sm font-semibold text-violet-600 bg-violet-50 active:bg-violet-100 transition-colors">
          Carregar mais ({{ filteredProducts.length - visibleCount }} restantes)
        </button>
      </div>

      <!-- Desktop Table (hidden md:block) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoria</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Vendas</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="p in pagedProducts" :key="p.id" class="group hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img v-if="p.coverImageUrl" :src="p.coverImageUrl" :alt="p.name" loading="lazy" decoding="async" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/></svg>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{{ p.name }}</p>
                    <p class="text-xs text-slate-400 font-mono mt-0.5">{{ p.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5">
                <span class="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">{{ p.category?.name ?? '—' }}</span>
              </td>
              <td class="px-4 py-3.5">
                <span class="text-sm font-bold text-violet-600">{{ formatPrice(p.price) }}</span>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <span class="text-sm text-slate-600">{{ p.salesCount ?? 0 }}</span>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex items-center gap-1.5">
                  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
                    <span :class="['w-1.5 h-1.5 rounded-full', p.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
                    {{ p.isActive ? 'Ativo' : 'Inativo' }}
                  </span>
                  <span v-if="p.isFeatured" class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">★</span>
                </div>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="toggleFeatured(p)" :class="['p-1.5 rounded-lg transition-colors', p.isFeatured ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50']" :title="p.isFeatured ? 'Remover destaque' : 'Colocar em destaque'">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </button>
                  <button @click="openEdit(p)" class="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Editar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click="toggleActive(p)" :class="['p-1.5 rounded-lg transition-colors', p.isActive ? 'text-slate-500 hover:text-red-500 hover:bg-red-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50']" :title="p.isActive ? 'Desativar' : 'Ativar'">
                    <svg v-if="p.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                  <button @click="confirmDelete(p)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Apagar produto">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredProducts.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-slate-400 text-sm">Nenhum produto encontrado</td>
            </tr>
          </tbody>
        </table>
        <button v-if="hasMore" @click="loadMore"
          class="w-full py-3 text-sm font-semibold text-violet-600 hover:bg-violet-50 border-t border-slate-100 transition-colors">
          Carregar mais ({{ filteredProducts.length - visibleCount }} restantes)
        </button>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <AppModal v-model="deleteModalOpen" title="Apagar Produto">
      <div class="space-y-4">
        <div class="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <div>
            <p class="text-sm font-semibold text-red-700">Esta ação não pode ser desfeita</p>
            <p class="text-sm text-red-600 mt-0.5">O produto <strong>"{{ productToDelete?.name }}"</strong> será apagado permanentemente do banco de dados.</p>
          </div>
        </div>
        <div class="flex gap-3 pt-1">
          <button @click="deleteProduct" :disabled="deleting" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ deleting ? 'Apagando...' : 'Sim, apagar' }}
          </button>
          <button @click="deleteModalOpen = false" class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
        </div>
      </div>
    </AppModal>

    <!-- Modal -->
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
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Preço (R$) *</label>
            <input v-model="form.price" type="number" step="0.01" min="0" required placeholder="29.90" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Nº de páginas
              <span class="ml-1 text-[10px] text-slate-400 font-normal normal-case tracking-normal">(opcional)</span>
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
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vídeo YouTube (como fazer a atividade)</label>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <input v-model="form.youtubeUrl" type="url" placeholder="https://www.youtube.com/watch?v=..." class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent" />
            </div>
            <p class="text-xs text-slate-400 mt-1">Cole o link do YouTube — aparece na página do produto.</p>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vídeo Instagram (Reels ou Post)</label>
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs><linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f09433"/><stop offset="25%" stop-color="#e6683c"/><stop offset="50%" stop-color="#dc2743"/><stop offset="75%" stop-color="#cc2366"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs>
                <rect width="24" height="24" rx="6" fill="url(#ig)"/>
                <circle cx="12" cy="12" r="4" stroke="white" stroke-width="1.5" fill="none"/>
                <circle cx="17" cy="7" r="1" fill="white"/>
              </svg>
              <input v-model="form.instagramUrl" type="url" placeholder="https://www.instagram.com/reel/..." class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent" />
            </div>
            <p class="text-xs text-slate-400 mt-1">Cole o link do Reels ou post do Instagram — aparece na página do produto.</p>
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

        <!-- Link input (only when delivery_type = link) -->
        <div v-if="form.deliveryType === 'link'">
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Link de Entrega *</label>
          <input v-model="form.deliveryLink" :required="form.deliveryType === 'link'" type="url"
            placeholder="https://drive.google.com/..."
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <p class="text-xs text-slate-400 mt-1">O cliente receberá esse link após o pagamento.</p>
        </div>

        <!-- File uploads (only when delivery_type = pdf) -->
        <div v-if="form.deliveryType === 'pdf'" class="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">PDF do Produto</label>
            <label :class="['flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors', pdfFile || existingFileKey ? 'border-violet-400 bg-violet-50 hover:bg-violet-100' : 'border-slate-200 hover:border-violet-400 hover:bg-violet-50']">
              <svg class="w-6 h-6" :class="pdfFile || existingFileKey ? 'text-violet-500' : 'text-slate-400'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span class="text-xs font-medium text-center px-2" :class="pdfFile || existingFileKey ? 'text-violet-600' : 'text-slate-500'">
                {{ pdfFile ? pdfFile.name : existingFileKey ? '✓ PDF cadastrado — clique para trocar' : 'Clique para enviar' }}
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

        <!-- Capa para produto tipo link -->
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
            <button type="button" @click="form.isFeatured = !form.isFeatured" :class="['w-10 h-5 rounded-full transition-colors relative', form.isFeatured ? 'bg-amber-500' : 'bg-slate-300']">
              <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', form.isFeatured ? 'translate-x-5' : 'translate-x-0.5']"></span>
            </button>
            <span class="text-sm text-slate-700">Destaque</span>
          </label>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMsg }}
        </div>

        <div class="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" :disabled="saving" class="flex-1 bg-violet-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ saving ? 'Salvando...' : editingProduct ? 'Salvar alterações' : 'Criar produto' }}
          </button>
          <button type="button" @click="modalOpen = false" class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
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
  name: '', slug: '', description: '', price: '', pageCount: '',
  categoryId: '', isActive: true, isFeatured: false,
  deliveryType: 'pdf' as 'pdf' | 'link', deliveryLink: '', youtubeUrl: '', instagramUrl: '',
});

const filteredProducts = computed(() =>
  products.value.filter((p: any) =>
    !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

// Render incrementally so we don't mount 100+ cards/images at once (mobile perf)
const PAGE_SIZE = 24;
const visibleCount = ref(PAGE_SIZE);
const pagedProducts = computed(() => filteredProducts.value.slice(0, visibleCount.value));
const hasMore = computed(() => filteredProducts.value.length > visibleCount.value);
function loadMore() { visibleCount.value += PAGE_SIZE; }
watch(search, () => { visibleCount.value = PAGE_SIZE; });

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function toSlug(name: string) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

function autoSlug() {
  if (!editingProduct.value && form.name && !form.slug) {
    form.slug = toSlug(form.name);
  }
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 2;
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
  Object.assign(form, { name: '', slug: '', description: '', price: '', pageCount: '', categoryId: '', isActive: true, isFeatured: false, deliveryType: 'pdf', deliveryLink: '', youtubeUrl: '', instagramUrl: '' });
  pdfFile.value = null; coverFile.value = null; coverPreview.value = ''; existingFileKey.value = ''; errorMsg.value = '';
  modalOpen.value = true;
}

function openEdit(product: any) {
  editingProduct.value = product;
  Object.assign(form, { name: product.name, slug: product.slug, description: product.description || '', price: product.price, pageCount: product.pageCount ?? '', categoryId: product.categoryId, isActive: product.isActive, isFeatured: product.isFeatured, deliveryType: product.deliveryType || 'pdf', deliveryLink: product.deliveryLink || '', youtubeUrl: product.youtubeUrl || '', instagramUrl: product.instagramUrl || '' });
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
  saving.value = true;
  errorMsg.value = '';
  try {
    let coverUrl = editingProduct.value?.coverImageUrl ?? '';
    let fileKey = editingProduct.value?.fileKey ?? '';
    let fileSize = editingProduct.value?.fileSize ?? 0;

    // Upload cover image first
    if (coverFile.value) {
      const uploadedCover = await storage.createFile(BUCKETS.PRODUCT_COVERS, ID.unique(), coverFile.value);
      coverUrl = storage.getFilePreview(BUCKETS.PRODUCT_COVERS, uploadedCover.$id).toString();
    }

    // Upload PDF
    if (pdfFile.value) {
      const uploadedPdf = await storage.createFile(BUCKETS.PRODUCT_FILES, ID.unique(), pdfFile.value);
      fileKey = uploadedPdf.$id;
      fileSize = pdfFile.value.size;
    }

    const uniqueSlug = await ensureUniqueSlug(
      toSlug(form.slug || form.name),
      editingProduct.value?.$id,
    );

    const payload: any = {
      name: form.name, slug: uniqueSlug, description: form.description,
      price: parseFloat(form.price), categoryId: form.categoryId || null,
      pageCount: form.pageCount !== '' && form.pageCount != null ? parseInt(String(form.pageCount), 10) : null,
      isActive: form.isActive, isFeatured: form.isFeatured,
      deliveryType: form.deliveryType,
      deliveryLink: form.deliveryType === 'link' ? form.deliveryLink : null,
      youtubeUrl: form.youtubeUrl || null,
      instagramUrl: form.instagramUrl || null,
      coverImageUrl: coverUrl, fileKey, fileSize,
    };

    if (editingProduct.value) {
      await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, editingProduct.value.$id, payload);
    } else {
      await databases.createDocument(DB_ID, COLLECTIONS.PRODUCTS, ID.unique(), payload);
    }

    await loadData();
    modalOpen.value = false;
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

function confirmDelete(product: any) {
  productToDelete.value = product;
  deleteModalOpen.value = true;
}

async function deleteProduct() {
  if (!productToDelete.value) return;
  deleting.value = true;
  try {
    // Delete related order items first
    const items = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [Query.equal('productId', productToDelete.value.$id), Query.limit(500)]);
    await Promise.all(items.documents.map(i => databases.deleteDocument(DB_ID, COLLECTIONS.ORDER_ITEMS, i.$id)));
    await databases.deleteDocument(DB_ID, COLLECTIONS.PRODUCTS, productToDelete.value.$id);
    deleteModalOpen.value = false;
    productToDelete.value = null;
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
  const [prodsResult, catsResult] = await Promise.all([
    databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [Query.isNull('deletedAt'), Query.orderDesc('$createdAt'), Query.limit(300)]),
    databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [Query.orderAsc('sortOrder'), Query.limit(100)]),
  ]);
  const catMap = Object.fromEntries(catsResult.documents.map((c: any) => [c.$id, c.name]));
  products.value = prodsResult.documents.map((p: any) => ({
    ...p,
    id: p.$id,
    coverImageUrl: p.coverImageUrl,
    categoryId: p.categoryId,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    salesCount: p.salesCount,
    category: p.categoryId ? { id: p.categoryId, name: catMap[p.categoryId] ?? '' } : null,
  }));
  categories.value = catsResult.documents.map((c: any) => ({ ...c, id: c.$id }));
}

onMounted(loadData);
</script>
