<template>
  <div class="fixed inset-0 z-50 flex justify-end" @click.self="$emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" @click="$emit('close')" />

    <!-- Drawer -->
    <div class="relative bg-white w-full max-w-sm h-full flex flex-col shadow-2xl animate-slide-in-right">

      <!-- Header com gradiente -->
      <div class="relative overflow-hidden px-5 py-5 flex-shrink-0">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />
        <div class="absolute inset-0 opacity-20"
          style="background-image: radial-gradient(circle at 80% 20%, white 0%, transparent 50%);" />
        <div class="relative flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-base font-black text-white">Meu Carrinho</h2>
              <p class="text-xs text-white/70">{{ cart.count }} {{ cart.count === 1 ? 'item selecionado' : 'itens selecionados' }}</p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 rounded-xl transition-all active:scale-90"
            aria-label="Fechar carrinho"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto py-4 px-4 space-y-3">

        <!-- Empty state -->
        <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-full text-center py-16 animate-fade-in">
          <div class="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center mb-5 float">
            <svg class="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 3h2l.4 2M7 13h10l4-9H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 class="font-black text-gray-800 text-lg mb-2">Carrinho vazio</h3>
          <p class="text-gray-400 text-sm mb-6 max-w-[200px] leading-relaxed">Adicione atividades pedagógicas incríveis ao seu carrinho</p>
          <RouterLink
            to="/catalogo"
            @click="$emit('close')"
            class="btn-primary text-sm px-6 py-2.5"
          >
            Ver Produtos
          </RouterLink>
        </div>

        <!-- Items list -->
        <transition-group name="cart-item" tag="div" class="space-y-3">
          <div
            v-for="item in cart.items"
            :key="item.productId"
            class="flex gap-3 p-3 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-200 group/item"
          >
            <RouterLink :to="`/produto/${item.slug}`" @click="$emit('close')" class="flex-shrink-0">
              <img
                :src="item.coverImageUrl"
                :alt="item.name"
                class="w-16 h-16 rounded-xl object-cover group-hover/item:scale-105 transition-transform duration-300 shadow-sm"
              />
            </RouterLink>
            <div class="flex-1 min-w-0">
              <RouterLink :to="`/produto/${item.slug}`" @click="$emit('close')">
                <p class="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug hover:text-primary-600 transition-colors">
                  {{ item.name }}
                </p>
              </RouterLink>
              <div class="flex items-center gap-1.5 mt-1.5">
                <span class="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">PDF</span>
                <span class="text-xs text-green-600 font-semibold">⚡ Download imediato</span>
              </div>
              <p class="text-base font-black text-primary-600 mt-1">{{ formatPrice(item.price) }}</p>
            </div>
            <button
              @click="cart.remove(item.productId)"
              class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 self-start active:scale-90 flex-shrink-0"
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
        <div v-if="cart.items.length > 0" class="px-4 pb-6 pt-4 border-t border-gray-100 space-y-3 bg-white flex-shrink-0">

          <!-- Total -->
          <div class="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <span class="text-sm text-gray-500 font-medium">Total</span>
            <span class="text-2xl font-black text-gray-900">{{ formatPrice(cart.total) }}</span>
          </div>

          <!-- Info -->
          <div class="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5">
            <svg class="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <p class="text-xs text-green-700 font-medium">Pagamento seguro • Download disponível na sua conta</p>
          </div>

          <!-- CTA -->
          <RouterLink
            to="/checkout"
            @click="$emit('close')"
            class="relative overflow-hidden flex items-center justify-center gap-2 w-full text-white font-bold text-sm py-4 rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-primary-200"
            style="background: linear-gradient(135deg, #7c3aed, #db2777)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
            Finalizar Compra
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </RouterLink>

          <button
            @click="$emit('close')"
            class="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
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
.animate-fade-in        { animation: fadeIn 0.25s ease forwards; }
.animate-slide-in-right { animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes fadeIn       { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

.cart-item-enter-active { transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.cart-item-leave-active { transition: all 0.2s ease; position: absolute; width: calc(100% - 2rem); }
.cart-item-enter-from   { opacity: 0; transform: translateX(20px) scale(0.96); }
.cart-item-leave-to     { opacity: 0; transform: translateX(20px) scale(0.96); }

.slide-footer-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-footer-enter-from   { transform: translateY(20px); opacity: 0; }

.float { animation: float 3s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
</style>
