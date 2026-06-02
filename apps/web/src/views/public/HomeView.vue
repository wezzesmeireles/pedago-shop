<template>
  <div>

    <!-- ── Hero Banner Carousel ────────────────────────── -->
    <section class="relative overflow-hidden">
      <div class="relative">
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
            />
            <div
              v-else
              class="w-full min-h-[200px] sm:min-h-[320px] md:min-h-[420px] animate-gradient"
              :style="slideBg(slide, idx)"
            ></div>
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
    <section v-if="categoriesWithProducts.length" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
      <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <RouterLink to="/catalogo"
          class="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full bg-violet-600 text-white hover:bg-violet-700 transition-colors">
          Todos
        </RouterLink>
        <RouterLink v-for="cat in categoriesWithProducts" :key="cat.id" :to="`/catalogo?categoria=${cat.slug}`"
          class="flex-shrink-0 text-sm font-semibold px-4 py-2 rounded-full bg-gray-100 text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors whitespace-nowrap">
          {{ cat.name }}
        </RouterLink>
      </div>
    </section>

    <!-- ── Últimas Compras ────────────────────────────────── -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="relative flex h-2.5 w-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <p class="text-sm font-bold text-gray-700">Compras em tempo real</p>
      </div>

      <div class="relative h-48 sm:h-72 overflow-hidden">
        <!-- skeleton while loading -->
        <div v-if="!recentPurchases.length" class="flex flex-col gap-2 sm:gap-3">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
            <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shimmer flex-shrink-0"></div>
            <div class="flex-1 space-y-1">
              <div class="h-2.5 sm:h-3 shimmer rounded w-3/4"></div>
              <div class="h-2 shimmer rounded w-1/2"></div>
            </div>
            <div class="h-3 sm:h-4 shimmer rounded w-12 sm:w-16"></div>
          </div>
        </div>

        <AnimatedList v-else :items="recentPurchases" :delay="1500" :max-visible="4">
          <template #default="{ item }">
            <div class="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 sm:p-4
                        shadow-sm hover:shadow-md hover:border-violet-100 transition-all duration-200">
              <div class="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-xl sm:text-2xl"
                   :style="{ background: item.color }">
                {{ item.icon }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-xs sm:text-sm font-bold text-gray-800 truncate">{{ item.name }}</p>
                <p class="text-[10px] sm:text-xs text-gray-400 truncate">{{ item.buyer }} · {{ item.time }}</p>
              </div>
              <span class="text-xs sm:text-sm font-black text-violet-700 flex-shrink-0">{{ item.price }}</span>
            </div>
          </template>
        </AnimatedList>
        <!-- fade bottom -->
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-white to-transparent"></div>
      </div>
    </section>

    <!-- ── Mais Vendidos ────────────────────────────────── -->
    <section v-if="bestSellers.length >= 4" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

    <!-- ── Grátis ───────────────────────────────────────── -->
    <section v-if="freeProducts.length" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="rounded-3xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 p-5 sm:p-7">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-xl font-black text-gray-800 flex items-center gap-2">🎁 Atividades Grátis</h2>
            <p class="text-sm text-emerald-700/80 mt-0.5">Baixe agora sem pagar nada — experimente a qualidade!</p>
          </div>
          <RouterLink to="/catalogo?gratis=1"
            class="hidden sm:flex text-sm text-emerald-700 hover:text-emerald-800 font-semibold items-center gap-1 group bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            Ver todas
            <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </RouterLink>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <ProductCard v-for="product in freeProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <!-- ── Seções por Categoria ─────────────────────────── -->
    <template v-for="cat in categoriesWithProducts" :key="cat.id">
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-black text-gray-800 flex items-center gap-2.5">
            <span class="w-1.5 h-7 rounded-full bg-gradient-to-b from-violet-500 to-pink-500 inline-block"></span>
            {{ cat.name }}
          </h2>
          <RouterLink :to="`/catalogo?categoria=${cat.slug}`"
            class="text-sm text-violet-600 hover:text-violet-700 font-semibold transition-colors
                   flex items-center gap-1 group bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full">
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

    <!-- ── Atividades ────────────────────────────────────── -->
    <section ref="atividadesSection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 reveal">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-black text-gray-800 flex items-center gap-2.5">
          <span class="w-1.5 h-7 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500 inline-block"></span>
          Atividades
        </h2>
        <div class="flex items-center gap-1.5">
          <button @click="atividadesPage = Math.max(0, atividadesPage - 1)" :disabled="atividadesPage === 0"
            class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                   text-gray-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600
                   transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <span class="text-xs text-gray-400 min-w-[3rem] text-center">{{ atividadesPage + 1 }} / {{ maxAtividadesPage + 1 }}</span>
          <button @click="atividadesPage = Math.min(maxAtividadesPage, atividadesPage + 1)" :disabled="atividadesPage >= maxAtividadesPage"
            class="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center
                   text-gray-500 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600
                   transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90">
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
        <div :key="atividadesPage" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <ProductCard
            v-for="(product, i) in pagedAtividades" :key="product.id" :product="product"
            :style="{ transitionDelay: `${i * 40}ms` }"
          />
        </div>
      </transition>
    </section>

    <!-- ── Featured Group Product ────────────────────────── -->
    <section v-if="groupProduct" ref="groupSection" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14 reveal">
      <div class="rounded-3xl overflow-hidden shadow-2xl border border-purple-100 relative">
        <!-- Animated gradient background -->
        <div class="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 animate-gradient"></div>
        <!-- Sparkle decorations -->
        <div class="absolute top-6 right-10 w-3 h-3 bg-yellow-400 rounded-full sparkle-1"></div>
        <div class="absolute top-16 right-24 w-2 h-2 bg-pink-400 rounded-full sparkle-2"></div>
        <div class="absolute bottom-10 left-10 w-2 h-2 bg-violet-400 rounded-full sparkle-3"></div>
        <div class="absolute top-8 left-32 w-1.5 h-1.5 bg-emerald-400 rounded-full sparkle-4"></div>

        <div class="relative flex flex-col md:flex-row items-stretch">
          <!-- Image side -->
          <div class="w-full md:w-1/2 relative overflow-hidden min-h-64
                       bg-gradient-to-br from-violet-200 to-pink-200
                       flex items-center justify-center p-8">
            <img v-if="groupProduct.coverImageUrl"
              :src="groupProduct.coverImageUrl" :alt="groupProduct.name"
              class="max-h-72 object-contain rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-700"
            />
            <div v-else class="w-48 h-48 rounded-full bg-gradient-to-br from-violet-400 to-pink-400
                                flex items-center justify-center text-white text-6xl float">📚</div>
            <!-- Badge -->
            <div class="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-black
                        px-3 py-1.5 rounded-full shadow-lg animate-bounce-in flex items-center gap-1">
              <span class="sparkle-1 inline-block w-2 h-2 bg-yellow-600 rounded-full"></span>
              🌟 Mais Vendido
            </div>
          </div>

          <!-- Info side -->
          <div class="w-full md:w-1/2 p-8 flex flex-col justify-center relative">
            <p class="text-xs font-bold text-violet-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span class="w-4 h-0.5 bg-violet-400 rounded-full"></span>
              Grupo Pedagógico
            </p>
            <h3 class="text-2xl md:text-3xl font-black text-gray-900 leading-tight mb-3">{{ groupProduct.name }}</h3>
            <p v-if="groupProduct.description" class="text-gray-500 text-sm mb-6 leading-relaxed line-clamp-3">{{ groupProduct.description }}</p>

            <div class="flex items-baseline gap-3 mb-6">
              <span class="text-4xl font-black bg-gradient-to-r from-violet-700 to-pink-600 bg-clip-text text-transparent">
                {{ formatPrice(groupProduct.price) }}
              </span>
              <span v-if="groupProduct.comparePrice" class="text-lg text-gray-400 line-through">{{ formatPrice(groupProduct.comparePrice) }}</span>
              <span v-if="groupProduct.comparePrice"
                class="text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-1 rounded-full animate-bounce-in">
                {{ discountPct(groupProduct) }}% OFF
              </span>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden hover:border-violet-300 transition-colors">
                <button @click="groupQty = Math.max(1, groupQty - 1)"
                  class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-xl active:scale-90">−</button>
                <span class="w-10 text-center font-bold text-sm select-none">{{ groupQty }}</span>
                <button @click="groupQty++"
                  class="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-xl active:scale-90">+</button>
              </div>
              <ShimmerButton
                @click="addGroupToCart"
                class="flex-1 flex items-center justify-center gap-2 font-black text-sm rounded-xl px-6 py-3"
                background="linear-gradient(135deg, #7C3AED, #EC4899)"
                border-radius="12px"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Comprar Agora
              </ShimmerButton>
            </div>
          </div>
        </div>
      </div>
    </section>

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
import { invokeFunction } from '@/services/api';
import { Query, ID } from 'appwrite';
import { useSiteConfigStore } from '@/stores/site-config.store';
import { useCartStore } from '@/stores/cart.store';
import ProductCard from '@/components/catalog/ProductCard.vue';
import SparklesText from '@/components/ui/SparklesText.vue';
import ShimmerButton from '@/components/ui/ShimmerButton.vue';
import AnimatedList from '@/components/ui/AnimatedList.vue';

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
const freeProducts = ref<any[]>([]);

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

// ── Products ─────────────────────────────────────────────
const atividades = ref<any[]>([]);
const groupProduct = ref<any>(null);
const loadingAtividades = ref(true);
const atividadesPage = ref(0);
const groupQty = ref(1);
const newsletterEmail = ref('');
const newsletterSent = ref(false);

const ATIVIDADES_PER_PAGE = 6;

const pagedAtividades = computed(() =>
  atividades.value.slice(atividadesPage.value * ATIVIDADES_PER_PAGE, (atividadesPage.value + 1) * ATIVIDADES_PER_PAGE)
);
const maxAtividadesPage = computed(() =>
  Math.max(0, Math.ceil(atividades.value.length / ATIVIDADES_PER_PAGE) - 1)
);

// ── Testimonials ─────────────────────────────────────────
const testimonials = [
  { name: 'Maria S.', role: 'Prof. Educação Infantil', text: 'Adorei as atividades! Meus alunos ficaram super animados e o material é de excelente qualidade.' },
  { name: 'Andressa L.', role: 'Pedagoga', text: 'Amei! Qualidade incrível, baixei rapidinho e já imprimi tudo. Recomendo demais para professores!' },
  { name: 'Fernanda G.', role: 'Coordenadora Pedagógica', text: 'Material muito bem elaborado. Já comprei várias vezes e sempre fico satisfeita com o resultado.' },
  { name: 'Carla M.', role: 'Prof. Ensino Fundamental', text: 'Atividades criativas e coloridas! As crianças amam e eu economizo muito tempo de preparação.' },
];

// ── Recent purchases (Appwrite Function) ─────────────────
const recentPurchases = ref<any[]>([]);

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

const PURCHASE_ICONS = ['📚', '✏️', '🎨', '🧩', '🌟', '🖍️', '📒', '🔤', '🧮', '🎒'];
const PURCHASE_COLORS = ['#EDE9FE', '#FCE7F3', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#FFE4E6', '#E0E7FF'];

async function loadRecentPurchases() {
  try {
    const parsed = await invokeFunction<any>('recent-purchases');
    const data: any[] = Array.isArray(parsed) ? parsed : (parsed?.purchases ?? []);
    recentPurchases.value = data.map((p: any, i: number) => ({
      name: p.customerName || 'Cliente',
      buyer: 'acabou de comprar',
      price: formatPrice(Number(p.totalAmount) || 0),
      time: p.paidAt ? relativeTime(p.paidAt) : 'recentemente',
      icon: PURCHASE_ICONS[i % PURCHASE_ICONS.length],
      color: PURCHASE_COLORS[i % PURCHASE_COLORS.length],
    }));
  } catch (e) {
    console.error('[recent-purchases]', e);
  }
}

const testimonialsExtra = [
  { name: 'Juliana P.', role: 'Prof. Maternal', text: 'O download é super rápido e os arquivos vêm em alta resolução. Impressão perfeita!' },
  { name: 'Renata B.', role: 'Pedagoga', text: 'Encontrei tudo que precisava para o ano letivo. Variedade incrível de temas e idades.' },
  { name: 'Patricia S.', role: 'Prof. Alfabetização', text: 'Uso sempre! As atividades são alinhadas com a BNCC e facilitam muito meu planejamento.' },
  { name: 'Daniela C.', role: 'Supervisora Escolar', text: 'Recomendei para toda a equipe pedagógica. Custo-benefício excelente!' },
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
const atividadesSection = ref<HTMLElement | null>(null);
const groupSection = ref<HTMLElement | null>(null);
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

  [atividadesSection, groupSection, testimonialsSection, newsletterSection]
    .forEach((ref) => { if (ref.value) observer!.observe(ref.value); });
}

onMounted(async () => {
  resetBannerTimer();
  setupReveal();
  loadRecentPurchases();

  await Promise.allSettled([
    (async () => {
      try {
        // Fetch all active categories for the section layout
        const catResult = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
          Query.equal('isActive', true),
          Query.orderAsc('sortOrder'),
          Query.limit(100),
        ]);
        const catDocs = catResult.documents;
        const catMap = new Map<string, any>();
        for (const cat of catDocs) {
          catMap.set(cat.$id, { ...cat, id: cat.$id, products: [] });
        }

        // Fetch products and place them into their category buckets
        const prodResult = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true),
          Query.isNull('deletedAt'),
          Query.orderDesc('$createdAt'),
          Query.limit(100),
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
        // Esconde categorias com poucos produtos (fileira "quebrada")
        categoriesWithProducts.value = Array.from(catMap.values())
          .filter((c) => c.products.length >= 4)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      } catch (e) { console.error('categories section error:', e); }
    })(),
    (async () => {
      try {
        // Mais vendidos
        const best = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true), Query.isNull('deletedAt'),
          Query.greaterThan('salesCount', 0), Query.orderDesc('salesCount'), Query.limit(6),
        ]);
        bestSellers.value = best.documents.map((p: any) => ({ ...p, id: p.$id, coverImageUrl: p.coverImageUrl, comparePrice: p.comparePrice }));
      } catch (e) { console.error('best sellers error:', e); }
    })(),
    (async () => {
      try {
        // Grátis
        const free = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true), Query.isNull('deletedAt'),
          Query.equal('price', 0), Query.orderDesc('$createdAt'), Query.limit(6),
        ]);
        freeProducts.value = free.documents.map((p: any) => ({ ...p, id: p.$id, coverImageUrl: p.coverImageUrl, comparePrice: p.comparePrice }));
      } catch (e) { console.error('free products error:', e); }
    })(),
    (async () => {
      try {
        const prodResult = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
          Query.equal('isActive', true),
          Query.isNull('deletedAt'),
          Query.orderDesc('$createdAt'),
          Query.limit(24),
        ]);
        const mapped = prodResult.documents.map((p: any) => ({
          ...p,
          id: p.$id,
          coverImageUrl: p.coverImageUrl,
          comparePrice: p.comparePrice,
        }));
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
.fade-page-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-page-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.fade-page-enter-from  { opacity: 0; transform: translateX(12px); }
.fade-page-leave-to    { opacity: 0; transform: translateX(-12px); }

.icon-swap-enter-active { transition: opacity 0.15s ease; }
.icon-swap-leave-active { transition: opacity 0.1s ease; position: absolute; }
.icon-swap-enter-from, .icon-swap-leave-to { opacity: 0; }

.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
</style>
