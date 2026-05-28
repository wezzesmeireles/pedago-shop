<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="animate-spin w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full"></div>
    </div>

    <!-- Product -->
    <div v-else-if="product" class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
      <!-- Images -->
      <div class="stagger-item" style="--i:0">
        <div class="rounded-3xl overflow-hidden aspect-square shadow-xl bg-gray-100 mb-4">
          <img :src="activeImage" :alt="product.name" class="w-full h-full object-cover" />
        </div>
        <div v-if="product.previewImages?.length" class="flex gap-2 overflow-x-auto pb-2">
          <button @click="activeImage = product.coverImageUrl" :class="['w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all', activeImage === product.coverImageUrl ? 'ring-primary-600' : 'ring-transparent']">
            <img :src="product.coverImageUrl" :alt="product.name" class="w-full h-full object-cover" />
          </button>
          <button v-for="img in product.previewImages" :key="img" @click="activeImage = img" :class="['w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all', activeImage === img ? 'ring-primary-600' : 'ring-transparent']">
            <img :src="img" :alt="product.name" class="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Info -->
      <div class="flex flex-col stagger-item" style="--i:1">
        <div class="flex items-center gap-2 mb-2">
          <RouterLink :to="`/catalogo?categoria=${product.category?.slug}`" class="text-sm text-primary-600 font-medium hover:underline">
            {{ product.category?.name }}
          </RouterLink>
          <span v-if="product.isFeatured" class="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full">★ Destaque</span>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{{ product.name }}</h1>

        <div class="flex items-baseline gap-3 mb-4">
          <span v-if="isFree" class="text-3xl sm:text-4xl font-bold text-emerald-600">Grátis</span>
          <template v-else>
            <span class="text-3xl sm:text-4xl font-bold text-primary-600">{{ formatPrice(product.price) }}</span>
            <span v-if="product.comparePrice" class="text-lg sm:text-xl text-gray-400 line-through">{{ formatPrice(product.comparePrice) }}</span>
          </template>
        </div>

        <!-- Details -->
        <div class="flex flex-wrap gap-3 sm:gap-4 mb-6">
          <div v-if="product.pageCount" class="flex items-center gap-1 text-sm text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            {{ product.pageCount }} páginas
          </div>
          <div class="flex items-center gap-1 text-sm text-gray-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            Formato PDF
          </div>
          <div class="flex items-center gap-1 text-sm text-green-600 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            Entrega imediata
          </div>
        </div>

        <!-- Tags -->
        <div v-if="product.tags?.length" class="flex flex-wrap gap-2 mb-6">
          <span v-for="tag in product.tags" :key="tag" class="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
            {{ tag }}
          </span>
        </div>

        <p class="text-gray-600 mb-8">{{ product.description }}</p>

        <!-- CTA -->
        <div class="space-y-3">
          <template v-if="isFree">
            <button
              @click="claimFree"
              :disabled="claiming"
              class="w-full text-base py-4 font-bold rounded-xl text-white transition-all
                     bg-gradient-to-r from-emerald-500 to-green-400
                     hover:from-emerald-600 hover:to-green-500
                     disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {{ claiming ? 'Obtendo...' : 'Obter Grátis' }}
            </button>
            <p v-if="claimError" class="text-sm text-red-500 text-center">{{ claimError }}</p>
          </template>
          <template v-else>
            <button @click="addToCart" class="w-full btn-primary text-base py-4">
              🛒 Adicionar ao Carrinho
            </button>
            <button @click="buyNow" class="w-full btn-secondary text-base py-4">
              ⚡ Comprar Agora
            </button>
          </template>
        </div>

      </div>
    </div>

    <!-- YouTube Video -->
    <div v-if="product?.youtubeEmbedId" class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        Como fazer esta atividade
      </h2>
      <div class="rounded-2xl overflow-hidden shadow-lg aspect-video">
        <iframe
          :src="`https://www.youtube.com/embed/${product.youtubeEmbedId}?rel=0&modestbranding=1`"
          class="w-full h-full"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
    </div>

    <!-- Instagram Video -->
    <div v-if="product?.instagramUrl" class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-7 h-7 flex-shrink-0" viewBox="0 0 24 24" fill="none">
          <defs><linearGradient id="ig2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f09433"/><stop offset="25%" stop-color="#e6683c"/><stop offset="50%" stop-color="#dc2743"/><stop offset="75%" stop-color="#cc2366"/><stop offset="100%" stop-color="#bc1888"/></linearGradient></defs>
          <rect width="24" height="24" rx="6" fill="url(#ig2)"/>
          <circle cx="12" cy="12" r="4" stroke="white" stroke-width="1.5" fill="none"/>
          <circle cx="17" cy="7" r="1" fill="white"/>
        </svg>
        Veja no Instagram
      </h2>
      <div class="flex justify-center">
        <blockquote
          class="instagram-media"
          :data-instgrm-permalink="product.instagramUrl"
          data-instgrm-version="14"
          style="max-width:320px; width:100%; border:0; border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.1);"
        ></blockquote>
      </div>
    </div>

    <!-- Description -->
    <div v-if="product?.richContent" class="mt-12">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Descrição Completa</h2>
      <div class="prose max-w-none" v-html="product.richContent"></div>
    </div>

    <!-- Not found -->
    <div v-else-if="!loading" class="text-center py-20">
      <p class="text-gray-500 text-xl">Produto não encontrado.</p>
      <RouterLink to="/catalogo" class="btn-primary mt-4 inline-block">Ver Catálogo</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useHead } from '@vueuse/head';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/lib/apiClient';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useSiteConfigStore } from '@/stores/site-config.store';

