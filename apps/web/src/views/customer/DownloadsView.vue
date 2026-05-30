<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Meus Downloads</h1>
      <span v-if="!loading && allDownloads.length" class="text-sm text-gray-500">{{ allDownloads.length }} {{ allDownloads.length === 1 ? 'arquivo' : 'arquivos' }}</span>
    </div>

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
                <!-- PDF delivery -->
                <a v-else href="#" @click.prevent="downloadFile(download)"
                  class="inline-flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors whitespace-nowrap">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  <span>Baixar</span>
                </a>
              </div>
            </div>

            <!-- Download count + expiry -->
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              <p class="text-xs text-gray-400">{{ download.downloadCount }} {{ download.downloadCount === 1 ? 'download realizado' : 'downloads realizados' }}</p>
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
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { account } from '@/lib/appwrite';
import { Query } from 'appwrite';

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
const allDownloads = ref<DownloadEntry[]>([]);

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;

function isExpiringSoon(d: DownloadEntry): boolean {
  if (d.expired) return false;
  return new Date(d.expiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
}

function formatExpiry(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function downloadFile(d: DownloadEntry) {
  if (d.expired) return;
  const url = `${endpoint}/functions/download/executions?token=${d.token}&project=${projectId}`;
  window.open(url, '_blank');
  d.downloadCount++;
}

onMounted(async () => {
  try {
    const currentUser = await account.get();

    // Fetch PAID orders for current user
    const ordersResult = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
      Query.equal('userId', currentUser.$id),
      Query.equal('status', 'PAID'),
      Query.orderDesc('$createdAt'),
    ]);

    // Deduplicate by productId: same product bought in multiple orders → keep most recent token
    const seen = new Set<string>();
    const downloads: DownloadEntry[] = [];

    for (const orderDoc of ordersResult.documents) {
      // Fetch items for this order
      const itemsResult = await databases.listDocuments(DB_ID, COLLECTIONS.ORDER_ITEMS, [
        Query.equal('orderId', orderDoc.$id),
      ]);

      for (const item of itemsResult.documents) {
        const productId = item.productId ?? item.productName;
        if (seen.has(productId)) continue;

        // Fetch non-revoked download tokens for this item
        const tokensResult = await databases.listDocuments(DB_ID, COLLECTIONS.DOWNLOAD_TOKENS, [
          Query.equal('orderItemId', item.$id),
          Query.isNull('revokedAt'),
        ]);

        const tokenDoc = tokensResult.documents[0];
        if (!tokenDoc) continue;

        seen.add(productId);
        downloads.push({
          token: tokenDoc.token,
          fileKey: tokenDoc.fileKey ?? '',
          productName: item.productName,
          orderNumber: orderDoc.orderNumber,
          coverImageUrl: item.coverImageUrl ?? undefined,
          downloadCount: tokenDoc.downloadCount,
          maxDownloads: tokenDoc.maxDownloads,
          expiresAt: tokenDoc.expiresAt,
          expired: new Date(tokenDoc.expiresAt) < new Date(),
          deliveryLink: tokenDoc.deliveryLink ?? undefined,
        });
      }
    }
    allDownloads.value = downloads;
  } finally {
    loading.value = false;
  }
});
</script>
