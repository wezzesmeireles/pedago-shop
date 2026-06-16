<template>
  <div class="space-y-4">

    <!-- ── Header ── -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-2xl font-black text-slate-900">Categorias</h1>
        <p class="text-sm text-slate-500 mt-0.5">Organize os produtos do catálogo</p>
      </div>
      <button @click="openCreate"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-sm hover:shadow-violet-200 transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Nova Categoria
      </button>
    </div>

    <!-- ── Stats cards ── -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="text-left p-4 rounded-2xl bg-white border border-transparent shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total</p>
        <p class="text-3xl font-black text-slate-900 leading-none">{{ loadingCategories ? '—' : categories.length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">categorias</p>
      </div>
      <div class="text-left p-4 rounded-2xl bg-white border border-transparent shadow-sm">
        <p class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">✓ Ativas</p>
        <p class="text-3xl font-black text-emerald-700 leading-none">{{ loadingCategories ? '—' : categories.filter(c => c.isActive).length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">no catálogo</p>
      </div>
      <div class="text-left p-4 rounded-2xl bg-white border border-transparent shadow-sm">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Inativas</p>
        <p class="text-3xl font-black text-slate-700 leading-none">{{ loadingCategories ? '—' : categories.filter(c => !c.isActive).length }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">ocultas</p>
      </div>
      <div class="text-left p-4 rounded-2xl bg-white border border-transparent shadow-sm">
        <p class="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-1.5">📦 Produtos</p>
        <p class="text-3xl font-black text-violet-700 leading-none">{{ loadingCategories ? '—' : totalProducts }}</p>
        <p class="text-[11px] text-slate-400 mt-1.5">catalogados</p>
      </div>
    </div>

    <!-- ── Grid de categorias ── -->

    <!-- Skeleton -->
    <div v-if="loadingCategories" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0"></div>
          <div class="flex-1">
            <div class="h-4 bg-slate-100 rounded w-28 mb-1.5"></div>
            <div class="h-3 bg-slate-50 rounded w-20"></div>
          </div>
          <div class="h-5 bg-slate-100 rounded-full w-14"></div>
        </div>
        <div class="h-3 bg-slate-50 rounded w-full mb-1"></div>
        <div class="h-3 bg-slate-50 rounded w-3/4 mb-4"></div>
        <div class="flex items-center justify-between pt-3 border-t border-slate-50">
          <div class="h-5 bg-slate-100 rounded-lg w-20"></div>
          <div class="flex gap-1">
            <div class="w-7 h-7 bg-slate-100 rounded-lg"></div>
            <div class="w-7 h-7 bg-slate-100 rounded-lg"></div>
            <div class="w-7 h-7 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="categories.length === 0"
      class="bg-white rounded-2xl border border-dashed border-slate-200 py-20 text-center">
      <div class="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
      </div>
      <p class="text-sm font-bold text-slate-600 mb-1">Nenhuma categoria criada</p>
      <p class="text-xs text-slate-400 mb-5">Crie categorias para organizar seus produtos</p>
      <button @click="openCreate" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-all">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Criar primeira categoria
      </button>
    </div>

    <!-- Cards grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="(cat, idx) in categories" :key="cat.id"
        class="bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-violet-200 hover:shadow-md transition-all group flex flex-col overflow-hidden">

        <!-- Accent stripe + top row -->
        <div :style="{ background: accentColor(idx) }" class="h-1 w-full flex-shrink-0"></div>

        <div class="p-5 flex flex-col flex-1">
          <!-- Top: icon + info + status -->
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <!-- Order number + icon/image -->
              <div class="relative flex-shrink-0">
                <div class="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
                  :style="{ background: accentBg(idx) }">
                  <img v-if="cat.imageUrl" :src="cat.imageUrl" :alt="cat.name" class="w-full h-full object-cover" />
                  <svg v-else class="w-6 h-6" :style="{ color: accentFg(idx) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                </div>
                <span class="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {{ idx + 1 }}
                </span>
              </div>
              <div class="min-w-0">
                <p class="font-bold text-slate-900 leading-tight">{{ cat.name }}</p>
                <p class="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]">{{ cat.slug }}</p>
              </div>
            </div>
            <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 whitespace-nowrap', cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
              <span :class="['w-1 h-1 rounded-full', cat.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
              {{ cat.isActive ? 'Ativa' : 'Inativa' }}
            </span>
          </div>

          <!-- Description -->
          <p v-if="cat.description" class="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{{ cat.description }}</p>
          <div v-else class="flex-1"></div>

          <!-- Footer: product count + actions -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-50 mt-2">
            <!-- Product count -->
            <div class="flex items-center gap-1.5">
              <div class="w-6 h-6 rounded-lg flex items-center justify-center" :style="{ background: accentBg(idx) }">
                <svg class="w-3 h-3" :style="{ color: accentFg(idx) }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <span class="text-sm font-black" :style="{ color: accentFg(idx) }">{{ cat._count?.products ?? 0 }}</span>
              <span class="text-xs text-slate-400">produto{{ cat._count?.products !== 1 ? 's' : '' }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-0.5">
              <button @click="reorder(cat, 'up')" :disabled="idx === 0"
                class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed" title="Mover para cima">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
              </button>
              <button @click="reorder(cat, 'down')" :disabled="idx === categories.length - 1"
                class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-25 disabled:cursor-not-allowed" title="Mover para baixo">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
              </button>
              <button @click="openEdit(cat)"
                class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Editar">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button @click="toggleActive(cat)"
                :class="['w-7 h-7 flex items-center justify-center rounded-lg transition-colors', cat.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50']"
                :title="cat.isActive ? 'Desativar' : 'Ativar'">
                <svg v-if="cat.isActive" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </button>
              <button v-if="(cat._count?.products ?? 0) === 0" @click="confirmDelete(cat)"
                class="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Apagar (sem produtos)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Delete Modal ── -->
    <AppModal v-model="deleteModalOpen" title="Apagar Categoria">
      <div class="space-y-4">
        <div v-if="categoryToDelete" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div class="w-10 h-10 rounded-xl overflow-hidden bg-violet-50 flex items-center justify-center flex-shrink-0">
            <img v-if="categoryToDelete.imageUrl" :src="categoryToDelete.imageUrl" class="w-full h-full object-cover" />
            <svg v-else class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-900">{{ categoryToDelete.name }}</p>
            <p class="text-xs text-slate-400 font-mono">{{ categoryToDelete.slug }}</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3.5 bg-red-50 rounded-xl border border-red-100">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <p class="text-sm text-red-700">Esta ação <strong>não pode ser desfeita</strong>. A categoria será apagada permanentemente.</p>
        </div>
        <div class="flex gap-3">
          <button @click="deleteCategory" :disabled="deleting"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="deleting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ deleting ? 'Apagando...' : 'Sim, apagar' }}
          </button>
          <button @click="deleteModalOpen = false" class="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
        </div>
      </div>
    </AppModal>

    <!-- ── Create / Edit Modal ── -->
    <AppModal v-model="modalOpen" :title="editing ? 'Editar Categoria' : 'Nova Categoria'">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nome *</label>
          <input v-model="form.name" required @blur="autoSlug" placeholder="Ex: Alfabetização"
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Slug *</label>
          <input v-model="form.slug" required placeholder="alfabetizacao"
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          <p class="text-xs text-slate-400 mt-1">Identificador único na URL. Ex: <code class="bg-slate-100 px-1 rounded">matematica</code></p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descrição</label>
          <textarea v-model="form.description" rows="2" placeholder="Descrição curta da categoria..."
            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">URL da Imagem <span class="font-normal text-slate-400 normal-case tracking-normal">(opcional)</span></label>
          <div class="flex gap-2">
            <input v-model="form.imageUrl" type="url" placeholder="https://..."
              class="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            <div v-if="form.imageUrl" class="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0">
              <img :src="form.imageUrl" class="w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display='none'" />
            </div>
          </div>
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMsg }}
        </div>

        <div class="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" :disabled="saving"
            class="flex-1 bg-violet-600 text-white font-bold text-sm py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar categoria' }}
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
import { ref, reactive, computed, onMounted } from 'vue';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import AppModal from '@/components/ui/AppModal.vue';

const categories = ref<any[]>([]);
const loadingCategories = ref(false);
const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<any>(null);
const errorMsg = ref('');
const form = reactive({ name: '', slug: '', description: '', imageUrl: '' });

const deleteModalOpen = ref(false);
const categoryToDelete = ref<any>(null);
const deleting = ref(false);

const totalProducts = computed(() => categories.value.reduce((s, c) => s + (c._count?.products ?? 0), 0));

// Palette of accent colors cycling by index
const ACCENTS = [
  { stripe: '#7c3aed', bg: '#f5f3ff', fg: '#6d28d9' },
  { stripe: '#0891b2', bg: '#ecfeff', fg: '#0e7490' },
  { stripe: '#d97706', bg: '#fffbeb', fg: '#b45309' },
  { stripe: '#059669', bg: '#ecfdf5', fg: '#047857' },
  { stripe: '#db2777', bg: '#fdf2f8', fg: '#be185d' },
  { stripe: '#dc2626', bg: '#fef2f2', fg: '#b91c1c' },
];
function accentColor(i: number) { return ACCENTS[i % ACCENTS.length].stripe; }
function accentBg(i: number) { return ACCENTS[i % ACCENTS.length].bg; }
function accentFg(i: number) { return ACCENTS[i % ACCENTS.length].fg; }

function toSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}
function autoSlug() {
  if (!editing.value && form.name && !form.slug) form.slug = toSlug(form.name);
}

function openCreate() {
  editing.value = null;
  Object.assign(form, { name: '', slug: '', description: '', imageUrl: '' });
  errorMsg.value = '';
  modalOpen.value = true;
}
function openEdit(cat: any) {
  editing.value = cat;
  Object.assign(form, { name: cat.name, slug: cat.slug, description: cat.description || '', imageUrl: cat.imageUrl || '' });
  errorMsg.value = '';
  modalOpen.value = true;
}
function confirmDelete(cat: any) {
  categoryToDelete.value = cat;
  deleteModalOpen.value = true;
}

async function save() {
  saving.value = true; errorMsg.value = '';
  try {
    const payload: any = {
      name: form.name, slug: form.slug,
      description: form.description || null,
      imageUrl: form.imageUrl || null,
    };
    if (editing.value) {
      await databases.updateDocument(DB_ID, COLLECTIONS.CATEGORIES, editing.value.$id, payload);
    } else {
      const existing = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [Query.equal('slug', form.slug), Query.limit(1)]);
      if (existing.total > 0) throw new Error('Slug já existe. Escolha um diferente.');
      await databases.createDocument(DB_ID, COLLECTIONS.CATEGORIES, ID.unique(), { ...payload, isActive: true });
    }
    await loadCategories();
    modalOpen.value = false;
  } catch (err: any) {
    errorMsg.value = err?.message || 'Erro ao salvar categoria.';
  } finally {
    saving.value = false;
  }
}

async function toggleActive(cat: any) {
  await databases.updateDocument(DB_ID, COLLECTIONS.CATEGORIES, cat.$id, { isActive: !cat.isActive });
  await loadCategories();
}

async function deleteCategory() {
  if (!categoryToDelete.value) return;
  deleting.value = true;
  try {
    await databases.deleteDocument(DB_ID, COLLECTIONS.CATEGORIES, categoryToDelete.value.$id);
    deleteModalOpen.value = false;
    categoryToDelete.value = null;
    await loadCategories();
  } catch (err: any) {
    errorMsg.value = err?.message || 'Erro ao apagar categoria.';
  } finally {
    deleting.value = false;
  }
}

async function loadCategories() {
  loadingCategories.value = true;
  try {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
      Query.orderAsc('sortOrder'), Query.orderAsc('$createdAt'), Query.limit(100),
    ]);
    const cats = await Promise.all(result.documents.map(async (c: any) => {
      const prodCount = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
        Query.equal('categoryId', c.$id), Query.isNull('deletedAt'), Query.limit(1),
      ]);
      return { ...c, id: c.$id, isActive: c.isActive, imageUrl: c.imageUrl, _count: { products: prodCount.total } };
    }));
    categories.value = cats;
  } finally {
    loadingCategories.value = false;
  }
}

async function reorder(cat: any, direction: 'up' | 'down') {
  const idx = categories.value.findIndex(c => c.$id === cat.$id);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= categories.value.length) return;
  const arr = [...categories.value];
  [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
  const updates = arr
    .map((c, i) => (c.sortOrder === i ? null : databases.updateDocument(DB_ID, COLLECTIONS.CATEGORIES, c.$id, { sortOrder: i })))
    .filter(Boolean);
  await Promise.all(updates as Promise<any>[]);
  await loadCategories();
}

onMounted(loadCategories);
</script>
