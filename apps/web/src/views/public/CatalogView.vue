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
        class="lg:hidden flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all active:bg-gray-100 min-h-[44px]"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
        </svg>
        Filtros
        <span v-if="activeFilterCount" class="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center font-bold">{{ activeFilterCount }}</span>
      </button>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">

      <!-- Backdrop (bottom-sheet no mobile) -->
      <transition name="fade">
        <div v-if="filtersOpen && !isDesktop" class="lg:hidden fixed inset-0 bg-black/40 z-40" @click="filtersOpen = false"></div>
      </transition>

      <!-- Filtros: sidebar no desktop · bottom-sheet no mobile -->
      <transition :name="isDesktop ? 'slide-down' : 'sheet'">
        <aside v-if="filtersOpen || isDesktop"
          :class="isDesktop
            ? 'w-full lg:w-64 flex-shrink-0'
            : 'fixed bottom-0 inset-x-0 z-50 max-h-[85vh] overflow-y-auto'">
          <div class="card p-5 space-y-5" :class="isDesktop ? '' : 'rounded-t-3xl rounded-b-none shadow-2xl'">
            <!-- handle (mobile) -->
            <div v-if="!isDesktop" class="w-10 h-1.5 bg-gray-200 rounded-full mx-auto -mt-1 mb-1"></div>
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
                class="w-full rounded-xl border border-gray-300 px-3 py-3 text-base focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                style="font-size: 16px;" />
            </div>

            <!-- Category -->
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-2">Categoria</label>
              <div class="space-y-1">
                <button @click="setCategory('')"
                  :class="['w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all', !filters.category && !filters.onlyFree && !filters.featured ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700']">
                  Todas
                </button>
                <!-- Filtro Mais Vendidos -->
                <button @click="toggleFeatured"
                  :class="['w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5', filters.featured ? 'bg-amber-500 text-white' : 'hover:bg-amber-50 text-amber-700 border border-amber-200']">
                  <span class="text-xs font-bold">🔥</span>
                  <span>Mais Vendidos</span>
                </button>
                <!-- Filtro Grátis -->
                <button @click="toggleFree"
                  :class="['w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all flex items-center gap-1.5', filters.onlyFree ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-50 text-emerald-700 border border-emerald-200']">
                  <span class="text-xs font-bold">🎁</span>
                  <span>Grátis</span>
                </button>
                <button v-for="cat in categories" :key="cat.id"
                  @click="setCategory(cat.slug)"
                  :class="['w-full text-left px-3 py-1.5 rounded-xl text-sm transition-all flex justify-between', filters.category === cat.slug && !filters.onlyFree && !filters.featured ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-700']">
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

            <!-- Ver resultados (mobile) -->
            <button v-if="!isDesktop" @click="filtersOpen = false"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm py-3 rounded-xl transition-all active:scale-95">
              Ver {{ pagination.total }} {{ pagination.total === 1 ? 'resultado' : 'resultados' }}
            </button>
          </div>
        </aside>
      </transition>

      <!-- Product grid -->
      <div class="flex-1 min-w-0">
        <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div v-for="i in 6" :key="i" class="card overflow-hidden">
            <div class="aspect-square shimmer"></div>
            <div class="p-3 sm:p-4 space-y-2">
              <div class="h-4 shimmer rounded"></div>
              <div class="h-4 shimmer rounded w-2/3"></div>
              <div class="h-6 shimmer rounded-xl w-1/2 mt-1"></div>
            </div>
          </div>
        </div>

        <div v-else-if="fetchError" class="text-center py-20 animate-fade-in">
          <div class="text-5xl mb-4">⚠️</div>
          <p class="text-gray-500 text-lg">{{ fetchError }}</p>
          <button @click="fetchProducts()" class="mt-4 btn-primary text-sm">Tentar novamente</button>
        </div>

        <div v-else-if="products.length === 0" class="text-center py-20 animate-fade-in">
          <div class="text-6xl mb-4 float">🔍</div>
          <p class="text-gray-500 text-lg">Nenhum produto encontrado</p>
          <button @click="clearFilters" class="mt-4 btn-primary text-sm">Limpar Filtros</button>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div v-for="(product, i) in products" :key="product.id" class="stagger-item" :style="{ '--i': i }">
            <ProductCard :product="product" />
          </div>
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
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@vueuse/head';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useCatalogStore } from '@/stores/catalog.store';
import { useSiteConfigStore } from '@/stores/site-config.store';
import ProductCard from '@/components/catalog/ProductCard.vue';

