<template>
  <div class="min-h-screen flex bg-slate-50">

    <!-- ── Sidebar Desktop ─────────────────────────────────────── -->
    <aside class="w-64 bg-slate-900 flex-col hidden md:flex fixed inset-y-0 left-0 z-30">
      <!-- Logo -->
      <div class="px-4 pt-7 pb-6 border-b border-slate-800/60 flex flex-col items-center">
        <RouterLink to="/" class="flex flex-col items-center gap-3 group w-full">
          <!-- Logo image or icon -->
          <div v-if="config.logoUrl" class="w-full flex items-center justify-center group-hover:scale-105 transition-transform">
            <img :src="config.logoUrl" :alt="config.storeName" class="max-h-20 max-w-full object-contain drop-shadow-lg" />
          </div>
          <div v-else class="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-400 via-violet-600 to-purple-800 flex items-center justify-center shadow-2xl shadow-violet-900/60 ring-2 ring-violet-400/30 group-hover:scale-105 transition-transform">
            <svg class="w-11 h-11 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <!-- Store name -->
          <div class="text-center w-full">
            <p class="font-extrabold text-white text-lg leading-tight tracking-tight">{{ config.storeName }}</p>
            <span class="inline-block mt-1 text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase bg-violet-950/60 px-2.5 py-0.5 rounded-full">Admin</span>
          </div>
        </RouterLink>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p class="px-3 pt-1 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Principal</p>
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
            isActive(item.to)
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          ]"
        >
          <span v-html="item.icon" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300']"></span>
          {{ item.label }}
          <span v-if="item.badge" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{{ item.badge }}</span>
        </RouterLink>

        <p class="px-3 pt-4 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Configurações</p>
        <RouterLink
          v-for="item in settingsNav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
            isActive(item.to)
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          ]"
        >
          <span v-html="item.icon" :class="['w-4 h-4 flex-shrink-0', isActive(item.to) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300']"></span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="px-3 py-4 border-t border-slate-800">
        <div class="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-default">
          <div class="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {{ auth.user?.name?.[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-white text-sm font-medium truncate">{{ auth.user?.name }}</p>
            <p class="text-slate-500 text-xs">Administrador</p>
          </div>
        </div>
        <div class="flex gap-1 mt-2">
          <RouterLink to="/" class="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-white py-1.5 px-2 rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            Ver loja
          </RouterLink>
          <button @click="handleLogout" class="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-red-400 py-1.5 px-2 rounded-lg hover:bg-slate-800 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sair
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Mobile overlay ──────────────────────────────────────── -->
    <Transition name="fade">
      <div v-if="mobileMenuOpen" class="fixed inset-0 z-40 md:hidden" @click="mobileMenuOpen = false">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      </div>
    </Transition>

    <!-- ── Mobile Drawer ──────────────────────────────────────── -->
    <Transition name="slide">
      <aside v-if="mobileMenuOpen" class="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col md:hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <RouterLink to="/" class="flex items-center gap-3" @click="mobileMenuOpen = false">
            <div v-if="config.logoUrl" class="h-10 flex items-center">
              <img :src="config.logoUrl" :alt="config.storeName" class="max-h-10 max-w-[120px] object-contain" />
            </div>
            <div v-else class="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-400 via-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-900/40 ring-1 ring-violet-400/20">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <p class="font-extrabold text-white text-base leading-tight">{{ config.storeName }}</p>
              <span class="text-[10px] font-bold text-violet-400 tracking-widest uppercase">Admin</span>
            </div>
          </RouterLink>
          <button @click="mobileMenuOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <RouterLink v-for="item in [...mainNav, ...settingsNav]" :key="item.to" :to="item.to"
            @click="mobileMenuOpen = false"
            :class="['flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all', isActive(item.to) ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800']">
            <span v-html="item.icon" class="w-4 h-4 flex-shrink-0"></span>
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="px-3 py-4 border-t border-slate-800">
          <button @click="handleLogout" class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-slate-800 rounded-xl transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Sair da conta
          </button>
        </div>
      </aside>
    </Transition>

    <!-- ── Main ───────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col md:ml-64">
      <!-- Topbar -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span class="hidden md:inline">Admin</span>
          <span class="hidden md:inline text-slate-300">/</span>
          <span class="text-slate-900 font-semibold">{{ currentPageLabel }}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 text-sm font-bold">
            {{ auth.user?.name?.[0]?.toUpperCase() }}
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6 pb-20 md:pb-6">
        <RouterView />
      </main>
    </div>

    <!-- ── Mobile Bottom Nav ─────────────────────────────────── -->
    <nav class="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-slate-100 flex safe-area-inset-bottom shadow-[0_-1px_12px_rgba(0,0,0,0.06)]">
      <RouterLink v-for="item in bottomNav" :key="item.to" :to="item.to"
        :class="['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[52px] transition-colors',
          isActive(item.to) ? 'text-violet-600' : 'text-slate-400']">
        <span v-html="item.icon" :class="['[&>svg]:w-5 [&>svg]:h-5', isActive(item.to) ? 'text-violet-600' : 'text-slate-400']"></span>
        <span class="text-[10px] font-medium leading-none">{{ item.label }}</span>
      </RouterLink>
      <button @click="mobileMenuOpen = !mobileMenuOpen"
        :class="['flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[52px] transition-colors',
          mobileMenuOpen ? 'text-violet-600' : 'text-slate-400']">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
        <span class="text-[10px] font-medium leading-none">Mais</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useSiteConfigStore } from '@/stores/site-config.store';

const auth = useAuthStore();
const { config } = useSiteConfigStore();
const router = useRouter();
const route = useRoute();
const mobileMenuOpen = ref(false);

const icon = {
  grid: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
  box: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  tag: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>',
  clipboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
  users: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  palette: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
  cog: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
};

interface NavItem { to: string; label: string; icon: string; badge?: string }

const mainNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: icon.grid },
  { to: '/admin/produtos', label: 'Produtos', icon: icon.box },
  { to: '/admin/categorias', label: 'Categorias', icon: icon.tag },
  { to: '/admin/pedidos', label: 'Pedidos', icon: icon.clipboard },
  { to: '/admin/usuarios', label: 'Usuários', icon: icon.users },
];

const settingsNav: NavItem[] = [
  { to: '/admin/customizar', label: 'Customizar Site', icon: icon.palette },
  { to: '/admin/integracoes', label: 'Integrações', icon: icon.cog },
];

const allNav = [...mainNav, ...settingsNav];

// Bottom nav: 4 most-used pages + "Mais" drawer trigger
const bottomNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Início', icon: icon.grid },
  { to: '/admin/produtos', label: 'Produtos', icon: icon.box },
  { to: '/admin/pedidos', label: 'Pedidos', icon: icon.clipboard },
  { to: '/admin/usuarios', label: 'Usuários', icon: icon.users },
];

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/');
}

const currentPageLabel = computed(() => allNav.find(n => isActive(n.to))?.label ?? '');

async function handleLogout() {
  await auth.logout();
  router.push('/');
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(-100%); }
</style>
