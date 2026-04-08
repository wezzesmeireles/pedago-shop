<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <div class="mb-5 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">Catálogo de Atividades</h1>
        <p class="text-gray-500 text-sm mt-0.5">{{ pagination.total }} atividades disponíveis</p>
      </div>
      <!-- Mobile filter toggle -->
      <button
        @click="filtersOpen = !filtersOpen"
        class="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
        </svg>
        Filtros
        <span v-if="activeFilterCount" class="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{{ activeFilterCount }}</span>
      </button>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">

      <!-- Filters sidebar -->
      <transition name="slide-down">
        <aside v-if="filtersOpen || isDesktop" class="w-full lg:w-64 flex-shrink-0">
          <div class="card p-5 space-y-5">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-gray-900">Filtros</h3>
              <button @click="filtersOpen = false" class="lg:hidden text-gray-400 hover:text-gray-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <!-- Search -->
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Buscar</label>
              <input v-model="filters.search" @input="debouncedFetch" type="text" placeholder="Nome, tema..."
                class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>

            <!-- Category -->
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-2">Categoria</label>
              <div class="space-y-1">
                <button @click="setCategory('')"
                  :class="['w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all', !filters.category ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700']">
                  Todas
                </button>
                <button v-for="cat in categories" :key="cat.id"
                  @click="setCategory(cat.slug)"
                  :class="['w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all flex justify-between', filters.category === cat.slug ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700']">
                  <span>{{ cat.name }}</span>
                  <span class="text-xs opacity-70">{{ cat._count?.products }}</span>
                </button>
              </div>
            </div>

            <!-- Sort -->
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Ordenar</label>
              <select v-model="filters.sort" @change="() => fetchProducts()"
                class="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option value="newest">Mais Recentes</option>
                <option value="popular">Mais Vendidos</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
              </select>
            </div>

            <button @click="clearFilters" class="w-full text-sm text-gray-400 hover:text-gray-600 py-1">Limpar filtros</button>
          </div>
        </aside>
      </transition>

      <!-- Product grid -->
      <div class="flex-1 min-w-0">
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div v-for="i in 6" :key="i" class="card overflow-hidden animate-pulse">
            <div class="aspect-square bg-gray-200"></div>
            <div class="p-3 sm:p-4 space-y-2">
              <div class="h-4 bg-gray-200 rounded"></div>
              <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>

        <div v-else-if="products.length === 0" class="text-center py-20">
          <div class="text-6xl mb-4">🔍</div>
          <p class="text-gray-500 text-lg">Nenhum produto encontrado</p>
          <button @click="clearFilters" class="mt-4 btn-primary text-sm">Limpar Filtros</button>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="flex justify-center flex-wrap gap-2 mt-8">
          <button
            v-for="page in pagination.totalPages"
            :key="page"
            @click="goToPage(page)"
            :class="['w-10 h-10 rounded-xl text-sm font-medium transition-all', page === pagination.page ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100']"
          >{{ page }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useCatalogStore } from '@/stores/catalog.store';
import ProductCard from '@/components/catalog/ProductCard.vue';

const route = useRoute();
const catalogStore = useCatalogStore();

const products = ref([]);
const loading = ref(true);
const filtersOpen = ref(false);
const isDesktop = ref(window.innerWidth >= 1024);
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 1 });

const filters = reactive({
  search: '',
  category: (route.query.categoria as string) || '',
  sort: 'newest',
});

const categories = computed(() => catalogStore.categories);

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.search) count++;
  if (filters.category) count++;
  if (filters.sort !== 'newest') count++;
  return count;
});

function handleResize() {
  isDesktop.value = window.innerWidth >= 1024;
  if (isDesktop.value) filtersOpen.value = false;
}

let searchTimeout: ReturnType<typeof setTimeout>;
function debouncedFetch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(fetchProducts, 400);
}

async function fetchProducts(page = 1) {
  loading.value = true;
  try {
    const params: Record<string, any> = { page, limit: 12, sort: filters.sort };
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    const limit = 12;
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    let q = supabase
      .from('products')
      .select('id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count, tags, categories(id, name, slug)', { count: 'exact' })
      .eq('is_active', true).is('deleted_at', null).range(from, to);
    if (filters.search) q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters.category) q = q.eq('categories.slug', filters.category);
    if (filters.sort === 'price_asc') q = q.order('price', { ascending: true });
    else if (filters.sort === 'price_desc') q = q.order('price', { ascending: false });
    else if (filters.sort === 'popular') q = q.order('sales_count', { ascending: false });
    else q = q.order('created_at', { ascending: false });
    const { data, count } = await q;
    products.value = (data ?? []).map((p: any) => ({ ...p, coverImageUrl: p.cover_image_url, comparePrice: p.compare_price, isFeatured: p.is_featured, salesCount: p.sales_count }));
    const total = count ?? 0;
    pagination.value = { page, limit, total, totalPages: Math.ceil(total / limit) };
  } finally {
    loading.value = false;
  }
}

function setCategory(slug: string) {
  filters.category = slug;
  filtersOpen.value = false;
  fetchProducts();
}

function goToPage(page: number) {
  fetchProducts(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearFilters() {
  filters.search = '';
  filters.category = '';
  filters.sort = 'newest';
  fetchProducts();
}

onMounted(async () => {
  window.addEventListener('resize', handleResize);
  await catalogStore.fetchCategories();
  await fetchProducts();
});

onUnmounted(() => window.removeEventListener('resize', handleResize));
</script>

<style scoped>
.slide-down-enter-active { animation: slide-down 0.2s ease; }
.slide-down-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.slide-down-leave-to { opacity: 0; transform: translateY(-8px); }
@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
