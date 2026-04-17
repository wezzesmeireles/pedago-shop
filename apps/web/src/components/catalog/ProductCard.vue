<template>
  <div
    class="group bg-white rounded-xl overflow-hidden border border-gray-100
           hover:border-violet-200 hover:shadow-xl transition-all duration-300
           flex flex-col hover:-translate-y-1 relative"
  >
    <!-- Shine border on hover -->
    <div
      class="shine-card pointer-events-none absolute inset-0 rounded-xl opacity-0
             group-hover:opacity-100 transition-opacity duration-300 z-10"
    />

    <!-- Image -->
    <RouterLink :to="`/produto/${product.slug}`" class="block relative overflow-hidden bg-gray-50">
      <div class="aspect-square overflow-hidden">
        <img
          :src="product.coverImageUrl"
          :alt="product.name"
          class="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-500"
          loading="lazy"
        />
      </div>

      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <!-- Badges -->
      <div class="absolute top-1.5 left-1.5 flex flex-col gap-1">
        <span
          v-if="product.comparePrice"
          class="bg-gradient-to-r from-red-500 to-pink-500 text-white text-[9px] font-bold
                 px-1.5 py-0.5 rounded-full leading-none shadow"
        >OFERTA</span>
        <span
          v-else-if="product.isFeatured"
          class="bg-gradient-to-r from-amber-400 to-yellow-300 text-yellow-900 text-[9px]
                 font-bold px-1.5 py-0.5 rounded-full leading-none shadow"
        >★ TOP</span>
      </div>

      <!-- Discount % badge -->
      <div v-if="product.comparePrice" class="absolute top-1.5 right-1.5">
        <span class="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
          -{{ discountPct }}%
        </span>
      </div>

      <!-- Quick view hint -->
      <div
        class="absolute inset-x-0 bottom-0 text-center pb-2
               opacity-0 group-hover:opacity-100 transition-all duration-300
               translate-y-2 group-hover:translate-y-0"
      >
        <span class="bg-white/90 text-gray-800 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm">
          Ver detalhes →
        </span>
      </div>
    </RouterLink>

    <!-- Info -->
    <div class="p-2.5 flex flex-col flex-1">
      <RouterLink :to="`/produto/${product.slug}`">
        <h3 class="text-xs font-medium text-gray-700 leading-snug line-clamp-2 mb-2
                   group-hover:text-violet-600 transition-colors duration-200 min-h-[2.5rem]">
          {{ product.name }}
        </h3>
      </RouterLink>

      <div class="mt-auto space-y-2">
        <!-- Price -->
        <div class="flex items-center gap-1.5">
          <span class="text-sm font-black text-violet-700">{{ formatPrice(product.price) }}</span>
          <span v-if="product.comparePrice" class="text-[11px] text-gray-400 line-through">
            {{ formatPrice(product.comparePrice) }}
          </span>
        </div>

        <!-- Add to cart -->
        <button
          ref="cartBtn"
          @click.prevent="addToCart"
          :disabled="justAdded"
          class="w-full font-bold text-xs py-2 rounded-lg transition-all duration-200
                 flex items-center justify-center gap-1.5 active:scale-95
                 focus:outline-none focus:ring-2 focus:ring-offset-1 relative overflow-hidden"
          :class="justAdded
            ? 'bg-emerald-500 text-white focus:ring-emerald-400'
            : 'bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-700 hover:to-pink-600 text-white focus:ring-violet-400 shadow hover:shadow-violet-300'"
        >
          <transition name="btn-icon" mode="out-in">
            <svg v-if="justAdded" key="check" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <svg v-else key="cart" class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </transition>
          <transition name="btn-text" mode="out-in">
            <span :key="justAdded ? 'added' : 'buy'">{{ justAdded ? 'Adicionado!' : 'Comprar' }}</span>
          </transition>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCartStore } from '@/stores/cart.store';
import { useConfetti } from '@/composables/useConfetti';

const props = defineProps<{
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    coverImageUrl: string;
    isFeatured?: boolean;
    pageCount?: number;
    category?: { name: string };
  };
}>();

const cart = useCartStore();
const { fireCartConfetti } = useConfetti();
const justAdded = ref(false);
const cartBtn = ref<HTMLButtonElement | null>(null);

const discountPct = computed(() => {
  if (!props.product.comparePrice) return 0;
  return Math.round((1 - props.product.price / props.product.comparePrice) * 100);
});

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

function addToCart() {
  cart.add({
    productId: props.product.id,
    name: props.product.name,
    price: Number(props.product.price),
    coverImageUrl: props.product.coverImageUrl,
    slug: props.product.slug,
  });
  justAdded.value = true;
  fireCartConfetti(cartBtn.value ?? undefined);
  setTimeout(() => { justAdded.value = false; }, 1800);
}
</script>

<style scoped>
.shine-card {
  background-image: radial-gradient(transparent, transparent, #7C3AED, #EC4899, transparent, transparent);
  background-size: 300% 300%;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  padding: 1px;
  animation: card-shine 4s linear infinite;
}
@keyframes card-shine {
  0%   { background-position: 0% 0%; }
  50%  { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

.btn-icon-enter-active, .btn-icon-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.btn-icon-enter-from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
.btn-icon-leave-to   { opacity: 0; transform: scale(0.5) rotate(10deg); }

.btn-text-enter-active, .btn-text-leave-active { transition: opacity 0.15s ease; }
.btn-text-enter-from, .btn-text-leave-to { opacity: 0; }
</style>
