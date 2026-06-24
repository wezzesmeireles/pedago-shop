<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center gap-3 mb-1">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
        <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </div>
      <div>
        <h1 class="text-2xl font-black text-gray-900">Enviar Produto</h1>
        <p class="text-sm text-gray-500">Envie manualmente um produto para o email de um cliente.</p>
      </div>
    </div>

    <section class="card p-5 sm:p-6 space-y-5 mt-6">
      <!-- Step 1: Email -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">1</span>
          <label class="text-sm font-semibold text-slate-700">Email do Cliente</label>
        </div>
        <div class="flex gap-2">
          <input v-model="email" type="email" placeholder="cliente@email.com"
            class="flex-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          <button @click="lookupUser" :disabled="!email || lookingUp"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 disabled:opacity-50 transition-all whitespace-nowrap">
            {{ lookingUp ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>
        <div v-if="foundUser" class="mt-2 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <div class="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0">
            {{ (foundUser.name || foundUser.email || '?')[0].toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-emerald-900 truncate">{{ foundUser.name || 'Sem nome' }}</p>
            <p class="text-xs text-emerald-600 truncate">{{ foundUser.email }}</p>
          </div>
          <svg class="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>
        </div>
        <p v-if="lookupError" class="mt-1.5 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{{ lookupError }}</p>
      </div>

      <!-- Step 2: Product -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">2</span>
          <label class="text-sm font-semibold text-slate-700">Produto</label>
        </div>
        <div class="relative">
          <select v-model="productId"
            class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white appearance-none cursor-pointer">
            <option value="" disabled>Selecione um produto...</option>
            <option v-for="p in products" :key="p.$id" :value="p.$id">
              {{ p.name }}
            </option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M19 9l-7 7-7-7"/></svg>
        </div>
        <p v-if="loadingProducts" class="text-xs text-slate-400 mt-1">Carregando produtos...</p>

        <!-- Product preview card -->
        <div v-if="selectedProduct" class="mt-3 flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div class="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
            <img v-if="selectedProduct.coverImageUrl" :src="selectedProduct.coverImageUrl" :alt="selectedProduct.name" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-800 truncate">{{ selectedProduct.name }}</p>
            <p v-if="selectedProduct.description" class="text-xs text-slate-500 line-clamp-2 mt-0.5">{{ selectedProduct.description }}</p>
            <p v-if="selectedProduct.price > 0" class="text-xs font-semibold text-violet-600 mt-1">
              {{ formatPrice(selectedProduct.price) }}
            </p>
            <p v-else class="text-xs font-semibold text-emerald-600 mt-1">Grátis</p>
          </div>
        </div>
      </div>

      <!-- Step 3: Message -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <span class="flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold">3</span>
          <label class="text-sm font-semibold text-slate-700">Mensagem <span class="text-slate-400 font-normal">(opcional)</span></label>
        </div>
        <textarea v-model="message" rows="3" maxlength="500" placeholder="Ex.: Segue o material exclusivo conforme combinado!"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"></textarea>
        <div class="flex justify-end mt-1">
          <span class="text-[11px]" :class="message.length > 450 ? 'text-amber-500' : 'text-gray-400'">{{ message.length }}/500</span>
        </div>
      </div>

      <!-- Send -->
      <div class="pt-2">
        <button @click="send" :disabled="!canSend || sending"
          class="btn-primary w-full py-3 text-base disabled:opacity-60 flex items-center justify-center gap-2">
          <svg v-if="sending" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {{ sending ? 'Enviando...' : 'Enviar Produto por Email' }}
        </button>

        <div v-if="result"
          :class="['mt-3 text-sm rounded-xl px-4 py-3 font-medium flex items-start gap-2.5', result.ok ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200']">
          <template v-if="result.ok">
            <svg class="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
            <div>
              <p class="font-semibold">Produto enviado!</p>
              <p class="text-emerald-600 mt-0.5">O material <strong>{{ selectedProduct?.name }}</strong> foi enviado para <strong>{{ email }}</strong>.</p>
            </div>
          </template>
          <template v-else>
            <svg class="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            <div>
              <p class="font-semibold">Erro ao enviar</p>
              <p class="text-red-600 mt-0.5">{{ result.error }}</p>
            </div>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { databases } from '@/lib/appwrite';
import { DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';

const email = ref('');
const message = ref('');
const productId = ref('');
const lookingUp = ref(false);
const lookupError = ref('');
const foundUser = ref<any>(null);
const products = ref<any[]>([]);
const loadingProducts = ref(true);
const sending = ref(false);
const result = ref<{ ok: boolean; error?: string } | null>(null);
let sendLock = false;

const selectedProduct = computed(() => products.value.find(p => p.$id === productId.value) || null);

const canSend = computed(() => email.value && productId.value && foundUser.value && !sending.value);

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
}

async function loadProducts() {
  loadingProducts.value = true;
  try {
    const res = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
      Query.isNull('deletedAt'), Query.orderAsc('name'), Query.limit(300)
    ]);
    products.value = res.documents;
  } catch {
    products.value = [];
  } finally {
    loadingProducts.value = false;
  }
}

async function lookupUser() {
  if (!email.value) return;
  lookingUp.value = true;
  lookupError.value = '';
  foundUser.value = null;
  try {
    const res = await fetch('/api/send-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, productId: '__lookup__' }),
    });
    const data = await res.json();
    if (!res.ok) {
      lookupError.value = data.error || 'Usuário não encontrado';
      return;
    }
    foundUser.value = { email: email.value, name: data.name || '' };
  } catch {
    lookupError.value = 'Erro ao buscar usuário';
  } finally {
    lookingUp.value = false;
  }
}

async function send() {
  if (!canSend.value || sendLock) return;
  sendLock = true;
  sending.value = true;
  result.value = null;
  try {
    const res = await fetch('/api/send-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, productId: productId.value, message: message.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar');
    result.value = { ok: true };
  } catch (err: any) {
    result.value = { ok: false, error: err?.message || 'Erro ao enviar. Tente novamente.' };
  } finally {
    sending.value = false;
    sendLock = false;
  }
}

onMounted(loadProducts);
</script>
