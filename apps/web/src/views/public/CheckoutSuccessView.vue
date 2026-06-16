<template>
  <div class="max-w-lg mx-auto px-4 py-12">
    <div class="card p-8">
      <!-- Success icon -->
      <div class="text-center mb-8 stagger-item" style="--i:0">
        <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 bounce-in pulse-glow">
          <svg class="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path class="draw-check" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 class="text-2xl font-black text-gray-900 mb-2 stagger-item" style="--i:1">Pagamento Confirmado! 🎉</h1>
        <p class="text-gray-500 text-sm stagger-item" style="--i:2">Seus arquivos estão prontos para download.</p>
      </div>

      <!-- In-app browser warning (Instagram/Facebook can't save files) -->
      <button v-if="inApp.inApp" @click="showOpenInBrowser = true"
        class="w-full text-left mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100/70 transition-colors">
        <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/>
        </svg>
        <span class="text-sm text-amber-800">
          Você está no navegador {{ inApp.name ? `do ${inApp.name}` : 'do app' }}. Para baixar, <strong class="underline">abra no Chrome/Safari</strong> — toque aqui para ver como.
        </span>
      </button>

      <OpenInBrowserModal v-model="showOpenInBrowser" :name="inApp.name" />

      <!-- Loading -->
      <div v-if="loading" class="space-y-3 mb-6">
        <div class="h-4 shimmer rounded"></div>
        <div class="h-14 shimmer rounded-xl"></div>
        <div class="h-14 shimmer rounded-xl"></div>
      </div>

      <!-- Awaiting payment confirmation -->
      <div v-else-if="awaitingPayment" class="text-center py-4 mb-6">
        <div class="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-3"></div>
        <p class="text-sm text-gray-500">Confirmando pagamento...</p>
      </div>

      <!-- Downloads -->
      <div v-else-if="order" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pedido #{{ order.order_number }}</p>
          <span class="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Pago</span>
        </div>

        <div class="space-y-3">
          <div v-for="(item, i) in order.order_items" :key="item.id" class="bg-gray-50 rounded-2xl p-4 stagger-item" :style="{ '--i': i + 3 }">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
              <p class="font-medium text-gray-900 text-sm flex-1">{{ item.product_name }}</p>
            </div>

            <div v-if="item.download_tokens?.length">
              <div v-for="token in item.download_tokens" :key="token.id" class="flex flex-col xs:flex-row xs:items-center justify-end gap-2">
                <!-- Link delivery -->
                <a v-if="token.delivery_link" :href="token.delivery_link" target="_blank" rel="noopener"
                  class="inline-flex items-center justify-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium w-full xs:w-auto">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  Acessar Conteúdo
                </a>
                <!-- PDF delivery -->
                <button v-else @click="downloadFile(item, token)"
                  class="inline-flex items-center justify-center gap-1.5 text-sm bg-primary-600 text-white px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-medium w-full xs:w-auto">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Baixar PDF
                </button>
              </div>
            </div>
            <p v-else class="text-xs text-amber-600">Conteúdo sendo preparado, aguarde alguns instantes...</p>
          </div>
        </div>
      </div>

      <!-- Info box: guest → CTA para criar conta; logado → info padrão -->
      <div v-if="isGuest" class="bg-violet-50 border border-violet-100 rounded-xl p-3 flex gap-2 text-xs text-violet-700 mb-6">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
        </svg>
        <span>
          Crie uma conta com o mesmo celular e seus downloads ficam salvos para sempre.
          <RouterLink to="/cadastro" class="font-bold underline ml-1">Criar conta grátis →</RouterLink>
        </span>
      </div>
      <div v-else class="bg-blue-50 rounded-xl p-3 flex gap-2 text-xs text-blue-700 mb-6">
        <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span>Os links de download ficam disponíveis para sempre na área "Meus Downloads" da sua conta.</span>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <RouterLink to="/minha-conta/downloads" class="flex-1 btn-primary text-center text-sm py-3">
          <svg class="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { databases, DB_ID, COLLECTIONS, account, functions, fetchProductFile, saveBlob } from '@/lib/appwrite';
import { invokeFunction } from '@/services/api';
import { Query } from 'appwrite';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { detectInAppBrowser, isAndroid, tryOpenInExternalBrowserAndroid } from '@/lib/inAppBrowser';
import OpenInBrowserModal from '@/components/ui/OpenInBrowserModal.vue';

const route = useRoute();
const router = useRouter();
const cart = useCartStore();
const auth = useAuthStore();

// Sessão guest: usuário comprou sem criar conta (via compra rápida)
const isGuest = computed(() => !auth.user?.email && auth.isLoggedIn);
const order = ref<any>(null);
const loading = ref(true);
const awaitingPayment = ref(false);

// In-app browsers (Instagram/Facebook/etc.) can't save files — route the user
// to a real browser instead of letting the download silently fail.
const inApp = detectInAppBrowser();
const showOpenInBrowser = ref(false);

let pollInterval: ReturnType<typeof setInterval>;

async function triggerDownload(token: string, fallbackFilename: string) {
  try {
    // Step 1: Call download function to validate token + get file info
    const execution = await functions.createExecution(
      'download',
      '',
      false,
      `/?token=${encodeURIComponent(token)}`,
      'GET' as any,
      {},
    )

    if (execution.responseStatusCode >= 400) {
      let errMsg = 'Download failed'
      try { errMsg = JSON.parse(execution.responseBody)?.error ?? errMsg } catch {}
      throw new Error(errMsg)
    }

    const data = JSON.parse(execution.responseBody)

    // Step 2: Handle response — link delivery or redirect
    if (data.redirectUrl || data.type === 'link') {
      const linkUrl = data.redirectUrl ?? data.url
      if (import.meta.env.VITE_TARGET === 'mobile') {
        const { openUrl } = await import('@/mobile/download')
        await openUrl(linkUrl)
      } else {
        window.open(linkUrl, '_blank')
      }
      return
    }

    // Step 3: Download the file from Storage, authenticated via JWT (see
    // fetchProductFile — this is the part that used to fail for some clients).
    const blob = await fetchProductFile(data.fileId)
    saveBlob(blob, data.filename ?? fallbackFilename)
  } catch (err: any) {
    console.error('Download error:', err)
    alert(err.message ?? 'Erro ao baixar arquivo')
  }
}

async function downloadFile(_item: any, token: any) {
  if (inApp.inApp) {
    showOpenInBrowser.value = true;
    if (isAndroid()) tryOpenInExternalBrowserAndroid(window.location.href);
    return;
  }
  await triggerDownload(token.token, 'download.pdf');
  token.download_count++;
}

async function loadOrder() {
  const orderDoc = await databases.getDocument(DB_ID, COLLECTIONS.ORDERS, route.params.orderId as string);
  if (!orderDoc) return null;

  // Security: verify order belongs to current user.
  // Skip for guest sessions — anonymous users land here via a URL that was
  // generated for them by the checkout flow, and the route guard already
  // validated the session. A false-positive redirect here would break their
  // download experience, since account.get() may return a different ID after
  // the anonymous session lifecycle has mutated.
  const isGuestSession = !!localStorage.getItem('pedago_guest');
  if (!isGuestSession) {
    try {
      const me = await account.get();
      if (orderDoc.userId !== me.$id) {
        router.replace('/minha-conta/pedidos');
        return null;
      }
    } catch { /* if not logged in, requiresAuth guard already handled */ }
  }

  // Fetch order items
  const itemsResult = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [
    Query.equal('orderId', orderDoc.$id),
    Query.limit(100),
  ]);

  // For each item, fetch its download tokens
  const itemsWithTokens = await Promise.all(
    itemsResult.documents.map(async (item: any) => {
      const tokensResult = await databases.listDocuments(DB_ID, COLLECTIONS.DOWNLOAD_TOKENS, [
        Query.equal('orderItemId', item.$id),
        Query.isNull('revokedAt'),
        Query.limit(10),
      ]);
      return {
        ...item,
        id: item.$id,
        product_name: item.productName,
        download_tokens: tokensResult.documents.map((t: any) => ({
          ...t,
          id: t.$id,
          download_count: t.downloadCount,
          max_downloads: t.maxDownloads,
          delivery_link: t.deliveryLink ?? null,
        })),
      };
    }),
  );

  order.value = {
    ...orderDoc,
    order_number: orderDoc.orderNumber,
    order_items: itemsWithTokens,
  };
  return orderDoc.status;
}

