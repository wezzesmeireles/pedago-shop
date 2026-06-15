<template>
  <Teleport to="body">
    <Transition name="fab">
      <!--
        Wrapper full-width com pointer-events:none centraliza sem transform no botão.
        Isso resolve o bug de área de clique desalinhada causado por translateX(-50%)
        no próprio elemento interativo.
      -->
      <div v-if="show" class="fab-rail" aria-hidden="false">
        <button
          @click="cart.openCart()"
          class="fab-btn"
          :aria-label="`Abrir carrinho — ${cart.count} ${cart.count === 1 ? 'item' : 'itens'}, ${formatPrice(cart.total)}`"
        >
          <!-- Ícone com badge -->
          <div class="relative flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <Transition name="badge-pop">
              <span
                :key="cart.count"
                class="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full
                       flex items-center justify-center text-[10px] font-black text-white leading-none
                       bg-pink-400 border-2 border-violet-700"
              >
                {{ cart.count > 9 ? '9+' : cart.count }}
              </span>
            </Transition>
          </div>

          <span class="font-bold text-sm text-white/90 leading-none hidden sm:inline">Ver carrinho</span>
          <span class="font-bold text-sm text-white/90 leading-none sm:hidden">Carrinho</span>

          <span class="w-px h-4 bg-white/25 flex-shrink-0" aria-hidden="true" />

          <span class="font-black text-base text-white leading-none tracking-tight">
            {{ formatPrice(cart.total) }}
          </span>

          <svg class="w-4 h-4 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCartStore } from '@/stores/cart.store';

const cart = useCartStore();
const route = useRoute();

const HIDDEN_ROUTES = ['checkout', 'checkout-success'];

const show = computed(() =>
  cart.count > 0 &&
  !cart.isOpen &&
  !HIDDEN_ROUTES.some(r => route.name === r || String(route.name).startsWith(r))
);

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}
</script>

<style scoped>
/* ─── Rail: posicionamento sem transform no botão ─── */
.fab-rail {
  position: fixed;
  left: 0;
  right: 0;
  z-index: 49;
  /* Mobile: acima da bottom nav */
  bottom: calc(68px + env(safe-area-inset-bottom, 0px));
  /* Centraliza o conteúdo sem tocar no botão */
  display: flex;
  justify-content: center;
  /* Não bloqueia cliques no conteúdo abaixo */
  pointer-events: none;
}

@media (min-width: 768px) {
  .fab-rail { bottom: 24px; }
}

/* ─── Botão: recebe pointer-events de volta ─── */
.fab-btn {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 9999px;
  white-space: nowrap;
  position: relative;
  /* Toque responsivo — sem delay de 300ms no iOS */
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;

  background: linear-gradient(135deg, #7c3aed, #db2777);
  box-shadow:
    0 8px 32px -4px rgba(124, 58, 237, 0.5),
    0 2px 8px -2px rgba(0, 0, 0, 0.18);

  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.fab-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4px 16px -4px rgba(124, 58, 237, 0.4);
}

/* Brilho interno */
.fab-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 60%);
  pointer-events: none;
}

/* ─── Animação do rail (sobe do rodapé) ─── */
.fab-enter-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease; }
.fab-leave-active { transition: transform 0.2s ease, opacity 0.15s ease; }
.fab-enter-from { transform: translateY(80px); opacity: 0; }
.fab-leave-to   { transform: translateY(60px); opacity: 0; }

/* ─── Badge bounce ─── */
.badge-pop-enter-active { animation: badge-bounce 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes badge-bounce {
  0%   { transform: scale(0.3); opacity: 0; }
  60%  { transform: scale(1.25); }
  100% { transform: scale(1); opacity: 1; }
}
</style>
