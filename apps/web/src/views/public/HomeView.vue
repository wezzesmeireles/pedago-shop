<template>
  <div>

    <!-- ── Hero Banner Carousel ────────────────────────── -->
    <section class="relative overflow-hidden">
      <div class="relative">
        <!-- Skeleton enquanto o config carrega do servidor -->
        <div v-if="!siteConfigStore.loaded"
          class="w-full min-h-[200px] sm:min-h-[320px] md:min-h-[420px] bg-gray-200 animate-pulse">
        </div>

        <template v-else>
        <div
          v-for="(slide, idx) in bannerSlides"
          v-show="bannerIndex === idx"
          :key="idx"
          class="relative w-full"
        >
            <RouterLink :to="slide.ctaLink || '/catalogo'" class="block cursor-pointer">
            <img
              v-if="slide.imageUrl"
              :src="slide.imageUrl"
              :alt="slide.title || 'Banner'"
              class="w-full h-auto sm:h-auto block"
              :loading="idx === 0 ? 'eager' : 'lazy'"
              :fetchpriority="idx === 0 ? 'high' : 'auto'"
              decoding="async"
            />
            <div
              v-else
              class="w-full min-h-[200px] sm:min-h-[320px] md:min-h-[420px] animate-gradient"
              :style="slideBg(slide, idx)"
            ></div>
            <!-- Hero overlay: texto customizado ou proposta de valor padrão -->
            <div class="absolute inset-0 flex flex-col items-start justify-end p-5 sm:p-8
                        bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none">
              <template v-if="slide.title">
                <h2 class="text-white font-black text-xl sm:text-3xl leading-tight mb-1.5 drop-shadow-lg max-w-md">{{ slide.title }}</h2>
                <p v-if="slide.subtitle" class="text-white/85 text-sm sm:text-base mb-3 drop-shadow-md max-w-sm">{{ slide.subtitle }}</p>
                <span class="inline-block bg-white text-violet-700 font-bold text-sm px-4 py-1.5 rounded-full shadow-lg pointer-events-auto">
                  {{ slide.ctaText || 'Ver atividades →' }}
                </span>
              </template>
            </div>
          </RouterLink>
        </div>

        <!-- Prev/Next arrows -->
        <button @click="prevBanner"
          class="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full
                 bg-white/20 backdrop-blur-md hover:bg-white/40 flex items-center justify-center
                 text-white transition-all shadow-lg border border-white/30 active:scale-90"
          aria-label="Anterior">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button @click="nextBanner"
          class="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full
                 bg-white/20 backdrop-blur-md hover:bg-white/40 flex items-center justify-center
                 text-white transition-all shadow-lg border border-white/30 active:scale-90"
          aria-label="Próximo">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </button>

        <!-- Dots -->
        <div class="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          <button
            v-for="(_, idx) in bannerSlides" :key="idx"
            @click="goToBanner(idx)"
            :class="['transition-all duration-300 rounded-full',
              bannerIndex === idx ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80']"
            :aria-label="`Banner ${idx + 1}`"
          ></button>
        </div>
        </template>
      </div>
    </section>

    <!-- ── Barra de benefícios ──────────────────────────── -->
    <section class="bg-white border-y border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div v-for="b in heroBenefits" :key="b.title" class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" :class="b.bg">
              <span v-html="b.icon" :class="['w-4 h-4', b.color]"></span>
            </div>
            <div class="min-w-0">
              <p class="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{{ b.title }}</p>
              <p class="text-[10px] sm:text-xs text-gray-400 leading-tight truncate">{{ b.sub }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Atalhos de categoria ─────────────────────────── -->
    <!-- ── Social Proof Strip ─────────────────────────────── -->
    <section class="bg-violet-50 border-b border-violet-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
        <div class="flex items-center gap-1.5">
          <div class="flex text-amber-400 text-sm leading-none">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
          </div>
          <span class="text-xs font-bold text-gray-800">4.9</span>
          <span class="text-xs text-gray-500">(+500 avaliações)</span>
        </div>
        <span class="hidden sm:block w-px h-3.5 bg-violet-200"></span>
        <span class="text-xs font-semibold text-violet-700">+1.500 professoras atendidas</span>
        <span class="hidden sm:block w-px h-3.5 bg-violet-200"></span>
        <span class="text-xs text-gray-500 font-medium">+100 atividades prontas para imprimir</span>
      </div>
    </section>

    <!-- ── Atalhos de categoria ─────────────────────────── -->
    <section v-if="categories.length" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <RouterLink to="/catalogo"
          class="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          Todos
        </RouterLink>
        <RouterLink to="/catalogo?destaque=1"
          class="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors whitespace-nowrap">
          🔥 Mais Vendidos
        </RouterLink>
        <RouterLink v-for="cat in categories" :key="cat.id" :to="`/catalogo?categoria=${encodeURIComponent(cat.slug)}`"
          :class="['flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap', cat.slug === 'gratis' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-700 hover:bg-violet-50 hover:text-violet-700']">
          <span v-if="cat.slug === 'gratis'">🎁 </span>{{ cat.name }}
        </RouterLink>
      </div>
    </section>

    <!-- ── Grupo Pedagógico — destaque premium ──────────── -->
    <section v-if="groupProduct" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-8">
      <div @click="buyGroupNow" class="block group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-3xl">
        <div class="relative rounded-3xl overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-violet-700 via-purple-700 to-pink-700 animate-gradient"></div>
          <div class="absolute -top-20 -right-20 w-72 h-72 bg-pink-500/25 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute inset-0 opacity-[0.06]"
            style="background-image:radial-gradient(circle, white 1px, transparent 1px); background-size: 24px 24px;"></div>

          <div class="relative flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-10">
            <!-- Imagem -->
            <div class="flex-shrink-0 relative">
              <div class="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-white/20
                           group-hover:scale-[1.04] group-hover:ring-white/40 transition-all duration-500">
                <img v-if="groupProduct.coverImageUrl"
                  :src="groupProduct.coverImageUrl" :alt="groupProduct.name"
                  class="w-full h-full object-cover" loading="lazy" decoding="async" />
                <div v-else class="w-full h-full bg-violet-500 flex items-center justify-center text-6xl">📚</div>
              </div>
              <div class="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 text-[11px] font-black
                           px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap">
                ⭐ Mais Vendido
              </div>
            </div>

            <!-- Conteúdo -->
            <div class="flex-1 text-center sm:text-left">
              <h2 class="text-white font-black text-2xl sm:text-3xl lg:text-4xl leading-tight mb-2 drop-shadow-sm">
                {{ groupProduct.name }}
              </h2>
              <p v-if="groupProduct.description"
                class="text-violet-200 text-sm sm:text-base leading-relaxed mb-5 line-clamp-2 max-w-lg">
                {{ groupProduct.description }}
              </p>

              <!-- Preço -->
              <div class="flex items-end gap-3 mb-6 justify-center sm:justify-start">
                <span class="text-4xl sm:text-5xl font-black text-white leading-none">
                  {{ formatPrice(groupProduct.price) }}
                </span>
                <div v-if="groupProduct.comparePrice" class="flex flex-col pb-1">
                  <span class="text-violet-300 text-sm line-through leading-tight">
                    {{ formatPrice(groupProduct.comparePrice) }}
                  </span>
                  <span class="bg-emerald-400 text-emerald-900 text-xs font-black px-2 py-0.5 rounded-full leading-tight text-center">
                    {{ discountPct(groupProduct) }}% OFF
                  </span>
                </div>
              </div>

              <!-- CTA -->
              <span class="inline-flex items-center gap-2.5 bg-white text-violet-700 font-black text-sm sm:text-base
                            px-7 py-3.5 rounded-xl shadow-xl group-hover:bg-violet-50 group-hover:shadow-2xl
                            group-hover:-translate-y-0.5 transition-all duration-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Comprar Agora
                <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Mais Vendidos ────────────────────────────────── -->
    <section v-if="bestSellers.length >= 1" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-xl font-black text-gray-800 flex items-center gap-2.5">
          <span class="w-1.5 h-7 rounded-full bg-gradient-to-b from-amber-400 to-orange-500 inline-block"></span>
          🔥 Mais Vendidos
        </h2>
        <RouterLink to="/catalogo?sort=vendas"
          class="text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors flex items-center gap-1 group bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full">
          Ver todos
          <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
        </RouterLink>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <ProductCard v-for="product in bestSellers" :key="product.id" :product="product" />
      </div>
    </section>

    <!-- ── Seções por Categoria ─────────────────────────── -->
    <template v-for="cat in categoriesWithProducts" :key="cat.id">
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-black text-gray-800 flex items-center gap-2.5">
            <span :class="['w-1.5 h-7 rounded-full inline-block', cat.slug === 'gratis' ? 'bg-gradient-to-b from-emerald-400 to-teal-500' : 'bg-gradient-to-b from-violet-500 to-pink-500']"></span>
            <span v-if="cat.slug === 'gratis'">🎁 </span>{{ cat.name }}
          </h2>
          <RouterLink :to="`/catalogo?categoria=${cat.slug}`"
            :class="['text-sm font-semibold transition-colors flex items-center gap-1 group px-3 py-1.5 rounded-full',
              cat.slug === 'gratis' ? 'text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100' : 'text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100']">
            Ver todos
            <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
            </svg>
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <ProductCard v-for="product in cat.products" :key="product.id" :product="product" />
        </div>
      </section>
    </template>

    <!-- ── Testimonials Marquee ──────────────────────────── -->
    <section ref="testimonialsSection" class="py-16 reveal relative overflow-hidden">
      <!-- Background -->
      <div class="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 animate-gradient"></div>
      <!-- Blur orbs -->
      <div class="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-pink-400/30 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-violet-400/30 blur-3xl pointer-events-none"></div>

      <div class="relative z-10">
        <div class="text-center mb-8 px-4">
          <p class="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">Depoimentos</p>
          <h2 class="text-3xl font-black text-white">
            O que nossas
            <span class="text-yellow-300">professoras</span>
            dizem ✨
          </h2>
        </div>

        <!-- Números de impacto -->
        <div class="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mb-10 px-4">
          <div v-for="stat in impactStats" :key="stat.label" class="text-center">
            <p class="text-2xl sm:text-3xl font-black text-white">{{ stat.value }}</p>
            <p class="text-xs sm:text-sm text-white/70 font-medium">{{ stat.label }}</p>
          </div>
        </div>

        <!-- Marquee row 1 -->
        <div class="overflow-hidden mb-4">
          <div class="flex gap-4 animate-marquee" style="width: max-content">
            <div v-for="(t, i) in [...testimonials, ...testimonials]" :key="`t1-${i}`"
              class="flex-shrink-0 w-72 bg-white/15 backdrop-blur-md rounded-2xl p-5
                     border border-white/20 hover:bg-white/25 transition-colors">
              <div class="flex text-yellow-300 text-sm mb-3 gap-0.5">
                <span v-for="s in 5" :key="s">★</span>
              </div>
              <p class="text-white/90 text-sm leading-relaxed mb-4 italic line-clamp-3">"{{ t.text }}"</p>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {{ t.name[0] }}
                </div>
                <div>
                  <p class="font-bold text-white text-sm leading-none">{{ t.name }}</p>
                  <p class="text-white/50 text-xs mt-0.5">{{ t.role }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Marquee row 2 (reversed) -->
        <div class="overflow-hidden">
          <div class="flex gap-4 animate-marquee-reverse" style="width: max-content">
            <div v-for="(t, i) in [...testimonialsExtra, ...testimonialsExtra]" :key="`t2-${i}`"
              class="flex-shrink-0 w-72 bg-white/10 backdrop-blur-md rounded-2xl p-5
                     border border-white/15 hover:bg-white/20 transition-colors">
              <div class="flex text-yellow-300 text-sm mb-3 gap-0.5">
                <span v-for="s in 5" :key="s">★</span>
              </div>
              <p class="text-white/85 text-sm leading-relaxed mb-4 italic line-clamp-3">"{{ t.text }}"</p>
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {{ t.name[0] }}
                </div>
                <div>
                  <p class="font-bold text-white text-sm leading-none">{{ t.name }}</p>
                  <p class="text-white/50 text-xs mt-0.5">{{ t.role }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Newsletter ────────────────────────────────────── -->
    <section ref="newsletterSection" class="py-16 reveal relative overflow-hidden" style="background-color: #0f0a1e;">
      <!-- Grid pattern -->
      <div class="absolute inset-0 opacity-[0.04]"
        style="background-image: linear-gradient(#7c3aed 1px, transparent 1px), linear-gradient(to right, #7c3aed 1px, transparent 1px); background-size: 32px 32px;"></div>
      <!-- Glow orbs -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-violet-600/20 blur-3xl rounded-full pointer-events-none"></div>

      <div class="max-w-lg mx-auto px-4 text-center relative z-10">
        <!-- Floating emojis around the icon -->
        <div class="relative inline-block mb-4">
          <div class="text-5xl float-emoji">📬</div>
          <span class="absolute -top-2 -right-3 text-lg sparkle-1">✨</span>
          <span class="absolute -bottom-1 -left-4 text-base sparkle-3">🌟</span>
        </div>
        <h2 class="text-2xl font-black text-white mb-2">
          Receba novidades em primeira mão
        </h2>
        <p class="text-gray-400 text-sm mb-8 leading-relaxed">
          Atividades novas, promoções e materiais pedagógicos gratuitos direto no seu e-mail!
        </p>

        <form @submit.prevent="subscribeNewsletter"
          class="flex flex-col xs:flex-row gap-2 max-w-sm mx-auto">
          <input
            v-model="newsletterEmail"
            type="email"
            placeholder="Seu melhor email"
            required
            class="flex-1 px-4 py-3 rounded-xl text-sm text-gray-800
                   focus:outline-none focus:ring-2 focus:ring-violet-400 bg-white
                   placeholder:text-gray-400 transition-all border-0"
          />
          <button type="submit" :disabled="newsletterSent"
            :class="['text-white font-bold px-5 py-3 rounded-xl text-sm transition-all duration-300 shadow-lg',
              'flex items-center justify-center gap-2 whitespace-nowrap',
              newsletterSent
                ? 'bg-emerald-500 shadow-emerald-500/30'
                : 'bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 shadow-violet-500/30 active:scale-95']">
            <transition name="icon-swap" mode="out-in">
              <svg v-if="!newsletterSent" key="send" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
              <svg v-else key="check" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </transition>
            {{ newsletterSent ? 'Cadastrado!' : 'Cadastrar' }}
          </button>
        </form>

        <!-- Trust badges -->
        <div class="flex items-center justify-center gap-5 mt-6">
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <svg class="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            Sem spam
          </span>
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <svg class="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Cancele quando quiser
          </span>
          <span class="flex items-center gap-1.5 text-xs text-gray-500">
            <svg class="w-3.5 h-3.5 text-pink-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            100% gratuito
          </span>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useHead } from '@vueuse/head';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { useSiteConfigStore } from '@/stores/site-config.store';
