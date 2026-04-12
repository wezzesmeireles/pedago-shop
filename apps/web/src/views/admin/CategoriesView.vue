<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Categorias</h1>
        <p class="text-sm text-slate-500 mt-0.5">{{ categories.length }} categoria{{ categories.length !== 1 ? 's' : '' }}</p>
      </div>
      <button @click="openCreate" class="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Nova Categoria
      </button>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div v-for="cat in categories" :key="cat.id"
        class="bg-white rounded-2xl border border-slate-200 p-5 hover:border-violet-300 hover:shadow-sm transition-all group">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <!-- Icon or image -->
            <div class="w-11 h-11 rounded-xl overflow-hidden bg-violet-50 flex-shrink-0 flex items-center justify-center">
              <img v-if="cat.imageUrl" :src="cat.imageUrl" :alt="cat.name" class="w-full h-full object-cover" />
              <svg v-else class="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            </div>
            <div>
              <p class="font-semibold text-slate-900">{{ cat.name }}</p>
              <p class="text-xs text-slate-400 font-mono mt-0.5">{{ cat.slug }}</p>
            </div>
          </div>
          <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0', cat.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
            <span :class="['w-1.5 h-1.5 rounded-full', cat.isActive ? 'bg-emerald-500' : 'bg-slate-400']"></span>
            {{ cat.isActive ? 'Ativa' : 'Inativa' }}
          </span>
        </div>

        <p v-if="cat.description" class="text-xs text-slate-500 mb-4 line-clamp-2">{{ cat.description }}</p>

        <div class="flex items-center justify-between pt-3 border-t border-slate-100">
          <div class="flex items-center gap-1.5 text-xs text-slate-500">
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <span class="font-semibold text-slate-700">{{ cat._count?.products ?? 0 }}</span> produto{{ cat._count?.products !== 1 ? 's' : '' }}
          </div>
          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <!-- Reorder -->
            <button @click="reorder(cat, 'up')" :disabled="categories.indexOf(cat) === 0"
              class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Mover para cima">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>
            </button>
            <button @click="reorder(cat, 'down')" :disabled="categories.indexOf(cat) === categories.length - 1"
              class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Mover para baixo">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </button>
            <button @click="openEdit(cat)" class="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="Editar">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            </button>
            <button @click="toggleActive(cat)"
              :class="['p-1.5 rounded-lg transition-colors', cat.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50']"
              :title="cat.isActive ? 'Desativar' : 'Ativar'">
              <svg v-if="cat.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="categories.length === 0" class="sm:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-dashed border-slate-200 py-16 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
        </div>
        <p class="text-sm font-medium text-slate-600 mb-1">Nenhuma categoria criada</p>
        <p class="text-xs text-slate-400">Crie categorias para organizar seus produtos</p>
      </div>
    </div>

    <!-- Modal -->
    <AppModal v-model="modalOpen" :title="editing ? 'Editar Categoria' : 'Nova Categoria'">
      <form @submit.prevent="save" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Nome *</label>
          <input v-model="form.name" required placeholder="Ex: Alfabetização" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Slug *</label>
          <input v-model="form.slug" required placeholder="alfabetizacao" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          <p class="text-xs text-slate-400 mt-1">Identificador único na URL. Ex: <code class="bg-slate-100 px-1 rounded">matematica</code></p>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Descrição</label>
          <textarea v-model="form.description" rows="2" placeholder="Descrição curta da categoria..." class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">URL da Imagem</label>
          <input v-model="form.imageUrl" type="url" placeholder="https://..." class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
        </div>

        <div v-if="errorMsg" class="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {{ errorMsg }}
        </div>

        <div class="flex gap-3 pt-2 border-t border-slate-100">
          <button type="submit" :disabled="saving" class="flex-1 bg-violet-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar categoria' }}
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
import { ref, reactive, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import AppModal from '@/components/ui/AppModal.vue';

const categories = ref<any[]>([]);
const modalOpen = ref(false);
const saving = ref(false);
const editing = ref<any>(null);
const errorMsg = ref('');
const form = reactive({ name: '', slug: '', description: '', imageUrl: '' });

function openCreate() {
  editing.value = null;
  Object.assign(form, { name: '', slug: '', description: '', imageUrl: '' });
  errorMsg.value = '';
  modalOpen.value = true;
}

function openEdit(cat: any) {
  editing.value = cat;
  Object.assign(form, { name: cat.name, slug: cat.slug, description: cat.description || '', imageUrl: cat.image_url || '' });
  errorMsg.value = '';
  modalOpen.value = true;
}

async function save() {
  saving.value = true;
  errorMsg.value = '';
  try {
    const payload = { name: form.name, slug: form.slug, description: form.description || null, image_url: form.imageUrl || null, updated_at: new Date().toISOString() };
    if (editing.value) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.value.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: existing } = await supabase.from('categories').select('id').eq('slug', form.slug).single();
      if (existing) throw new Error('Slug já existe.');
      const { error } = await supabase.from('categories').insert({ ...payload, is_active: true });
      if (error) throw new Error(error.message);
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
  await supabase.from('categories').update({ is_active: !cat.is_active, updated_at: new Date().toISOString() }).eq('id', cat.id);
  await loadCategories();
}

async function loadCategories() {
  const { data } = await supabase.from('categories').select('*, products(count)').order('sort_order').order('created_at');
  categories.value = (data ?? []).map((c: any) => ({
    ...c,
    isActive: c.is_active,
    imageUrl: c.image_url,
    _count: { products: c.products?.[0]?.count ?? 0 },
  }));
}

async function reorder(cat: any, direction: 'up' | 'down') {
  const idx = categories.value.findIndex(c => c.id === cat.id);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= categories.value.length) return;
  const a = categories.value[idx];
  const b = categories.value[swapIdx];
  await Promise.all([
    supabase.from('categories').update({ sort_order: swapIdx }).eq('id', a.id),
    supabase.from('categories').update({ sort_order: idx }).eq('id', b.id),
  ]);
  await loadCategories();
}

onMounted(loadCategories);
</script>
