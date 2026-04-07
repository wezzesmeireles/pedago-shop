<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
    <div
      class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
      @click="$emit('close')"
    />

    <!-- Drawer -->
    <div class="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl animate-slide-in-right">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-base font-bold text-gray-900">Carrinho</h2>
            <p class="text-xs text-gray-400">{{ cart.count }} {{ cart.count === 1 ? 'item' : 'itens' }}</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="p-2 hover:bg-gray-100 rounded-full transition-all active:scale-90 text-gray-500 hover:text-gray-700"
          aria-label="Fechar carrinho"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto py-3 px-4 space-y-2.5">

        <!-- Empty state -->
        <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
          <div class="text-6xl mb-4 float">🛒</div>
          <h3 class="font-bold text-gray-800 mb-1">Carrinho vazio</h3>
          <p class="text-gray-400 text-sm mb-6 max-w-[200px]">Adicione atividades pedagógicas ao seu carrinho</p>
          <RouterLink
            to="/catalogo"
            @click="$emit('close')"
            class="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm
                   px-5 py-2.5 rounded-xl transition-all active:scale-95 shadow-md"
          >
            Ver Produtos
          </RouterLink>
        </div>

        <!-- Items list -->
        <transition-group name="cart-item" tag="div" class="space-y-2.5">
          <div
            v-for="item in cart.items"
            :key="item.productId"
            class="flex gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl
                   transition-colors duration-200 group/item"
          >
            <RouterLink :to="`/produto/${item.slug}`" @click="$emit('close')">
              <img
                :src="item.coverImageUrl"
                :alt="item.name"
                class="w-16 h-16 rounded-xl object-cover flex-shrink-0
                       group-hover/item:scale-105 transition-transform duration-300 shadow-sm"
              />
            </RouterLink>
            <div class="flex-1 min-w-0">
              <RouterLink :to="`/produto/${item.slug}`" @click="$emit('close')">
                <p class="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-primary-600 transition-colors">
                  {{ item.name }}
                </p>
              </RouterLink>
              <p class="text-sm font-bold text-green-600 mt-1">{{ formatPrice(item.price) }}</p>
            </div>
            <button
              @click="cart.remove(item.productId)"
              class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50
                     rounded-lg transition-all duration-200 self-start active:scale-90"
              aria-label="Remover item"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </transition-group>
      </div>

      <!-- Footer -->
      <transition name="slide-footer">
        <div v-if="cart.items.length > 0" class="px-4 pb-5 pt-3 border-t border-gray-100 space-y-3 bg-white">
          <!-- Total -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-500">Subtotal</span>
            <span class="text-xl font-black text-gray-900">{{ formatPrice(cart.total) }}</span>
          </div>

          <!-- Info note -->
          <div class="flex items-center gap-2 bg-green-50 rounded-xl px-3 py-2.5">
            <svg class="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <p class="text-xs text-green-700 font-medium">Pagamento seguro • PDF entregue por email</p>
          </div>

          <!-- CTA -->
          <RouterLink
            to="/checkout"
            @click="$emit('close')"
            class="btn-primary w-full text-center block text-sm py-3.5"
          >
            Finalizar Compra →
          </RouterLink>

          <!-- Continue shopping -->
          <button
            @click="$emit('close')"
            class="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-1"
          >
            Continuar comprando
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart.store';

const cart = useCartStore();
defineEmits(['close']);

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}
</script>

<style scoped>
.animate-fade-in   { animation: fadeIn 0.25s ease forwards; }
.animate-slide-in-right { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

/* Cart item transitions */
.cart-item-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.cart-item-leave-active {
  transition: all 0.2s ease;
  position: absolute;
  width: calc(100% - 2rem);
}
.cart-item-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}

/* Slide footer */
.slide-footer-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-footer-enter-from   { transform: translateY(20px); opacity: 0; }

/* Float for empty state */
.float { animation: float 3s ease-in-out infinite; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-10px); }
}
</style>
