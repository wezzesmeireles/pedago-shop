<template>
  <div class="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end" @click.self="$emit('close')">

    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" @click="$emit('close')" />

    <!-- Drawer: bottom sheet no mobile, painel lateral no desktop -->
    <div class="relative bg-[#f8f7fc] w-full md:max-w-sm h-[90svh] md:h-full flex flex-col shadow-2xl rounded-t-3xl md:rounded-none animate-slide-in-bottom md:animate-slide-in-right">

      <!-- Handle bar mobile -->
      <div class="flex justify-center pt-3 pb-1 md:hidden flex-shrink-0">
        <div class="w-10 h-1 rounded-full bg-gray-300" />
      </div>

      <!-- ── Header ── -->
      <div class="relative overflow-hidden flex-shrink-0">
        <!-- Fundo gradiente -->
        <div class="absolute inset-0 bg-gradient-to-br from-violet-700 via-purple-700 to-pink-600" />
        <!-- Círculo decorativo de luz -->
        <div class="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
        <div class="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 -translate-x-8 translate-y-8" />

        <div class="relative px-5 py-5">
          <div class="flex items-center justify-between">
            <!-- Ícone + título -->
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="w-11 h-11 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <!-- Badge de contagem -->
                <div v-if="cart.count > 0" class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-pink-400 rounded-full flex items-center justify-center border-2 border-violet-700">
                  <span class="text-[10px] font-black text-white leading-none">{{ cart.count > 9 ? '9+' : cart.count }}</span>
                </div>
              </div>
              <div>
                <h2 class="text-base font-black text-white leading-none">Meu Carrinho</h2>
                <p class="text-xs text-white/65 mt-0.5">
                  {{ cart.count === 0 ? 'Vazio' : cart.count === 1 ? '1 item' : `${cart.count} itens` }}
                  <span v-if="cart.count > 0"> · ⚡ Download após pagamento</span>
                </p>
              </div>
            </div>

            <!-- Fechar -->
            <button
              @click="$emit('close')"
              class="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/15 rounded-xl transition-all active:scale-90"
              aria-label="Fechar carrinho"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ── Lista de itens ── -->
      <div class="flex-1 overflow-y-auto py-4 px-4 space-y-2.5">

        <!-- Estado vazio -->
        <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
          <div class="w-24 h-24 rounded-3xl bg-white shadow-sm flex items-center justify-center mx-auto mb-5">
            <svg class="w-12 h-12 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 class="font-black text-gray-800 text-lg mb-1.5">Carrinho vazio</h3>
          <p class="text-gray-400 text-sm mb-6 max-w-[200px] leading-relaxed">
            Explore nossas atividades pedagógicas e adicione ao carrinho
          </p>
          <RouterLink
            to="/catalogo"
            @click="$emit('close')"
            class="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-md shadow-violet-200"
          >
            Ver produtos
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </RouterLink>
        </div>

        <!-- Cards de produto -->
        <transition-group name="cart-item" tag="div" class="space-y-2.5">
          <div
            v-for="item in cart.items"
            :key="item.productId"
            class="group/item flex gap-3 bg-white rounded-2xl p-3 shadow-sm border border-white hover:border-violet-100 hover:shadow-md transition-all duration-200"
          >
            <!-- Thumbnail -->
            <RouterLink :to="`/produto/${item.slug}`" @click="$emit('close')" class="flex-shrink-0" :aria-label="item.name">
              <div class="relative w-[72px] h-[72px] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
                <img
                  :src="item.coverImageUrl"
                  :alt="item.name"
                  class="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                />
                <!-- Badge PDF -->
                <span class="absolute bottom-1 left-1 text-[9px] font-black text-white bg-violet-600/90 px-1.5 py-0.5 rounded-md leading-none">PDF</span>
              </div>
            </RouterLink>

            <!-- Info -->
            <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <RouterLink :to="`/produto/${item.slug}`" @click="$emit('close')">
                <p class="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-violet-600 transition-colors">
                  {{ item.name }}
                </p>
              </RouterLink>
              <div class="flex items-center justify-between mt-1.5">
                <p class="text-base font-black text-violet-600">{{ formatPrice(item.price) }}</p>
                <span class="text-[11px] text-green-600 font-semibold">⚡ Imediato</span>
              </div>
            </div>

            <!-- Remover -->
            <button
              @click="cart.remove(item.productId)"
              class="flex-shrink-0 self-start mt-0.5 w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all duration-150 active:scale-90"
              :aria-label="`Remover ${item.name}`"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </transition-group>

      </div>

      <!-- ── Footer ── -->
      <transition name="slide-footer">
        <div v-if="cart.items.length > 0" class="flex-shrink-0 bg-white border-t border-gray-100 px-4 pt-4 pb-5 space-y-3" style="padding-bottom: max(20px, env(safe-area-inset-bottom, 20px))">

          <!-- Total box -->
          <div class="flex items-center justify-between bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-2xl px-4 py-3.5">
            <div>
              <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide leading-none">Total</p>
              <p class="text-[11px] text-gray-400 mt-0.5">{{ cart.count }} {{ cart.count === 1 ? 'item' : 'itens' }}</p>
            </div>
            <p class="text-2xl font-black text-gray-900">{{ formatPrice(cart.total) }}</p>
          </div>

          <!-- Trust row compacta -->
          <div class="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              Seguro
            </span>
            <span class="w-px h-3 bg-gray-200" aria-hidden="true" />
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Download imediato
            </span>
            <span class="w-px h-3 bg-gray-200" aria-hidden="true" />
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
              PIX ou Cartão
            </span>
          </div>

          <!-- CTA principal -->
          <RouterLink
            v-if="auth.isLoggedIn"
            to="/checkout"
            @click="$emit('close')"
            class="checkout-cta"
            :aria-label="`Finalizar compra — ${formatPrice(cart.total)}`"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            <span>Finalizar Compra</span>
            <span class="ml-auto font-black">{{ formatPrice(cart.total) }}</span>
          </RouterLink>

          <button
            v-else
            @click="showGuestModal = true"
            class="checkout-cta"
            aria-label="Comprar agora sem criar conta"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <span>Comprar agora</span>
            <span class="ml-auto font-black">{{ formatPrice(cart.total) }}</span>
          </button>

          <!-- Link secundário -->
          <button
            @click="$emit('close')"
            class="w-full text-sm text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors py-1 font-medium"
          >
            ← Continuar comprando
          </button>

        </div>
      </transition>
    </div>
  </div>

  <GuestCheckoutModal v-model="showGuestModal" @navigate="$emit('close')" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import GuestCheckoutModal from '@/components/checkout/GuestCheckoutModal.vue';