const route = useRoute();
const catalogStore = useCatalogStore();
const siteConfigStore = useSiteConfigStore();

// ── SEO dinâmico ──────────────────────────────────────────
useHead(computed(() => {
  const cfg = siteConfigStore.config;
  const store = cfg.storeName || 'Loja';
  const catName = catalogStore.categories.find((c: any) => c.slug === route.query.categoria)?.name;
  const busca = route.query.busca as string;
  let title: string;
  if (busca) title = `Busca: ${busca} | ${store}`;
  else if (route.query.destaque === '1') title = `Mais Vendidos | ${store}`;
  else if (catName) title = `${catName} — Atividades Pedagógicas | ${store}`;
  else title = `Catálogo de Atividades Pedagógicas | ${store}`;
  const description = catName
    ? `Atividades pedagógicas de ${catName} em PDF, prontas para imprimir. Download imediato após o pagamento.`
    : (cfg.seoDescription || 'Compre atividades pedagógicas digitais em PDF. Entrega automática após o pagamento.');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' },
      { property: 'og:image', content: cfg.logoUrl || '' },
      { property: 'og:url', content: `${origin}${route.fullPath}` },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
  };
}));

const products = ref([]);
const loading = ref(true);
const fetchError = ref('');
const filtersOpen = ref(false);
const isDesktop = ref(window.innerWidth >= 1024);
const pagination = ref({ page: 1, limit: 12, total: 0, totalPages: 1 });

const filters = reactive({
  search: (route.query.busca as string) || '',
  category: (route.query.categoria as string) || '',
  sort: 'newest',
  onlyFree: false,
  featured: route.query.destaque === '1',
});

const categories = computed(() => catalogStore.categories);

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.search) count++;
  if (filters.category) count++;
  if (filters.onlyFree) count++;
  if (filters.featured) count++;
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
  fetchError.value = '';
  try {
    const limit = 12;
    const offset = (page - 1) * limit;

    // Resolve category slug → $id if filtering by category
    let categoryId: string | null = null;
    if (filters.category) {
      const catResult = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
        Query.equal('slug', filters.category),
        Query.limit(1),
      ]);
      categoryId = catResult.documents[0]?.$id ?? null;
    }

    const queries: string[] = [
      Query.equal('isActive', true),
      Query.isNull('deletedAt'),
      Query.limit(limit),
      Query.offset(offset),
    ];

    if (filters.search) queries.push(Query.search('name', filters.search));
    if (categoryId) queries.push(Query.equal('categoryId', categoryId));
    if (filters.onlyFree) queries.push(Query.equal('price', 0));
    if (filters.featured) queries.push(Query.equal('isFeatured', true));

    if (filters.sort === 'price_asc') queries.push(Query.orderAsc('price'));
    else if (filters.sort === 'price_desc') queries.push(Query.orderDesc('price'));
    else if (filters.sort === 'popular') queries.push(Query.orderDesc('salesCount'));
    else queries.push(Query.orderDesc('$createdAt'));

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, queries);
    products.value = result.documents.map((p: any) => ({
      ...p,
      id: p.$id,
      coverImageUrl: p.coverImageUrl,
      comparePrice: p.comparePrice,
      isFeatured: p.isFeatured,
      salesCount: p.salesCount,
    }));
    const total = result.total;
    pagination.value = { page, limit, total, totalPages: Math.ceil(total / limit) };
  } catch (err: any) {
    fetchError.value = 'Erro ao carregar produtos. Verifique sua conexão e tente novamente.';
    console.error('[CatalogView fetchProducts]', err);
  } finally {
    loading.value = false;
  }
}

function setCategory(slug: string) {
  filters.category = slug;
  filters.onlyFree = false;
  filters.featured = false;
  filtersOpen.value = false;
  fetchProducts();
}

function toggleFree() {
  filters.onlyFree = !filters.onlyFree;
  filters.category = '';
  filters.featured = false;
  filtersOpen.value = false;
  fetchProducts();
}

function toggleFeatured() {
  filters.featured = !filters.featured;
  filters.category = '';
  filters.onlyFree = false;
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
  filters.onlyFree = false;
  filters.featured = false;
  fetchProducts();
}

watch(() => route.query, (q) => {
  if (q.busca !== undefined) filters.search = (q.busca as string) || '';
  if (q.categoria !== undefined) filters.category = (q.categoria as string) || '';
  filters.featured = q.destaque === '1';
  fetchProducts();
});

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

/* Bottom sheet (mobile) */
.sheet-enter-active { transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
.sheet-leave-active { transition: transform 0.2s ease; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
