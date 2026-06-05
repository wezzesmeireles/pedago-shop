<template>
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-black text-gray-900 mb-1">Suporte / Saúde das Entregas</h1>
    <p class="text-sm text-gray-500 mb-6">Diagnostique e corrija problemas de entrega, e reenvie downloads para clientes.</p>

    <!-- ── Saúde das Entregas ─────────────────────────────────── -->
    <section class="card p-5 sm:p-6 mb-6">
      <div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2">🩺 Saúde das Entregas</h2>
          <p class="text-xs text-gray-500">Verifica os pedidos mais recentes.</p>
        </div>
        <button @click="runHealth" :disabled="loadingHealth"
          class="btn-primary text-sm py-2.5 px-4 disabled:opacity-60">
          {{ loadingHealth ? 'Verificando…' : 'Verificar entregas' }}
        </button>
      </div>

      <div v-if="health" class="space-y-2">
        <p v-if="health.totalIssues === 0" class="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 font-medium">
          ✓ Tudo certo! Nenhum problema nos {{ health.scanned }} pedidos mais recentes.
        </p>
        <template v-else>
          <ul class="text-sm space-y-1.5">
            <li class="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
              <span><b>{{ health.paidWithoutTokens.length }}</b> pedido(s) pago(s) sem arquivo gerado</span>
            </li>
            <li class="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
              <span><b>{{ permsTotal }}</b> registro(s) sem permissão do dono (cliente não consegue ver)</span>
            </li>
            <li class="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
              <span><b>{{ health.approvedButAwaiting.length }}</b> pagamento(s) aprovado(s) mas ainda pendente(s)</span>
            </li>
            <li class="flex items-center justify-between bg-gray-50 rounded-xl px-3.5 py-2.5">
              <span><b>{{ health.usersWithoutProfile.length }}</b> usuário(s) sem perfil (não aparecem no admin)</span>
            </li>
          </ul>
          <div class="pt-2">
            <button @click="runFix" :disabled="fixing"
              class="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 px-5 rounded-xl disabled:opacity-60">
              {{ fixing ? 'Corrigindo…' : `Corrigir tudo (${health.totalIssues})` }}
            </button>
          </div>
        </template>
      </div>
      <p v-if="fixResult" class="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 mt-3">{{ fixResult }}</p>
      <p v-if="healthError" class="text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-3">{{ healthError }}</p>
    </section>

    <!-- ── Buscar downloads por e-mail ────────────────────────── -->
    <section class="card p-5 sm:p-6">
      <h2 class="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">🔎 Downloads de um cliente</h2>
      <p class="text-xs text-gray-500 mb-4">Busque pelo e-mail para conferir, baixar e reenviar os arquivos.</p>

      <form @submit.prevent="searchCustomer" class="flex gap-2 mb-4">
        <input v-model="email" type="email" required placeholder="email@cliente.com"
          class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        <button type="submit" :disabled="searching" class="btn-primary text-sm py-2.5 px-4 disabled:opacity-60">
          {{ searching ? '…' : 'Buscar' }}
        </button>
      </form>

      <div v-if="searched">
        <p v-if="!customer" class="text-sm text-gray-500">Nenhum cliente com esse e-mail.</p>
        <template v-else>
          <p class="text-sm font-semibold text-gray-800 mb-2">{{ customer.name }} <span class="text-gray-400 font-normal">· {{ customer.email }}</span></p>
          <p v-if="!downloads.length" class="text-sm text-gray-500">Nenhum download pago encontrado.</p>
          <div v-else class="space-y-2">
            <div v-for="(d, i) in downloads" :key="i" class="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3.5 py-2.5">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ d.productName }}</p>
                <p class="text-xs text-gray-400">Pedido {{ d.orderNumber }}</p>
              </div>
              <div class="flex-shrink-0 flex gap-2">
                <a v-if="d.deliveryLink" :href="d.deliveryLink" target="_blank" rel="noopener"
                  class="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg font-medium">Abrir link</a>
                <button v-else-if="d.fileId" @click="download(d)"
                  class="text-xs bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-lg font-medium">Baixar PDF</button>
                <span v-else class="text-xs text-amber-600">sem arquivo</span>
              </div>
            </div>
          </div>
        </template>
      </div>
      <p v-if="searchError" class="text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-3">{{ searchError }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { invokeFunction } from '@/services/api';
import { appwriteEndpoint } from '@/lib/appwrite';

const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string;

// ── Health ──
const loadingHealth = ref(false);
const health = ref<any>(null);
const healthError = ref('');
const fixing = ref(false);
const fixResult = ref('');
const permsTotal = computed(() => {
  const m = health.value?.missingOwnerPerms;
  return m ? (m.orders + m.items + m.tokens) : 0;
});

async function runHealth() {
  loadingHealth.value = true; healthError.value = ''; fixResult.value = '';
  try {
    health.value = await invokeFunction('admin-ops', { action: 'health' });
  } catch (e: any) {
    healthError.value = e?.message ?? 'Erro ao verificar.';
  } finally {
    loadingHealth.value = false;
  }
}

async function runFix() {
  fixing.value = true; fixResult.value = ''; healthError.value = '';
  try {
    const r = await invokeFunction<any>('admin-ops', { action: 'fix', which: 'all' });
    fixResult.value = `Corrigido: ${r.tokensCreated} arquivo(s), ${r.permsFixed} permissão(ões), ${r.profilesCreated} perfil(is), ${r.reconciled} pagamento(s).`;
    await runHealth();
  } catch (e: any) {
    healthError.value = e?.message ?? 'Erro ao corrigir.';
  } finally {
    fixing.value = false;
  }
}

// ── Customer search ──
const email = ref('');
const searching = ref(false);
const searched = ref(false);
const customer = ref<any>(null);
const downloads = ref<any[]>([]);
const searchError = ref('');

async function searchCustomer() {
  searching.value = true; searchError.value = ''; searched.value = false;
  try {
    const r = await invokeFunction<any>('admin-ops', { action: 'customer-downloads', email: email.value });
    customer.value = r.user;
    downloads.value = r.downloads ?? [];
    searched.value = true;
  } catch (e: any) {
    searchError.value = e?.message ?? 'Erro na busca.';
  } finally {
    searching.value = false;
  }
}

async function download(d: any) {
  let secret = '';
  try { const fb = JSON.parse(localStorage.getItem('cookieFallback') || '{}'); secret = fb[`a_session_${projectId}`] || ''; } catch {}
  const url = `${appwriteEndpoint}/storage/buckets/product-files/files/${d.fileId}/download?project=${encodeURIComponent(projectId)}`;
  try {
    const r = await fetch(url, { credentials: 'include', headers: { 'X-Appwrite-Project': projectId, ...(secret ? { 'X-Appwrite-Session': secret } : {}) } });
    if (!r.ok) throw new Error(`Storage ${r.status}`);
    const blob = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${(d.productName || 'arquivo').replace(/[^\w\sÀ-ÿ.-]/g, '').trim() || 'arquivo'}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch (e: any) {
    alert('Erro ao baixar: ' + (e?.message ?? e));
  }
}
</script>
