<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Produtos</h1>
        <p class="text-sm text-slate-500 mt-0.5">{{ filteredProducts.length }} produto{{ filteredProducts.length !== 1 ? 's' : '' }}</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Novo Produto
      </button>
    </div>

    <!-- Table card -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <!-- Toolbar -->
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <div class="relative flex-1 max-w-xs">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input v-model="search" placeholder="Buscar produtos..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Produto</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Preço</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Vendas</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="p in filteredProducts" :key="p.id" class="group hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                    <img v-if="p.coverImageUrl" :src="p.coverImageUrl" :alt="p.name" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate max-w-[180px]">{{ p.name }}</p>
                    <p class="text-xs text-slate-400 font-mono mt-0.5">{{ p.slug }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 hidden sm:table-cell">
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
import { ref, reactive, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import AppModal from '@/components/ui/AppModal.vue';
import { v4 as uuidv4 } from 'uuid';

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
  name: '', slug: '', description: '', price: '',
  categoryId: '', isActive: true, isFeatured: false,
  deliveryType: 'pdf' as 'pdf' | 'link', deliveryLink: '',
});

const filteredProducts = computed(() =>
  products.value.filter((p: any) =>
    !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

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
    let query = supabase.from('products').select('id').eq('slug', slug).is('deleted_at', null);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${suffix++}`;
  }
}

function openCreate() {
  editingProduct.value = null;
  Object.assign(form, { name: '', slug: '', description: '', price: '', categoryId: '', isActive: true, isFeatured: false, deliveryType: 'pdf', deliveryLink: '' });
  pdfFile.value = null; coverFile.value = null; coverPreview.value = ''; existingFileKey.value = ''; errorMsg.value = '';
  modalOpen.value = true;
}

function openEdit(product: any) {
  editingProduct.value = product;
  Object.assign(form, { name: product.name, slug: product.slug, description: product.description || '', price: product.price, categoryId: product.category_id, isActive: product.is_active, isFeatured: product.is_featured, deliveryType: product.delivery_type || 'pdf', deliveryLink: product.delivery_link || '' });
  pdfFile.value = null; coverFile.value = null; coverPreview.value = product.cover_image_url || ''; existingFileKey.value = product.file_key || ''; errorMsg.value = '';
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
    let productId: string;
    let coverUrl = editingProduct.value?.cover_image_url ?? '';
    let fileKey = editingProduct.value?.file_key ?? '';
    let fileSize = editingProduct.value?.file_size ?? 0;

    // Upload cover image first
    if (coverFile.value) {
      const ext = coverFile.value.name.split('.').pop() ?? 'jpg';
      const path = `${uuidv4()}.${ext}`;
      const { error } = await supabase.storage.from('product-covers').upload(path, coverFile.value, { contentType: coverFile.value.type });
      if (error) throw new Error('Erro ao fazer upload da capa.');
      const { data: urlData } = supabase.storage.from('product-covers').getPublicUrl(path);
      coverUrl = urlData.publicUrl;
    }

    // Upload PDF
    if (pdfFile.value) {
      const path = `${uuidv4()}.pdf`;
      const { error } = await supabase.storage.from('product-files').upload(path, pdfFile.value, { contentType: 'application/pdf' });
      if (error) throw new Error('Erro ao fazer upload do PDF.');
      fileKey = path;
      fileSize = pdfFile.value.size;
    }

    const uniqueSlug = await ensureUniqueSlug(
      toSlug(form.slug || form.name),
      editingProduct.value?.id,
    );

    const payload: any = {
      name: form.name, slug: uniqueSlug, description: form.description,
      price: parseFloat(form.price), category_id: form.categoryId || null,
      is_active: form.isActive, is_featured: form.isFeatured,
      delivery_type: form.deliveryType,
      delivery_link: form.deliveryType === 'link' ? form.deliveryLink : null,
      cover_image_url: coverUrl, file_key: fileKey, file_size: fileSize,
      updated_at: new Date().toISOString(),
    };

    if (editingProduct.value) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.value.id);
      if (error) throw new Error(error.message);
      productId = editingProduct.value.id;
    } else {
      const { data, error } = await supabase.from('products').insert(payload).select().single();
      if (error) throw new Error(error.message);
      productId = data.id;
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
  await supabase.from('products').update({ is_active: !product.is_active, updated_at: new Date().toISOString() }).eq('id', product.id);
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
    await supabase.from('order_items').delete().eq('product_id', productToDelete.value.id);
    await supabase.from('products').delete().eq('id', productToDelete.value.id);
    deleteModalOpen.value = false;
    productToDelete.value = null;
    await loadData();
  } finally {
    deleting.value = false;
  }
}

async function toggleFeatured(product: any) {
  await supabase.from('products').update({ is_featured: !product.isFeatured, updated_at: new Date().toISOString() }).eq('id', product.id);
  await loadData();
}

async function loadData() {
  const [{ data: prods }, { data: cats }] = await Promise.all([
    supabase.from('products').select('*, categories(id, name, slug)').is('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('categories').select('*').order('sort_order'),
  ]);
  products.value = (prods ?? []).map((p: any) => ({ ...p, coverImageUrl: p.cover_image_url, categoryId: p.category_id, isActive: p.is_active, isFeatured: p.is_featured, salesCount: p.sales_count, category: p.categories }));
  categories.value = cats ?? [];
}

onMounted(loadData);
</script>
