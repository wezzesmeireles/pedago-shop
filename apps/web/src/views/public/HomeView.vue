<template>
  <div>

    <!-- ── Hero Banner ──────────────────────────────────── -->
    <section class="relative overflow-hidden" :style="bannerBg">
      <!-- Colorful top stripe -->
      <div class="absolute top-0 left-0 right-0 h-2.5 flex overflow-hidden">
        <span v-for="c in stripeColors" :key="c" class="flex-1" :style="{ background: c }"></span>
      </div>

      <!-- Decorative blobs -->
      <div class="absolute top-6 right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-6 left-10 w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 relative z-10">
        <div class="flex flex-col md:flex-row items-center justify-between gap-10">
          <!-- Text -->
          <div class="flex-1 text-center md:text-left animate-slide-in-up">
            <h1 class="font-black leading-tight">
              <span class="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-yellow-300 drop-shadow-lg mb-1">
                FAÇA SUA COMPRA!
              </span>
              <span class="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white drop-shadow">
                RECEBA PELO EMAIL
              </span>
              <span class="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white drop-shadow">
                E NO WHATSAPP
              </span>
            </h1>

            <RouterLink
              to="/catalogo"
              class="inline-flex items-center gap-2 mt-8 bg-yellow-400 hover:bg-yellow-300
                     active:scale-95 text-yellow-900 font-bold px-7 py-3.5 rounded-2xl
                     shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
            >
              Ver Atividades
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </RouterLink>
          </div>

          <!-- Pedagogy illustrations -->
          <div class="relative w-72 h-64 hidden md:block flex-shrink-0">

            <!-- Big open book -->
            <div class="absolute top-0 right-0 float" style="animation-duration:5s">
              <svg width="130" height="100" viewBox="0 0 130 100" fill="none">
                <!-- Book cover left -->
                <path d="M8 14 Q8 8 14 8 L62 8 L62 88 L14 88 Q8 88 8 82 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2"/>
                <!-- Book cover right -->
                <path d="M68 8 L116 8 Q122 8 122 14 L122 82 Q122 88 116 88 L68 88 Z" fill="#3B82F6" stroke="#2563EB" stroke-width="2"/>
                <!-- Spine -->
                <rect x="60" y="6" width="10" height="86" rx="2" fill="#6D28D9"/>
                <!-- Left page lines -->
                <line x1="18" y1="26" x2="54" y2="26" stroke="#FDE68A" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="18" y1="36" x2="54" y2="36" stroke="#FDE68A" stroke-width="2.5" stroke-linecap="round"/>
                <line x1="18" y1="46" x2="44" y2="46" stroke="#FDE68A" stroke-width="2.5" stroke-linecap="round"/>
                <!-- Right: ABC -->
                <text x="76" y="42" font-size="22" font-weight="900" fill="#DBEAFE" font-family="Arial">ABC</text>
                <text x="78" y="64" font-size="14" font-weight="700" fill="#BFDBFE" font-family="Arial">123</text>
                <!-- Stars on cover -->
                <text x="22" y="70" font-size="14">⭐</text>
                <text x="38" y="70" font-size="14">⭐</text>
              </svg>
            </div>

            <!-- Colorful pencil bundle -->
            <div class="absolute bottom-2 left-0 float-delay" style="animation-duration:4s">
              <svg width="110" height="130" viewBox="0 0 110 130" fill="none">
                <!-- Pencil 1 (yellow) - tilted left -->
                <g transform="rotate(-18, 30, 65)">
                  <rect x="22" y="10" width="16" height="90" rx="3" fill="#FACC15"/>
                  <polygon points="22,100 38,100 30,118" fill="#FCA5A5"/>
                  <rect x="22" y="10" width="16" height="14" rx="3" fill="#9CA3AF"/>
                  <line x1="29" y1="118" x2="31" y2="118" stroke="#374151" stroke-width="1.5"/>
                </g>
                <!-- Pencil 2 (red) - center -->
                <g transform="rotate(0, 55, 65)">
                  <rect x="47" y="6" width="16" height="92" rx="3" fill="#F87171"/>
                  <polygon points="47,98 63,98 55,116" fill="#FDE68A"/>
                  <rect x="47" y="6" width="16" height="14" rx="3" fill="#9CA3AF"/>
                  <line x1="54" y1="116" x2="56" y2="116" stroke="#374151" stroke-width="1.5"/>
                </g>
                <!-- Pencil 3 (green) - tilted right -->
                <g transform="rotate(16, 80, 65)">
                  <rect x="72" y="10" width="16" height="90" rx="3" fill="#4ADE80"/>
                  <polygon points="72,100 88,100 80,118" fill="#FCA5A5"/>
                  <rect x="72" y="10" width="16" height="14" rx="3" fill="#9CA3AF"/>
                  <line x1="79" y1="118" x2="81" y2="118" stroke="#374151" stroke-width="1.5"/>
                </g>
                <!-- Pencil 4 (blue) behind left -->
                <g transform="rotate(-30, 10, 65)">
                  <rect x="2" y="14" width="14" height="84" rx="3" fill="#60A5FA"/>
                  <polygon points="2,98 16,98 9,113" fill="#FDE68A"/>
                  <rect x="2" y="14" width="14" height="12" rx="3" fill="#9CA3AF"/>
                </g>
                <!-- Pencil 5 (purple) behind right -->
                <g transform="rotate(28, 100, 65)">
                  <rect x="94" y="14" width="14" height="84" rx="3" fill="#C084FC"/>
                  <polygon points="94,98 108,98 101,113" fill="#FDE68A"/>
                  <rect x="94" y="14" width="14" height="12" rx="3" fill="#9CA3AF"/>
                </g>
                <!-- Rubber band -->
                <ellipse cx="55" cy="88" rx="38" ry="6" fill="none" stroke="#E879F9" stroke-width="3" stroke-dasharray="4 2"/>
              </svg>
            </div>

            <!-- Stars scattered -->
            <div class="absolute top-8 left-16 float" style="animation-duration:3s; animation-delay:0.5s">
              <svg width="36" height="36" viewBox="0 0 36 36">
                <path d="M18 3 L21.5 13.5 L33 13.5 L23.5 20.5 L27 31 L18 24.5 L9 31 L12.5 20.5 L3 13.5 L14.5 13.5 Z" fill="#FBBF24" stroke="#F59E0B" stroke-width="1"/>
              </svg>
            </div>
            <div class="absolute bottom-16 right-6 float-slow" style="animation-delay:1s">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M12 2 L14.5 9 L22 9 L16 13.5 L18.5 21 L12 17 L5.5 21 L8 13.5 L2 9 L9.5 9 Z" fill="#F472B6"/>
              </svg>
            </div>
            <div class="absolute top-2 left-4 float-delay" style="animation-duration:6s">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M9 1 L11 7 L17 7 L12 10.5 L14 17 L9 13.5 L4 17 L6 10.5 L1 7 L7 7 Z" fill="#34D399"/>
              </svg>
            </div>

            <!-- Ruler -->
            <div class="absolute top-24 left-6 float" style="animation-duration:7s; animation-delay:0.8s">
              <svg width="90" height="22" viewBox="0 0 90 22">
                <rect x="0" y="4" width="90" height="14" rx="3" fill="#FCD34D" stroke="#F59E0B" stroke-width="1.5"/>
                <line x1="10" y1="4" x2="10" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="20" y1="4" x2="20" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="30" y1="4" x2="30" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="40" y1="4" x2="40" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="50" y1="4" x2="50" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="60" y1="4" x2="60" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="70" y1="4" x2="70" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="80" y1="4" x2="80" y2="18" stroke="#92400E" stroke-width="1.2"/>
                <line x1="15" y1="9" x2="15" y2="18" stroke="#92400E" stroke-width="0.8"/>
                <line x1="25" y1="9" x2="25" y2="18" stroke="#92400E" stroke-width="0.8"/>
                <line x1="35" y1="9" x2="35" y2="18" stroke="#92400E" stroke-width="0.8"/>
                <line x1="45" y1="9" x2="45" y2="18" stroke="#92400E" stroke-width="0.8"/>
                <line x1="55" y1="9" x2="55" y2="18" stroke="#92400E" stroke-width="0.8"/>
                <line x1="65" y1="9" x2="65" y2="18" stroke="#92400E" stroke-width="0.8"/>
                <line x1="75" y1="9" x2="75" y2="18" stroke="#92400E" stroke-width="0.8"/>
              </svg>
            </div>

            <!-- Apple -->
            <div class="absolute top-0 left-28 float-slow" style="animation-delay:2s">
              <svg width="42" height="46" viewBox="0 0 42 46">
                <!-- Leaf -->
                <path d="M21 8 Q28 2 30 8 Q26 10 21 8Z" fill="#4ADE80"/>
                <!-- Stem -->
                <line x1="21" y1="8" x2="21" y2="13" stroke="#92400E" stroke-width="1.5"/>
                <!-- Apple body -->
                <path d="M8 18 Q6 12 12 10 Q17 8 21 12 Q25 8 30 10 Q36 12 34 18 Q38 26 34 34 Q30 42 21 42 Q12 42 8 34 Q4 26 8 18Z" fill="#F87171"/>
                <!-- Shine -->
                <path d="M14 16 Q16 12 20 14 Q18 18 14 16Z" fill="#FECACA" opacity="0.8"/>
              </svg>
            </div>

          </div>
        </div>
      </div>

      <!-- Bottom stripe -->
      <div class="absolute bottom-0 left-0 right-0 h-2.5 flex overflow-hidden">
        <span v-for="c in [...stripeColors].reverse()" :key="c" class="flex-1" :style="{ background: c }"></span>
      </div>
    </section>

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
import api from '@/services/api';
import { useSiteConfigStore } from '@/stores/site-config.store';
import { useCartStore } from '@/stores/cart.store';
import ProductCard from '@/components/catalog/ProductCard.vue';

const siteConfigStore = useSiteConfigStore();
const cart = useCartStore();
const config = siteConfigStore.config;

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

const bannerBg = computed(() => ({
  background: `linear-gradient(135deg, ${config.primaryColor || '#7c3aed'}, ${config.secondaryColor || '#9333ea'})`,
}));

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
  setupReveal();

  await Promise.allSettled([
    api.get('/products/featured').then((res) => {
      featuredProducts.value = res.data ?? [];
      loadingFeatured.value = false;
    }).catch(() => { loadingFeatured.value = false; }),

    api.get('/products', { params: { limit: 24 } }).then((res) => {
      const data = res.data?.items ?? res.data ?? [];
      atividades.value = data;
      groupProduct.value = data.find((p: any) =>
        p.name?.toLowerCase().includes('grupo') || Number(p.price) > 20
      ) ?? null;
      loadingAtividades.value = false;
    }).catch(() => { loadingAtividades.value = false; }),
  ]);
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<style scoped>
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
