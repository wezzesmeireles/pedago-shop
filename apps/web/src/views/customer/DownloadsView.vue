<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Meus Downloads</h1>
      <span v-if="!loading && allDownloads.length" class="text-sm text-gray-500">{{ allDownloads.length }} {{ allDownloads.length === 1 ? 'arquivo' : 'arquivos' }}</span>
    </div>

    <!-- In-app browser warning (Instagram/Facebook can't save files) -->
    <button v-if="inApp.inApp" @click="showOpenInBrowser = true"
      class="w-full text-left mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100/70 transition-colors">
      <svg class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z"/>
      </svg>
      <span class="text-sm text-amber-800">
        Você está no navegador {{ inApp.name ? `do ${inApp.name}` : 'do app' }}. Para baixar, <strong class="underline">abra no Chrome/Safari</strong> — toque aqui para ver como.
      </span>
    </button>

    <OpenInBrowserModal v-model="showOpenInBrowser" :name="inApp.name" />

    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card p-5 stagger-item" :style="{ '--i': i - 1 }">
        <div class="flex gap-4">
          <div class="w-16 h-16 shimmer rounded-2xl flex-shrink-0"></div>
          <div class="flex-1 space-y-2.5 py-1">
            <div class="h-4 shimmer rounded w-2/3"></div>
            <div class="h-3 shimmer rounded w-1/3"></div>
            <div class="h-2 shimmer rounded-full w-1/2 mt-2"></div>
          </div>
          <div class="w-20 h-9 shimmer rounded-xl flex-shrink-0"></div>
        </div>
      </div>
    </div>

    <!-- Syncing guest orders (race condition: reconcile still running) -->
    <div v-else-if="syncing" class="text-center py-16">
      <div class="animate-spin w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-4"></div>
      <p class="text-sm font-medium text-gray-600 mb-1">Sincronizando compras anteriores...</p>
      <p class="text-xs text-gray-400">Isso acontece uma única vez.</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="allDownloads.length === 0" class="text-center py-20">
      <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
      </div>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nenhum download disponível</h2>
      <p class="text-gray-500 text-sm mb-6">Compre uma atividade para acessar seus arquivos aqui.</p>
      <RouterLink to="/catalogo" class="btn-primary">Ver Atividades</RouterLink>
    </div>

    <!-- Download list -->
    <div v-else class="space-y-3">
      <div v-for="(download, i) in allDownloads" :key="download.token" class="card p-4 sm:p-5 hover:shadow-md transition-shadow stagger-item" :style="{ '--i': i }">
        <div class="flex gap-3 sm:gap-4">
          <!-- Cover image -->
          <div class="flex-shrink-0">
            <img v-if="download.coverImageUrl" :src="download.coverImageUrl" :alt="download.productName" class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-sm" />
            <div v-else class="w-14 h-14 sm:w-16 sm:h-16 bg-primary-100 rounded-2xl flex items-center justify-center">
              <svg class="w-7 h-7 sm:w-8 sm:h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>

          <!-- Info + action -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <h3 class="font-semibold text-gray-900 text-sm sm:text-base leading-snug mb-0.5 line-clamp-2">{{ download.productName }}</h3>
                <p class="text-xs text-gray-400">Pedido {{ download.orderNumber }}</p>
              </div>
              <!-- Action button (top right on mobile) -->
              <div class="flex-shrink-0">
                <span v-if="download.expired" class="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded-xl font-medium whitespace-nowrap">
                  Expirado
                </span>
                <!-- Link delivery -->
                <a v-else-if="download.deliveryLink" :href="download.deliveryLink" target="_blank" rel="noopener"
                  class="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                  </svg>
                  <span>Acessar</span>
                </a>
                <!-- PDF delivery — unlimited downloads -->
                <a v-else href="#" @click.prevent="downloadFile(download)"
                  class="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  <span>Baixar</span>
                </a>
              </div>
            </div>

            <!-- Expiry -->
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <p class="text-xs" :class="download.expired ? 'text-red-400' : isExpiringSoon(download) ? 'text-amber-500' : 'text-gray-400'">
                <span v-if="download.expired">Expirado</span>
                <span v-else-if="isExpiringSoon(download)">Expira {{ formatExpiry(download.expiresAt) }}</span>
                <span v-else>Válido até {{ formatExpiry(download.expiresAt) }}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { databases, DB_ID, COLLECTIONS, account, functions, fetchProductFile, saveBlob } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { detectInAppBrowser, isAndroid, tryOpenInExternalBrowserAndroid } from '@/lib/inAppBrowser';
import OpenInBrowserModal from '@/components/ui/OpenInBrowserModal.vue';

interface DownloadEntry {
  token: string;
  fileKey: string;
  productName: string;
  orderNumber: string;
  coverImageUrl?: string;
  downloadCount: number;
  maxDownloads: number;
  expiresAt: string;
  expired: boolean;
  deliveryLink?: string;
}

const loading = ref(true);
const syncing = ref(false);
const allDownloads = ref<DownloadEntry[]>([]);

// In-app browsers (Instagram/Facebook/etc.) can't save files — detect and route
// the user to a real browser instead of letting the download silently fail.
const inApp = detectInAppBrowser();
const showOpenInBrowser = ref(false);

function isExpiringSoon(d: DownloadEntry): boolean {
  if (d.expired) return false;
  return new Date(d.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
}

function formatExpiry(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

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

async function downloadFile(d: DownloadEntry) {
  if (d.expired) return;
  if (inApp.inApp) {
    showOpenInBrowser.value = true;
    // Android: immediately fire the intent to open in the system browser so
    // the user doesn't need to tap a second button in the modal.
    if (isAndroid()) tryOpenInExternalBrowserAndroid(window.location.href);
    return;
  }
  await triggerDownload(d.token, 'download.pdf');
  d.downloadCount++;
}

// Fetch all documents where `field` is in `ids`, batching ids into chunks
// to keep query size sane. Reduces N+1 sequential queries to a few batched ones.
async function fetchByIds(collection: string, field: string, ids: string[], extraQueries: any[] = []) {
  const out: any[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const res = await databases.listDocuments(DB_ID, collection, [
      Query.equal(field, chunk),
      ...extraQueries,
      Query.limit(5000),
    ]);
    out.push(...res.documents);
  }
  return out;
}

async function fetchOrders(userId: string) {
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
    Query.equal('userId', userId),
    Query.equal('status', 'PAID'),
    Query.orderDesc('$createdAt'),
    Query.limit(500),
  ]);
  return result.documents;
}

onMounted(async () => {
  try {
    const currentUser = await account.get();

    // 1. PAID orders for the user
    let orders = await fetchOrders(currentUser.$id);

    // No orders found — if user has a phone, they may have bought via Compra
    // Rápida before creating an account. The background reconcile (fired by
    // fetchMe on login) runs async and may not have finished yet. Wait for it
    // synchronously so the user doesn't see an empty state immediately.
    if (!orders.length && currentUser.phone) {
      syncing.value = true;
      try {
        await functions.createExecution(
          'reconcile-orders',
          JSON.stringify({ linkPhone: currentUser.phone, linkUserId: currentUser.$id }),
          false, '/', 'POST' as any, { 'Content-Type': 'application/json' },
        );
        orders = await fetchOrders(currentUser.$id);
      } catch { /* reconcile failure is non-blocking */ }
      syncing.value = false;
    }

    if (!orders.length) { allDownloads.value = []; return; }

    // 2. All items for those orders (batched) + 3. all non-revoked tokens (batched)
    const orderMap = Object.fromEntries(orders.map((o: any) => [o.$id, o]));
    const items = await fetchByIds(COLLECTIONS.ORDER_ITEMS, 'orderId', orders.map((o: any) => o.$id));
    const itemMap = Object.fromEntries(items.map((i: any) => [i.$id, i]));
    const tokens = items.length
      ? await fetchByIds(COLLECTIONS.DOWNLOAD_TOKENS, 'orderItemId', items.map((i: any) => i.$id), [Query.isNull('revokedAt')])
      : [];

    // Order tokens by their item's order recency (orders already desc) then dedupe by product
    const orderIndex = Object.fromEntries(orders.map((o: any, idx: number) => [o.$id, idx]));
    tokens.sort((a: any, b: any) => {
      const ia = orderIndex[itemMap[a.orderItemId]?.orderId] ?? 9e9;
      const ib = orderIndex[itemMap[b.orderItemId]?.orderId] ?? 9e9;
      return ia - ib;
    });

    const seen = new Set<string>();
    const downloads: DownloadEntry[] = [];
    for (const tokenDoc of tokens) {
      const item = itemMap[tokenDoc.orderItemId];
      if (!item) continue;
      const productId = item.productId ?? item.productName;
      if (seen.has(productId)) continue;
      seen.add(productId);
      const order = orderMap[item.orderId];
      downloads.push({
        token: tokenDoc.token,
        fileKey: tokenDoc.fileKey ?? '',
        productName: item.productName,
        orderNumber: order?.orderNumber ?? '',
        coverImageUrl: item.coverImageUrl ?? undefined,
        downloadCount: tokenDoc.downloadCount,
        maxDownloads: tokenDoc.maxDownloads,
        expiresAt: tokenDoc.expiresAt,
        expired: new Date(tokenDoc.expiresAt) < new Date(),
        deliveryLink: tokenDoc.deliveryLink ?? undefined,
      });
    }
    allDownloads.value = downloads;
  } catch (e) {
    console.error('[DownloadsView]', e);
  } finally {
    loading.value = false;
  }
});
</script>
