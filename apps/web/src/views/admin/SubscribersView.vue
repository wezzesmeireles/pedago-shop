<template>
  <div class="max-w-4xl">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Inscritos (Newsletter)</h1>
        <p class="text-sm text-slate-500 mt-0.5">Emails capturados no site</p>
      </div>
      <button v-if="subscribers.length" @click="exportCsv"
        class="btn-pill text-sm px-5 py-2.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Exportar CSV
      </button>
    </div>

    <!-- Stats + search -->
    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <div class="bg-white rounded-2xl border border-violet-100 px-4 py-2.5 shadow-sm">
        <span class="font-display text-2xl font-bold text-violet-600"><CountUp :value="total" /></span>
        <span class="text-xs text-slate-400 font-medium ml-1.5">inscritos</span>
      </div>
      <div class="relative flex-1 min-w-[200px]">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input v-model="search" placeholder="Buscar email..." class="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="bg-white rounded-2xl border border-slate-200 p-10 text-center">
      <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
        <svg class="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
      </div>
      <p class="text-sm text-slate-400">{{ search ? 'Nenhum email encontrado' : 'Nenhum inscrito ainda' }}</p>
    </div>

    <!-- List -->
    <div v-else class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div v-for="(sub, i) in filtered" :key="sub.$id"
        :class="['flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5', i % 2 ? 'bg-slate-50/40' : '']">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm flex-shrink-0">
            {{ sub.email[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-slate-800 truncate">{{ sub.email }}</p>
            <p class="text-xs text-slate-400">{{ sub.source || 'site' }} · {{ formatDate(sub.createdAt || sub.$createdAt) }}</p>
          </div>
        </div>
        <button @click="remove(sub)" class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0" title="Remover">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import CountUp from '@/components/ui/CountUp.vue';

const subscribers = ref<any[]>([]);
const total = ref(0);
const loading = ref(true);
const search = ref('');

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return subscribers.value;
  return subscribers.value.filter(s => s.email?.toLowerCase().includes(q));
});

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function load() {
  loading.value = true;
  try {
    const all: any[] = [];
    let offset = 0;
    while (true) {
      const r = await databases.listDocuments(DB_ID, COLLECTIONS.NEWSLETTER, [
        Query.orderDesc('$createdAt'), Query.limit(100), Query.offset(offset),
      ]);
      all.push(...r.documents);
      total.value = r.total;
      if (r.documents.length < 100) break;
      offset += 100;
    }
    subscribers.value = all;
  } catch (e) {
    console.error('[subscribers]', e);
  } finally {
    loading.value = false;
  }
}

async function remove(sub: any) {
  if (!confirm(`Remover ${sub.email} da lista?`)) return;
  try {
    await databases.deleteDocument(DB_ID, COLLECTIONS.NEWSLETTER, sub.$id);
    subscribers.value = subscribers.value.filter(s => s.$id !== sub.$id);
    total.value--;
  } catch (e) { console.error(e); }
}

function exportCsv() {
  const rows = [['email', 'origem', 'data'], ...subscribers.value.map(s => [
    s.email, s.source || 'site', formatDate(s.createdAt || s.$createdAt),
  ])];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inscritos-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

onMounted(load);
</script>