function startWaiting(orderId: string) {
  awaitingPayment.value = true;

  let attempts = 0;
  pollInterval = setInterval(async () => {
    attempts++;
    try {
      const result = await invokeFunction('reconcile-orders', { orderId }).catch(() => null) as { reconciled: number; orderStatus?: string | null } | null;
      if (result?.orderStatus === 'PAID') {
        clearInterval(pollInterval);
        await loadOrder();
        awaitingPayment.value = false;
        return;
      }
      // Fallback: client-side read (registered users / when function fails)
      if (!result) {
        try {
          const orderDoc = await databases.getDocument(DB_ID, COLLECTIONS.ORDERS, orderId);
          if (orderDoc?.status === 'PAID') {
            clearInterval(pollInterval);
            await loadOrder();
            awaitingPayment.value = false;
          }
        } catch {}
      }
    } catch {}
    // Poll for ~5 min (PIX buyers often take a few minutes in their bank app).
    // After that the every-5-min reconcile cron confirms it on the next tick.
    if (attempts >= 60) {
      clearInterval(pollInterval);
      awaitingPayment.value = false;
    }
  }, 5000);
}

onMounted(async () => {
  const orderId = route.params.orderId as string;
  try {
    await invokeFunction('reconcile-orders', { orderId }).catch(() => {});
    const status = await loadOrder();
    loading.value = false;
    if (status === 'PAID') cart.clear(); // Only clear cart after confirmed payment
    if (status === 'AWAITING_PAYMENT') {
      startWaiting(orderId);
    }
  } catch {
    loading.value = false;
  }
});

onUnmounted(() => {
  clearInterval(pollInterval);
  // Limpa a sessão guest ao sair da success page —
  // fetchMe vai deletar a sessão anônima na próxima visita
  localStorage.removeItem('pedago_guest');
});
</script>
