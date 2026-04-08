<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-slate-900">Usuários</h1>
      <p class="text-sm text-slate-500 mt-0.5">Gerencie os clientes cadastrados</p>
    </div>

    <!-- Toolbar -->
    <div class="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4">
      <div class="relative max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input v-model="search" @input="debouncedLoad" placeholder="Buscar por nome ou email..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuário</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Compras</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Função</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Cadastro</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="user in users" :key="user.id" class="group hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0">
                    <img v-if="user.avatarUrl" :src="user.avatarUrl" class="w-9 h-9 rounded-full object-cover ring-2 ring-white" />
                    <div v-else class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                      {{ user.name?.[0]?.toUpperCase() }}
                    </div>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-slate-900 truncate max-w-[160px]">{{ user.name }}</p>
                    <p class="text-xs text-slate-400 truncate max-w-[160px]">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <div class="flex items-center gap-1.5">
                  <div class="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  </div>
                  <span class="text-sm font-semibold text-slate-700">{{ user._count?.orders ?? 0 }}</span>
                </div>
              </td>
              <td class="px-4 py-3.5 hidden md:table-cell">
                <span :class="['inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold', user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600']">
                  {{ user.role === 'ADMIN' ? 'Admin' : 'Cliente' }}
                </span>
              </td>
              <td class="px-4 py-3.5">
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-500']">
                  <span :class="['w-1.5 h-1.5 rounded-full', user.isActive ? 'bg-emerald-500' : 'bg-red-400']"></span>
                  {{ user.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="px-4 py-3.5 hidden lg:table-cell">
                <span class="text-xs text-slate-400">{{ formatDate(user.createdAt) }}</span>
              </td>
              <td class="px-4 py-3.5">
                <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openOrders(user)" class="px-3 py-1.5 text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors">
                    Pedidos
                  </button>
                  <button @click="toggleActive(user)"
                    :class="['p-1.5 rounded-lg transition-colors', user.isActive ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50']"
                    :title="user.isActive ? 'Desativar' : 'Ativar'">
                    <svg v-if="user.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="users.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-slate-400 text-sm">Nenhum usuário encontrado</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-slate-100">
        <span class="text-xs text-slate-500">Página {{ currentPage }} de {{ totalPages }}</span>
        <div class="flex gap-1">
          <button @click="loadUsers(currentPage - 1)" :disabled="currentPage === 1" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 text-sm">‹</button>
          <button v-for="p in pageRange" :key="p" @click="loadUsers(p)"
            :class="['w-8 h-8 rounded-lg text-sm font-medium', p === currentPage ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100']">
            {{ p }}
          </button>
          <button @click="loadUsers(currentPage + 1)" :disabled="currentPage === totalPages" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40 text-sm">›</button>
        </div>
      </div>
    </div>

    <!-- User Orders Modal -->
    <AppModal v-model="ordersOpen" :title="`Pedidos — ${selectedUser?.name ?? ''}`">
      <div v-if="loadingOrders" class="py-12 flex items-center justify-center">
        <div class="animate-spin w-7 h-7 border-2 border-violet-600 border-t-transparent rounded-full"></div>
      </div>
      <div v-else-if="userOrders.length === 0" class="py-12 text-center">
        <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        </div>
        <p class="text-sm text-slate-500">Nenhum pedido encontrado</p>
      </div>
      <div v-else class="space-y-2">
        <div v-for="order in userOrders" :key="order.id" class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-mono font-bold text-slate-700">{{ order.orderNumber }}</span>
              <StatusBadge :status="order.status" />
            </div>
            <p class="text-xs text-slate-500 truncate">{{ order.items?.map((i: any) => i.productName).join(', ') }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ formatDate(order.createdAt) }}</p>
          </div>
          <span class="text-sm font-bold text-violet-600 flex-shrink-0">{{ formatPrice(order.totalAmount) }}</span>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { invokeFunction } from '@/services/api';
import AppModal from '@/components/ui/AppModal.vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const users = ref([]);
const search = ref('');
const currentPage = ref(1);
const totalPages = ref(1);

const ordersOpen = ref(false);
const loadingOrders = ref(false);
const selectedUser = ref<any>(null);
const userOrders = ref([]);

const pageRange = computed(() => {
  const range = [];
  const start = Math.max(1, currentPage.value - 2);
  const end = Math.min(totalPages.value, start + 4);
  for (let i = start; i <= end; i++) range.push(i);
  return range;
});

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatPrice(p: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(p));
}

let timeout: ReturnType<typeof setTimeout>;
function debouncedLoad() {
  clearTimeout(timeout);
  timeout = setTimeout(() => loadUsers(1), 400);
}

async function loadUsers(page = 1) {
  // Use Edge Function to get emails from auth.users
  const res = await invokeFunction('admin-users', null).catch(() => null);
  // invokeFunction uses POST, but we need GET with params — call via fetch
  const { data: { session } } = await supabase.auth.getSession();
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search.value) params.set('search', search.value);
  const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?${params}`, {
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  const data = await resp.json();
  users.value = data.items ?? [];
  totalPages.value = Math.ceil((data.total ?? 0) / 20);
  currentPage.value = page;
}

async function toggleActive(user: any) {
  await supabase.from('profiles').update({ is_active: !user.is_active, updated_at: new Date().toISOString() }).eq('id', user.id);
  await loadUsers(currentPage.value);
}

async function openOrders(user: any) {
  selectedUser.value = user;
  ordersOpen.value = true;
  loadingOrders.value = true;
  userOrders.value = [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?userId=${user.id}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await resp.json();
    userOrders.value = data.orders ?? [];
  } finally {
    loadingOrders.value = false;
  }
}

onMounted(() => loadUsers());
</script>