import { useCartStore } from '@/stores/cart.store';
import ProductCard from '@/components/catalog/ProductCard.vue';

const siteConfigStore = useSiteConfigStore();
const cart = useCartStore();

useHead(computed(() => {
  const cfg = siteConfigStore.config;
  const title = cfg.seoTitle || cfg.storeName || 'Site Pedagógico';
  const description = cfg.seoDescription || cfg.storeDescription || '';
  const image = cfg.logoUrl || cfg.bannerImageUrl || (cfg.banners?.[0]?.imageUrl) || '';
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: cfg.storeName },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ],
  };
}));

const categories = ref<any[]>([]);
const categoriesWithProducts = ref<any[]>([]);
const bestSellers = ref<any[]>([]);
const groupProduct = ref<any>(null);

const impactStats = [
  { value: '+1.500', label: 'Educadores atendidos' },
  { value: '+100', label: 'Atividades prontas' },
  { value: '4.9★', label: 'Avaliação média' },
  { value: '100%', label: 'Digital e imediato' },
];

const heroBenefits = [
  { title: 'Entrega imediata', sub: 'Baixe na hora', bg: 'bg-green-100', color: 'text-green-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>' },
  { title: 'Pronto para imprimir', sub: 'Arquivo em PDF', bg: 'bg-violet-100', color: 'text-violet-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>' },
  { title: 'Pagamento seguro', sub: 'Mercado Pago', bg: 'bg-sky-100', color: 'text-sky-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>' },
  { title: 'Acesso vitalício', sub: 'Baixe quando quiser', bg: 'bg-amber-100', color: 'text-amber-600', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>' },
];

// ── Banner carousel ──────────────────────────────────────
const bannerIndex = ref(0);
let bannerTimer: ReturnType<typeof setInterval> | null = null;

const bannerSlides = computed(() => {
  const cfg = siteConfigStore.config;
  return cfg.banners && cfg.banners.length > 0 ? cfg.banners : [];
});

const slideGradients = [
  'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
  'linear-gradient(135deg, #0EA5E9 0%, #6366F1 100%)',
  'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
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

// ── Newsletter ────────────────────────────────────────────
const newsletterEmail = ref('');
const newsletterSent = ref(false);

// ── Testimonials ─────────────────────────────────────────
const testimonials = [
  { name: 'Maria S.', role: 'Prof. Educação Infantil', text: 'Adorei as atividades! Meus alunos ficaram super animados e o material é de excelente qualidade.' },
  { name: 'Andressa L.', role: 'Pedagoga', text: 'Amei! Qualidade incrível, baixei rapidinho e já imprimi tudo. Recomendo demais para professores!' },
  { name: 'Fernanda G.', role: 'Coordenadora Pedagógica', text: 'Material muito bem elaborado. Já comprei várias vezes e sempre fico satisfeita com o resultado.' },
  { name: 'Carla M.', role: 'Prof. Ensino Fundamental', text: 'Atividades criativas e coloridas! As crianças amam e eu economizo muito tempo de preparação.' },
];

const testimonialsExtra = [
  { name: 'Juliana P.', role: 'Prof. Maternal', text: 'O download é super rápido e os arquivos vêm em alta resolução. Impressão perfeita!' },
  { name: 'Renata B.', role: 'Pedagoga', text: 'Encontrei tudo que precisava para o ano letivo. Variedade incrível de temas e idades.' },
  { name: 'Patricia S.', role: 'Prof. Alfabetização', text: 'Uso sempre! As atividades são alinhadas com a BNCC e facilitam muito meu planejamento.' },
  { name: 'Daniela C.', role: 'Supervisora Escolar', text: 'Recomendei para toda a equipe pedagógica. Custo-benefício excelente!' },
];

function buyGroupNow() {
  if (!groupProduct.value) return;
  cart.add({
    productId: groupProduct.value.id,
    name: groupProduct.value.name,
    price: Number(groupProduct.value.price),
    coverImageUrl: groupProduct.value.coverImageUrl,
    slug: groupProduct.value.slug,
  });
  cart.openCart();
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function discountPct(product: any) {
  if (!product.comparePrice) return 0;
  return Math.round((1 - product.price / product.comparePrice) * 100);
}

async function subscribeNewsletter() {
  const email = newsletterEmail.value.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
  try {
    await databases.createDocument(DB_ID, COLLECTIONS.NEWSLETTER, ID.unique(), {
      email, source: 'home', createdAt: new Date().toISOString(),
    });
  } catch (e: any) {
    if (e?.code !== 409) { console.error('[newsletter]', e); return; }
  }
  newsletterSent.value = true;
  newsletterEmail.value = '';
  setTimeout(() => { newsletterSent.value = false; }, 3500);
}

// ── Section refs ──────────────────────────────────────────
const testimonialsSection = ref<HTMLElement | null>(null);
const newsletterSection = ref<HTMLElement | null>(null);

let observer: IntersectionObserver | null = null;

function setupReveal() {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          entry.target.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  [testimonialsSection, newsletterSection]
    .forEach((ref) => { if (ref.value) observer!.observe(ref.value); });
}

onMounted(async () => {
  resetBannerTimer();
  setupReveal();

  await Promise.allSettled([
    (async () => {
      try {
        const catResult = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
          Query.equal('isActive', true),
          Query.orderAsc('sortOrder'),
          Query.limit(100),
        ]);
        const catDocs = catResult.documents;
        categories.value = catDocs.map((c: any) => ({ ...c, id: c.$id }));
        const catMap = new Map<string, any>();
        for (const cat of catDocs) {
          catMap.set(cat.$id, { ...cat, id: cat.$id, products: [] });
        }

        const prodResult = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true),
          Query.isNull('deletedAt'),
          Query.orderDesc('$createdAt'),
          Query.limit(300),
        ]);
        for (const p of prodResult.documents) {
          const mapped = {
            ...p,
            id: p.$id,
            coverImageUrl: p.coverImageUrl,
            comparePrice: p.comparePrice,
          };
          const catId = p.categoryId;
          if (!catId || !catMap.has(catId)) continue;
          if (catMap.get(catId)!.products.length < 6) catMap.get(catId)!.products.push(mapped);
        }
        categoriesWithProducts.value = Array.from(catMap.values())
          .filter((c) => c.products.length >= 1)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      } catch (e) { console.error('categories section error:', e); }
    })(),
    (async () => {
      try {
        const result = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true),
          Query.isNull('deletedAt'),
          Query.orderDesc('salesCount'),
          Query.limit(50),
        ]);
        const found = result.documents.find((p: any) =>
          p.name?.toLowerCase().includes('grupo')
        );
        if (found) {
          groupProduct.value = { ...found, id: found.$id, coverImageUrl: found.coverImageUrl, comparePrice: found.comparePrice };
        }
      } catch (e) { console.error('group product error:', e); }
    })(),
    (async () => {
      try {
        const mapP = (p: any) => ({ ...p, id: p.$id, coverImageUrl: p.coverImageUrl, comparePrice: p.comparePrice });
        let best = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true), Query.isNull('deletedAt'),
          Query.equal('isFeatured', true), Query.orderDesc('salesCount'), Query.limit(12),
        ]);
        if (best.documents.length === 0) {
          best = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
            Query.equal('isActive', true), Query.isNull('deletedAt'),
            Query.greaterThan('salesCount', 0), Query.orderDesc('salesCount'), Query.limit(6),
          ]);
        }
        bestSellers.value = best.documents.map(mapP);
      } catch (e) { console.error('best sellers error:', e); }
    })(),
  ]);
});

onUnmounted(() => {
  observer?.disconnect();
  if (bannerTimer) clearInterval(bannerTimer);
});
</script>

<style scoped>
.icon-swap-enter-active { transition: opacity 0.15s ease; }
.icon-swap-leave-active { transition: opacity 0.1s ease; position: absolute; }
.icon-swap-enter-from, .icon-swap-leave-to { opacity: 0; }

.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
