<template>
  <div class="max-w-lg mx-auto px-4 py-12">
    <div class="card p-8">
      <!-- Success icon -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>
        <p class="text-gray-500 text-sm">Seus arquivos estão prontos para download.</p>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="space-y-3 mb-6">
        <div class="h-4 bg-gray-100 rounded animate-pulse"></div>
        <div class="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
      </div>

      <!-- Downloads -->
      <div v-else-if="order" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedido #{{ order.orderNumber }}</p>
          <span class="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Pago</span>
        </div>

        <div class="space-y-3">
          <div v-for="item in order.items" :key="item.id">
            <div class="bg-gray-50 rounded-2xl p-4">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </div>
                <p class="font-medium text-gray-900 text-sm flex-1">{{ item.productName }}</p>
              </div>
              <div v-for="token in item.downloadTokens" :key="token.token" class="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <p class="text-xs text-gray-400">{{ token.downloadCount }}/{{ token.maxDownloads }} downloads usados</p>
                <a :href="`/api/downloads/${token.token}`" target="_blank"
                  class="inline-flex items-center justify-center gap-1.5 text-sm bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-medium w-full xs:w-auto">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Baixar PDF
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info box -->
      <div class="bg-blue-50 rounded-xl p-3 flex gap-2 text-xs text-blue-700 mb-6">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Os links de download ficam disponíveis para sempre na área "Meus Downloads" da sua conta.</span>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <RouterLink to="/minha-conta/downloads" class="flex-1 btn-primary text-center text-sm py-3">
          <svg class="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Meus Downloads
        </RouterLink>
        <RouterLink to="/catalogo" class="flex-1 btn-secondary text-center text-sm py-3">
          Ver mais produtos
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/stores/cart.store';

const route = useRoute();
const cart = useCartStore();
const order = ref<any>(null);
const loading = ref(true);

let pollInterval: ReturnType<typeof setInterval>;

async function loadOrder() {
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, products(id, name, cover_image_url, slug), download_tokens(*))')
    .eq('id', route.params.orderId as string)
    .single();
  order.value = data;
  return data?.status;
}

onMounted(async () => {
  try {
    cart.clear();
    const status = await loadOrder();
    loading.value = false;

    if (status === 'AWAITING_PAYMENT') {
      let attempts = 0;
      pollInterval = setInterval(async () => {
        attempts++;
        try {
          const { data } = await supabase.from('orders').select('status').eq('id', route.params.orderId as string).single();
          if (data?.status === 'PAID') {
            clearInterval(pollInterval);
            await loadOrder();
          }
        } catch {}
        if (attempts >= 12) clearInterval(pollInterval);
      }, 5000);
    }
  } catch {
    loading.value = false;
  }
});

onUnmounted(() => clearInterval(pollInterval));
</script>
