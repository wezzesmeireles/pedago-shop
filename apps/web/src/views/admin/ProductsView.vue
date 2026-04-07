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
                  <button @click="openEdit(p)" class="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Editar">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button @click="toggleActive(p)" :class="['p-1.5 rounded-lg transition-colors', p.isActive ? 'text-slate-500 hover:text-red-500 hover:bg-red-50' : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50']" :title="p.isActive ? 'Desativar' : 'Ativar'">
                    <svg v-if="p.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
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

        <!-- File uploads -->
        <div class="grid grid-cols-2 gap-4 pt-1">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">PDF do Produto</label>
            <label class="flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span class="text-xs text-slate-500">{{ pdfFile ? pdfFile.name : 'Clique para enviar' }}</span>
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
import api from '@/services/api';
import AppModal from '@/components/ui/AppModal.vue';

const products = ref([]);
const categories = ref([]);
const search = ref('');
const modalOpen = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const editingProduct = ref<any>(null);
const pdfFile = ref<File | null>(null);
const coverFile = ref<File | null>(null);
const coverPreview = ref('');

const form = reactive({
  name: '', slug: '', description: '', price: '',
  categoryId: '', isActive: true, isFeatured: false,
});

const filteredProducts = computed(() =>
  products.value.filter((p: any) =>
    !search.value || p.name.toLowerCase().includes(search.value.toLowerCase()),
  ),
);

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

function autoSlug() {
  if (!editingProduct.value && form.name && !form.slug) {
    form.slug = form.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
  }
}

function openCreate() {
  editingProduct.value = null;
  Object.assign(form, { name: '', slug: '', description: '', price: '', categoryId: '', isActive: true, isFeatured: false });
  pdfFile.value = null;
  coverFile.value = null;
  coverPreview.value = '';
  errorMsg.value = '';
  modalOpen.value = true;
}

function openEdit(product: any) {
  editingProduct.value = product;
  Object.assign(form, {
    name: product.name, slug: product.slug,
    description: product.description || '',
    price: product.price,
    categoryId: product.categoryId,
    isActive: product.isActive, isFeatured: product.isFeatured,
  });
  pdfFile.value = null;
  coverFile.value = null;
  coverPreview.value = product.coverImageUrl || '';
  errorMsg.value = '';
  modalOpen.value = true;
}

function onPdfSelected(e: Event) {
  pdfFile.value = (e.target as HTMLInputElement).files?.[0] || null;
}

function onCoverSelected(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] || null;
  coverFile.value = file;
  if (file) coverPreview.value = URL.createObjectURL(file);
}

async function saveProduct() {
  saving.value = true;
  errorMsg.value = '';
  try {
    const payload: any = { ...form, price: parseFloat(form.price) };
    let productId: string;

    if (editingProduct.value) {
      await api.patch(`/products/${editingProduct.value.id}`, payload);
      productId = editingProduct.value.id;
    } else {
      payload.r2FileKey = '';
      const res = await api.post('/products', payload);
      productId = res.data.id;
    }

    if (pdfFile.value) {
      const fd = new FormData();
      fd.append('file', pdfFile.value);
      await api.post(`/products/${productId}/upload-pdf`, fd);
    }
    if (coverFile.value) {
      const fd = new FormData();
      fd.append('file', coverFile.value);
      await api.post(`/products/${productId}/upload-cover`, fd);
    }

    await loadData();
    modalOpen.value = false;
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message || 'Erro ao salvar produto.';
  } finally {
    saving.value = false;
  }
}

async function toggleActive(product: any) {
  await api.patch(`/products/${product.id}`, { isActive: !product.isActive });
  await loadData();
}

async function loadData() {
  const [prodRes, catRes] = await Promise.all([
    api.get('/products', { params: { limit: 100 } }),
    api.get('/categories'),
  ]);
  products.value = prodRes.data.items;
  categories.value = catRes.data;
}

onMounted(loadData);
</script>