const cart = useCartStore();
const auth = useAuthStore();
defineEmits(['close']);

const showGuestModal = ref(false);

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}
</script>

<style scoped>
/* ── Entrada do drawer ── */
.animate-fade-in         { animation: fadeIn 0.2s ease forwards; }
.animate-slide-in-right  { animation: slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
.animate-slide-in-bottom { animation: slideInBottom 0.36s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes fadeIn        { from { opacity: 0 } to { opacity: 1 } }
@keyframes slideInRight  { from { transform: translateX(100%) } to { transform: translateX(0) } }
@keyframes slideInBottom { from { transform: translateY(100%) } to { transform: translateY(0) } }

/* ── Animação de item ── */
.cart-item-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.cart-item-leave-active { transition: all 0.18s ease; position: absolute; width: calc(100% - 2rem); }
.cart-item-enter-from   { opacity: 0; transform: translateX(16px) scale(0.97); }
.cart-item-leave-to     { opacity: 0; transform: translateX(16px) scale(0.97); }

/* ── Slide do footer ── */
.slide-footer-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-footer-enter-from   { transform: translateY(24px); opacity: 0; }

/* ── CTA de checkout ── */
.checkout-cta {
  @apply relative flex items-center gap-2.5 w-full text-white font-bold py-4 px-5
         rounded-2xl transition-all duration-150 active:scale-[0.98] overflow-hidden;
  background: linear-gradient(135deg, #7c3aed, #db2777);
  font-size: 16px;
  min-height: 56px;
  box-shadow: 0 8px 24px -4px rgba(124, 58, 237, 0.35);
}
.checkout-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
  pointer-events: none;
}
.checkout-cta:active {
  box-shadow: 0 4px 12px -4px rgba(124, 58, 237, 0.25);
}
</style>
