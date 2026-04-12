<template>
  <div>

    <!-- ── Hero Banner Carousel ────────────────────────── -->
    <section class="relative overflow-hidden">
      <!-- Colorful top stripe -->
      <div class="absolute top-0 left-0 right-0 h-2.5 flex overflow-hidden z-10">
        <span v-for="c in stripeColors" :key="c" class="flex-1" :style="{ background: c }"></span>
      </div>

      <!-- Slides -->
      <div class="relative min-h-[220px] sm:min-h-[320px] md:min-h-[420px]">
        <div
          v-for="(slide, idx) in bannerSlides"
          v-show="bannerIndex === idx"
          :key="idx"
          class="absolute inset-0 flex items-center"
          :style="slideBg(slide, idx)"
        >
          <!-- Background image -->
          <div
            v-if="slide.imageUrl"
            class="absolute inset-0 bg-cover bg-center bg-top"
            :style="{ backgroundImage: `url(${slide.imageUrl})` }"
          >
            <div class="absolute inset-0 bg-black/20"></div>
          </div>

          <!-- Decorative blobs -->
          <div class="absolute top-6 right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div class="absolute bottom-6 left-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 md:py-20 relative z-10 w-full">
            <div class="text-center md:text-left max-w-2xl mx-auto md:mx-0">
              <h1 class="font-black leading-tight text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-lg mb-3">
                {{ slide.title }}
              </h1>
              <p class="text-white/80 text-base sm:text-lg mb-8 drop-shadow">
                {{ slide.subtitle }}
              </p>
              <RouterLink
                :to="slide.ctaLink || '/catalogo'"
                class="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300
                       active:scale-95 text-yellow-900 font-bold px-7 py-3.5 rounded-2xl
                       shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
              >
                {{ slide.ctaText || 'Ver Produtos' }}
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Prev/Next arrows -->
        <button
          @click="prevBanner"
          class="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30
                 hover:bg-black/50 flex items-center justify-center text-white transition-all"
          aria-label="Anterior"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button
          @click="nextBanner"
          class="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/30
                 hover:bg-black/50 flex items-center justify-center text-white transition-all"
          aria-label="Próximo"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        <!-- Dots -->
        <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          <button
            v-for="(_, idx) in bannerSlides"
            :key="idx"
            @click="goToBanner(idx)"
            :class="['w-2.5 h-2.5 rounded-full transition-all duration-300', bannerIndex === idx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80']"
            :aria-label="`Banner ${idx + 1}`"
          ></button>
        </div>
      </div>

      <!-- Bottom stripe -->
      <div class="absolute bottom-0 left-0 right-0 h-2.5 flex overflow-hidden z-10">
        <span v-for="c in [...stripeColors].reverse()" :key="c" class="flex-1" :style="{ background: c }"></span>
      </div>
    </section>

    <!-- ── Seções por Categoria ─────────────────────────── -->
    <template v-for="cat in categoriesWithProducts" :key="cat.id">
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span class="w-1 h-7 rounded-full bg-gradient-to-b from-primary-500 to-secondary-500 inline-block"></span>
            {{ cat.name }}
          </h2>
          <RouterLink
            :to="`/catalogo?categoria=${cat.slug}`"
            class="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-1 group"
          >
            Ver todos
            <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <ProductCard v-for="product in cat.products" :key="product.id" :product="product" />
        </div>
      </section>
    </template>

    <!-- ── Destaques ─────────────────────────────────────── -->
    <section ref="destaquesSection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 reveal">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span class="w-1 h-7 rounded-full bg-gradient-to-b from-primary-500 to-secondary-500 inline-block"></span>
          Destaques
        </h2>
        <RouterLink to="/catalogo" class="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors flex items-center gap-1 group">
          Ver todos
          <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </RouterLink>
      </div>

      <!-- Skeleton -->
      <div v-if="loadingFeatured" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div v-for="i in 12" :key="i" class="rounded-xl overflow-hidden">
          <div class="aspect-square shimmer"></div>
          <div class="p-2.5 space-y-1.5">
            <div class="h-2.5 shimmer rounded w-4/5"></div>
            <div class="h-2.5 shimmer rounded w-3/5"></div>
            <div class="h-6 shimmer rounded-lg mt-2"></div>
          </div>
        </div>
      </div>

      <transition-group
        v-else
        tag="div"
        name="stagger"
        class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        appear
      >
        <ProductCard
          v-for="(product, i) in featuredProducts"
          :key="product.id"
          :product="product"
          :style="{ transitionDelay: `${i * 40}ms` }"
        />
      </transition-group>

      <div v-if="!loadingFeatured && featuredProducts.length === 0" class="text-center py-12">
        <div class="text-5xl mb-3">📚</div>
        <p class="text-gray-400">Nenhum produto em destaque no momento.</p>
      </div>
    </section>

    <!-- ── Atividades ────────────────────────────────────── -->
    <section ref="atividadesSection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 reveal">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span class="w-1 h-7 rounded-full bg-gradient-to-b from-green-400 to-teal-500 inline-block"></span>
          Atividades
        </h2>
        <div class="flex items-center gap-1.5">
          <button
            @click="atividadesPage = Math.max(0, atividadesPage - 1)"
            :disabled="atividadesPage === 0"
            class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                   text-gray-500 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600
                   transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="text-xs text-gray-400 min-w-[3rem] text-center">
            {{ atividadesPage + 1 }} / {{ maxAtividadesPage + 1 }}
          </span>
          <button
            @click="atividadesPage = Math.min(maxAtividadesPage, atividadesPage + 1)"
            :disabled="atividadesPage >= maxAtividadesPage"
            class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                   text-gray-500 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600
                   transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <div v-if="loadingAtividades" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div v-for="i in 6" :key="i" class="rounded-xl overflow-hidden">
          <div class="aspect-square shimmer"></div>
          <div class="p-2.5 space-y-1.5">
            <div class="h-2.5 shimmer rounded w-4/5"></div>
            <div class="h-6 shimmer rounded-lg mt-2"></div>
          </div>
        </div>
      </div>

      <transition name="fade-page" mode="out-in">
        <div
          :key="atividadesPage"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          <ProductCard
            v-for="(product, i) in pagedAtividades"
            :key="product.id"
            :product="product"
            :style="{ transitionDelay: `${i * 40}ms` }"
          />
        </div>
      </transition>
    </section>

    <!-- ── Featured Group Product ────────────────────────── -->
    <section v-if="groupProduct" ref="groupSection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 reveal">
      <div
        class="rounded-3xl overflow-hidden shadow-xl border border-gray-100
               bg-gradient-to-br from-purple-50 to-pink-50"
      >
        <div class="flex flex-col md:flex-row items-stretch">
          <!-- Image side -->
          <div
            class="w-full md:w-1/2 relative overflow-hidden min-h-64
                   bg-gradient-to-br from-purple-200 to-pink-200
                   flex items-center justify-center p-8"
          >
            <img
              v-if="groupProduct.coverImageUrl"
              :src="groupProduct.coverImageUrl"
              :alt="groupProduct.name"
              class="max-h-72 object-contain rounded-2xl shadow-lg
                     hover:scale-105 transition-transform duration-500"
            />
            <div v-else class="w-48 h-48 rounded-full bg-gradient-to-br from-purple-400 to-pink-400
                                flex items-center justify-center text-white text-6xl float">
              📚
            </div>

            <!-- Decorative badge -->
            <div class="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold
                        px-3 py-1.5 rounded-full shadow animate-bounce-in">
              🌟 Mais Vendido
            </div>
          </div>

          <!-- Info side -->
          <div class="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <p class="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">
              Grupo Pedagógico
            </p>
            <h3 class="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">
              {{ groupProduct.name }}
            </h3>
            <p v-if="groupProduct.description" class="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-3">
              {{ groupProduct.description }}
            </p>

            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-4xl font-black text-gray-900">{{ formatPrice(groupProduct.price) }}</span>
              <span v-if="groupProduct.comparePrice" class="text-lg text-gray-400 line-through">
                {{ formatPrice(groupProduct.comparePrice) }}
              </span>
              <span v-if="groupProduct.comparePrice" class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {{ discountPct(groupProduct) }}% OFF
              </span>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden
                          hover:border-primary-300 transition-colors">
                <button
                  @click="groupQty = Math.max(1, groupQty - 1)"
                  class="w-10 h-10 flex items-center justify-center text-gray-600
                         hover:bg-gray-100 transition-colors font-bold text-xl active:scale-90"
                >−</button>
                <span class="w-10 text-center font-bold text-sm select-none">{{ groupQty }}</span>
                <button
                  @click="groupQty++"
                  class="w-10 h-10 flex items-center justify-center text-gray-600
                         hover:bg-gray-100 transition-colors font-bold text-xl active:scale-90"
                >+</button>
              </div>

              <button
                @click="addGroupToCart"
                class="flex-1 flex items-center justify-center gap-2
                       bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold
                       px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Comprar
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ──────────────────────────────────── -->
    <section ref="testimonialsSection" class="py-16 relative overflow-hidden reveal">
      <div
        class="absolute inset-0"
        style="background: linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #818cf8 100%)"
      ></div>
      <!-- Decorative circles -->
      <div class="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      <div class="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="text-center mb-10">
          <h2 class="text-3xl font-black text-white mb-2">Depoimentos</h2>
          <p class="text-white/70 text-sm">O que nossas professoras dizem</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            v-for="(t, i) in testimonials"
            :key="t.name"
            class="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30
                   hover:bg-white/30 transition-all duration-300 hover:-translate-y-1
                   hover:shadow-xl"
            :class="`reveal reveal-delay-${i + 1}`"
          >
            <div class="flex text-yellow-300 text-lg mb-3 gap-0.5">
              <span v-for="s in 5" :key="s">★</span>
            </div>
            <p class="text-white/90 text-sm leading-relaxed mb-5 italic">"{{ t.text }}"</p>
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center
                          text-white font-bold text-sm flex-shrink-0">
                {{ t.name[0] }}
              </div>
              <div>
                <p class="font-bold text-white text-sm">{{ t.name }}</p>
                <p class="text-white/60 text-xs">{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Newsletter ────────────────────────────────────── -->
    <section ref="newsletterSection" class="py-16 reveal" style="background-color: #1e1b2e;">
      <div class="max-w-lg mx-auto px-4 text-center">
        <div class="text-4xl mb-4">📬</div>
        <h2 class="text-2xl font-black text-white mb-2">Receba todas as promoções</h2>
        <p class="text-gray-400 text-sm mb-8 leading-relaxed">
          Que tal receber Atividades? Se cadastre na nossa lista e fique por dentro das novidades!
        </p>

        <form @submit.prevent="subscribeNewsletter" class="flex flex-col xs:flex-row gap-2 max-w-sm mx-auto">
          <input
            v-model="newsletterEmail"
            type="email"
            placeholder="Seu melhor email"
            required
            class="flex-1 px-4 py-3 rounded-xl text-sm text-gray-800
                   focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white
                   placeholder:text-gray-400 transition-all"
          />
          <button
            type="submit"
            :disabled="newsletterSent"
            class="bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:bg-green-500
                   text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all duration-200 shadow
                   flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <transition name="icon-swap" mode="out-in">
              <svg v-if="!newsletterSent" key="send" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              <svg v-else key="check" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </transition>
            {{ newsletterSent ? 'Cadastrado!' : 'Enviar' }}
          </button>
        </form>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { useSiteConfigStore } from '@/stores/site-config.store';
import { useCartStore } from '@/stores/cart.store';
import ProductCard from '@/components/catalog/ProductCard.vue';

const siteConfigStore = useSiteConfigStore();
const cart = useCartStore();
const config = siteConfigStore.config;

const categories = ref<any[]>([]);
const categoriesWithProducts = ref<any[]>([]);

// ── Banner carousel ──────────────────────────────────
const bannerIndex = ref(0);
let bannerTimer: ReturnType<typeof setInterval> | null = null;

const bannerSlides = computed(() => {
  const cfg = siteConfigStore.config;
  return cfg.banners && cfg.banners.length > 0 ? cfg.banners : [];
});

const slideGradients = [
  'linear-gradient(135deg, #7C3AED, #EC4899)',
  'linear-gradient(135deg, #0EA5E9, #6366F1)',
  'linear-gradient(135deg, #10B981, #3B82F6)',
];

function slideBg(slide: any, idx: number) {
  if (slide.imageUrl) return {};
  return { background: slideGradients[idx % slideGradients.length] };
}

function nextBanner() {
  bannerIndex.value = (bannerIndex.value + 1) % Math.max(bannerSlides.value.length, 1);
  resetBannerTimer();
}

function prevBanner() {
  bannerIndex.value = (bannerIndex.value - 1 + Math.max(bannerSlides.value.length, 1)) % Math.max(bannerSlides.value.length, 1);
  resetBannerTimer();
}

function goToBanner(idx: number) {
  bannerIndex.value = idx;
  resetBannerTimer();
}

function resetBannerTimer() {
  if (bannerTimer) clearInterval(bannerTimer);
  if (bannerSlides.value.length > 1) {
    bannerTimer = setInterval(() => {
      bannerIndex.value = (bannerIndex.value + 1) % bannerSlides.value.length;
    }, 5000);
  }
}

const featuredProducts = ref<any[]>([]);
const atividades = ref<any[]>([]);
const groupProduct = ref<any>(null);
const loadingFeatured = ref(true);
const loadingAtividades = ref(true);
const atividadesPage = ref(0);
const groupQty = ref(1);
const newsletterEmail = ref('');
const newsletterSent = ref(false);

// Section refs for scroll reveal
const destaquesSection = ref<HTMLElement | null>(null);
const atividadesSection = ref<HTMLElement | null>(null);
const groupSection = ref<HTMLElement | null>(null);
const testimonialsSection = ref<HTMLElement | null>(null);
const newsletterSection = ref<HTMLElement | null>(null);

const ATIVIDADES_PER_PAGE = 6;

const stripeColors = ['#facc15', '#f87171', '#60a5fa', '#4ade80', '#c084fc', '#fb923c'];

const pagedAtividades = computed(() =>
  atividades.value.slice(atividadesPage.value * ATIVIDADES_PER_PAGE, (atividadesPage.value + 1) * ATIVIDADES_PER_PAGE)
);

const maxAtividadesPage = computed(() =>
  Math.max(0, Math.ceil(atividades.value.length / ATIVIDADES_PER_PAGE) - 1)
);


const testimonials = [
  { name: 'Maria S.', role: 'Professora de Educação Infantil', text: 'Adorei as atividades! Meus alunos ficaram super animados e o material é de excelente qualidade.' },
  { name: 'Andressa Luzia', role: 'Pedagoga', text: 'Amei! Qualidade incrível, chegou rapidinho pelo email. Recomendo demais para professores!' },
  { name: 'Fernanda Gabi', role: 'Coordenadora Pedagógica', text: 'Material muito bem elaborado. Já comprei várias vezes e sempre fico satisfeita com o resultado.' },
];

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function discountPct(product: any) {
  if (!product.comparePrice) return 0;
  return Math.round((1 - product.price / product.comparePrice) * 100);
}

function addGroupToCart() {
  if (!groupProduct.value) return;
  for (let i = 0; i < groupQty.value; i++) {
    cart.add({
      productId: groupProduct.value.id,
      name: groupProduct.value.name,
      price: Number(groupProduct.value.price),
      coverImageUrl: groupProduct.value.coverImageUrl,
      slug: groupProduct.value.slug,
    });
  }
}

function subscribeNewsletter() {
  newsletterSent.value = true;
  newsletterEmail.value = '';
  setTimeout(() => { newsletterSent.value = false; }, 3500);
}

// Intersection observer for scroll reveal
let observer: IntersectionObserver | null = null;

function setupReveal() {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Also reveal children with reveal class inside
          entry.target.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  [destaquesSection, atividadesSection, groupSection, testimonialsSection, newsletterSection]
    .forEach((ref) => {
      if (ref.value) observer!.observe(ref.value);
    });
}

onMounted(async () => {
  resetBannerTimer();
  setupReveal();

  await Promise.allSettled([
    (async () => {
      try {
        // Fetch all active products with their category in one query, then group
        const { data: prods, error } = await supabase
          .from('products')
          .select('id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count, category_id, categories(id, name, slug, is_active)')
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('created_at', { ascending: false });
        if (error) { console.error('categories fetch error:', error); return; }
        const catMap = new Map<string, any>();
        for (const p of prods ?? []) {
          const cat = (p as any).categories;
          if (!cat || !cat.is_active) continue;
          if (!catMap.has(cat.id)) catMap.set(cat.id, { ...cat, products: [] });
          if (catMap.get(cat.id).products.length < 6) {
            catMap.get(cat.id).products.push({ ...p, coverImageUrl: (p as any).cover_image_url, comparePrice: (p as any).compare_price });
          }
        }
        categoriesWithProducts.value = Array.from(catMap.values());
      } catch (e) { console.error('categories section error:', e); }
    })(),
    (async () => {
      try {
        const { data } = await supabase.from('products').select('id, name, slug, price, compare_price, cover_image_url, is_featured, sales_count, categories(id, name, slug)').eq('is_featured', true).eq('is_active', true).is('deleted_at', null).order('sort_order').limit(8);
        featuredProducts.value = (data ?? []).map((p: any) => ({ ...p, coverImageUrl: p.cover_image_url, comparePrice: p.compare_price }));
      } finally { loadingFeatured.value = false; }
    })(),
    (async () => {
      try {
        const { data } = await supabase.from('products').select('id, name, slug, price, compare_price, cover_image_url, sales_count, categories(id, name, slug)').eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }).limit(24);
        const mapped = (data ?? []).map((p: any) => ({ ...p, coverImageUrl: p.cover_image_url, comparePrice: p.compare_price }));
        atividades.value = mapped;
        groupProduct.value = mapped.find((p: any) => p.name?.toLowerCase().includes('grupo') || Number(p.price) > 20) ?? null;
      } finally { loadingAtividades.value = false; }
    })(),
  ]);
});

onUnmounted(() => {
  observer?.disconnect();
  if (bannerTimer) clearInterval(bannerTimer);
});
</script>

<style scoped>
/* Banner carousel transition */
.banner-slide-enter-active,
.banner-slide-leave-active {
  transition: opacity 0.6s ease;
  position: absolute;
  inset: 0;
}
.banner-slide-enter-from,
.banner-slide-leave-to { opacity: 0; }

/* Stagger for product grid items */
.stagger-enter-active {
  transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.stagger-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

/* Page flip for atividades pagination */
.fade-page-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-page-enter-from  { opacity: 0; transform: translateX(12px); }
.fade-page-leave-to    { opacity: 0; transform: translateX(-12px); }

/* Icon swap inside button */
.icon-swap-enter-active { transition: opacity 0.15s ease; }
.icon-swap-leave-active { transition: opacity 0.1s ease; position: absolute; }
.icon-swap-enter-from,
.icon-swap-leave-to { opacity: 0; }
</style>
