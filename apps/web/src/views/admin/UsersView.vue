<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-slate-900">Usuários</h1>
        <p class="text-sm text-slate-500 mt-0.5">Gerencie os clientes cadastrados</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4">
      <div class="relative max-w-sm">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input v-model="search" @input="debouncedLoad" placeholder="Buscar por nome ou email..." class="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors" />
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuário</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">WhatsApp</th>
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
              <!-- WhatsApp -->
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <a
                  v-if="user.phone"
                  :href="`https://wa.me/${whatsappNumber(user.phone)}`"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-semibold transition-colors"
                  :title="`Chamar ${user.phone} no WhatsApp`"
                >
                  <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  {{ user.phone }}
                </a>
                <span v-else class="text-xs text-slate-300">—</span>
              </td>
              <!-- Compras -->
              <td class="px-4 py-3.5 hidden sm:table-cell">
                <div class="flex items-center gap-1.5">
                  <div class="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                    <svg class="w-3.5 h-3.5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                  </div>
                  <span class="text-sm font-semibold text-slate-700">{{ user.ordersCount ?? 0 }}</span>
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
              <td colspan="7" class="px-5 py-16 text-center">
                <div class="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg class="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                </div>
                <p class="text-sm font-medium text-slate-600 mb-1">Nenhum usuário encontrado</p>
                <p class="text-xs text-slate-400">{{ search ? 'Tente outros termos de busca' : 'Os usuários cadastrados aparecerão aqui' }}</p>
              </td>
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

// Remove formatação e garante prefixo 55 para WhatsApp
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

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
  const [{ data, error }, { data: phones }] = await Promise.all([
    supabase.rpc('get_all_users_for_admin'),
    supabase.from('profiles').select('id, phone'),
  ]);
  if (error) { console.error('loadUsers error:', error); return; }

  const phoneMap = new Map((phones ?? []).map((p: any) => [p.id, p.phone]));
  let filtered = (data ?? []).map((u: any) => ({ ...u, phone: phoneMap.get(u.id) ?? null }));
  if (search.value) {
    const q = search.value.toLowerCase();
    filtered = filtered.filter((u: any) =>
      u.email?.toLowerCase().includes(q) || u.name?.toLowerCase().includes(q),
    );
  }

  const limit = 20;
  const from = (page - 1) * limit;
  totalPages.value = Math.ceil(filtered.length / limit);
  currentPage.value = page;

  users.value = filtered.slice(from, from + limit).map((u: any) => ({
    ...u,
    avatarUrl: u.avatar_url,
    isActive: u.is_active,
    createdAt: u.created_at,
    ordersCount: Number(u.orders_count ?? 0),
    phone: u.phone ?? null,
  }));
}

async function toggleActive(user: any) {
  await supabase.from('profiles').update({ is_active: !user.isActive, updated_at: new Date().toISOString() }).eq('id', user.id);
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
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    });
    const data = await resp.json();
    userOrders.value = (data.orders ?? []).map((o: any) => ({
      ...o,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      totalAmount: o.total_amount,
      items: (o.order_items ?? []).map((i: any) => ({ productName: i.product_name })),
    }));
  } finally {
    loadingOrders.value = false;
  }
}

onMounted(() => loadUsers());
</script>