const route = useRoute();
const router = useRouter();
const cart = useCartStore();
const auth = useAuthStore();
const siteConfig = useSiteConfigStore();

const product = ref<any>(null);
const loading = ref(true);
const activeImage = ref('');
const claiming = ref(false);
const claimError = ref('');

const isFree = computed(() => product.value && Number(product.value.price) === 0);

useHead(computed(() => {
  const p = product.value;
  const cfg = siteConfig.config;
  const title = p ? `${p.name} | ${cfg.storeName}` : (cfg.seoTitle || cfg.storeName);
  const description = (p?.description || cfg.seoDescription || '').substring(0, 160);
  const image = p?.coverImageUrl || cfg.logoUrl || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = p ? `${origin}/produto/${p.slug}` : origin;
  const price = p ? String(Number(p.price).toFixed(2)) : '';
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'product' },
      { property: 'og:site_name', content: cfg.storeName },
      { property: 'product:price:amount', content: price },
      { property: 'product:price:currency', content: 'BRL' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
    link: [
      { rel: 'canonical', href: url },
    ],
  };
}));

function loadInstagramEmbed() {
  const win = window as any;
  if (win.instgrm) {
    win.instgrm.Embeds.process();
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://www.instagram.com/embed.js';
  script.async = true;
  script.onload = () => win.instgrm?.Embeds.process();
  document.body.appendChild(script);
}

function extractYoutubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match?.[1] ?? null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price));
}

function addToCart() {
  if (!product.value) return;
  cart.add({
    productId: product.value.id,
    name: product.value.name,
    price: Number(product.value.price),
    coverImageUrl: product.value.coverImageUrl,
    slug: product.value.slug,
  });
}

function buyNow() {
  addToCart();
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: '/checkout' } });
  } else {
    router.push('/checkout');
  }
}

async function claimFree() {
  if (!auth.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } });
    return;
  }
  if (!product.value || claiming.value) return;
  claiming.value = true;
  claimError.value = '';
  try {
    await api.post('/orders', { items: [{ productId: product.value.id, quantity: 1 }], paymentMethod: 'FREE' });
    router.push('/minha-conta/downloads');
  } catch (e: any) {
    console.error('[claimFree]', e);
    claimError.value = e.message || 'Erro ao obter produto. Tente novamente.';
  } finally {
    claiming.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await api.get<any>(`/products/${route.params.slug}`);
    if (data) {
      product.value = {
        ...data,
        richContent: data.richContent ?? data.description,
        youtubeEmbedId: extractYoutubeId(data.youtubeUrl),
      };
      if (data.instagramUrl) loadInstagramEmbed();
    } else {
      product.value = null;
    }
    activeImage.value = data?.coverImageUrl ?? '';
  } catch {
    product.value = null;
  } finally {
    loading.value = false;
  }
});
</script>
