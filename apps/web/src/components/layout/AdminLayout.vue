<template>
  <div class="admin-shell min-h-screen flex">

    <!-- ── Sidebar Desktop ─────────────────────────────────────── -->
    <aside :class="['admin-sidebar flex-col hidden md:flex fixed inset-y-0 left-0 z-30 transition-all duration-300', sidebarCollapsed ? 'w-20' : 'w-64']">
      <!-- Logo -->
      <div class="px-4 pt-7 pb-6 border-b border-slate-800/60 flex flex-col items-center relative">
        <button @click="sidebarCollapsed = !sidebarCollapsed" class="absolute -right-3.5 top-8 bg-slate-800 text-slate-300 rounded-full p-1 hover:text-white ring-4 ring-slate-900 z-50 transition-transform shadow-lg cursor-pointer hover:bg-slate-700">
          <svg v-if="sidebarCollapsed" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <RouterLink to="/" class="flex flex-col items-center gap-3 group w-full">
          <div v-if="!sidebarCollapsed" class="admin-logo-card w-full flex items-center justify-center group-hover:scale-[1.02] transition-transform">
            <img src="/site-pedagogico-logo.png" alt="Site Pedagógico" class="w-full object-contain" />
          </div>
          <div v-else class="admin-monogram w-11 h-11 rounded-2xl flex items-center justify-center text-white font-display font-bold text-sm shadow-lg">
            SP
          </div>
          <!-- Store name -->
          <div class="text-center w-full overflow-hidden transition-all duration-300" :class="sidebarCollapsed ? 'opacity-0 h-0 hidden' : 'opacity-100 h-auto'">
            <p class="font-extrabold text-white text-lg leading-tight tracking-tight whitespace-nowrap">{{ config.storeName }}</p>
            <span class="inline-block mt-1 text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase bg-violet-950/60 px-2.5 py-0.5 rounded-full">Admin</span>
          </div>
        </RouterLink>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
        <p class="pt-1 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest transition-all duration-300 overflow-hidden whitespace-nowrap text-center" :class="sidebarCollapsed ? 'opacity-0 h-0 mb-0 hidden' : 'opacity-100 h-auto px-3'">Principal</p>
        <RouterLink
          v-for="item in mainNav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center rounded-xl text-sm font-medium transition-all group relative',
            sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'gap-3 px-3 py-2.5',
            isActive(item.to)
              ? 'admin-nav-active text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          ]"
        >
          <span v-html="item.icon" :class="['w-4 h-4 flex-shrink-0 transition-transform', isActive(item.to) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300', sidebarCollapsed ? 'group-hover:scale-110' : '']"></span>
          <span class="whitespace-nowrap transition-all duration-300 overflow-hidden" :class="sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'">{{ item.label }}</span>
          <span v-if="item.badge && !sidebarCollapsed" class="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{{ item.badge }}</span>
          <span v-if="item.badge && sidebarCollapsed" class="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
          
          <!-- Custom Tooltip -->
          <div v-if="sidebarCollapsed" class="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-slate-700/50 flex items-center">
            <div class="absolute -left-1 top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800"></div>
            {{ item.label }}
          </div>
        </RouterLink>

        <p class="pt-4 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest transition-all duration-300 overflow-hidden whitespace-nowrap text-center" :class="sidebarCollapsed ? 'opacity-0 h-0 mb-0 hidden' : 'opacity-100 h-auto px-3'">Configurações</p>
        <RouterLink
          v-for="item in settingsNav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center rounded-xl text-sm font-medium transition-all group relative',
            sidebarCollapsed ? 'justify-center w-10 h-10 mx-auto p-0' : 'gap-3 px-3 py-2.5',
            isActive(item.to)
              ? 'admin-nav-active text-white shadow-lg'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          ]"
        >
          <span v-html="item.icon" :class="['w-4 h-4 flex-shrink-0 transition-transform', isActive(item.to) ? 'text-white' : 'text-slate-500 group-hover:text-slate-300', sidebarCollapsed ? 'group-hover:scale-110' : '']"></span>
          <span class="whitespace-nowrap transition-all duration-300 overflow-hidden" :class="sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'">{{ item.label }}</span>
          
          <!-- Custom Tooltip -->
          <div v-if="sidebarCollapsed" class="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-slate-700/50 flex items-center">
            <div class="absolute -left-1 top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800"></div>
            {{ item.label }}
          </div>
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="py-4 border-t border-slate-800 transition-all duration-300" :class="sidebarCollapsed ? 'px-2' : 'px-3'">
        <div class="flex items-center rounded-xl hover:bg-slate-800 transition-colors cursor-default" :class="sidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-2 py-2'">
          <div class="bg-violet-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 transition-all duration-300" :class="sidebarCollapsed ? 'w-10 h-10 text-base' : 'w-8 h-8'">
            {{ auth.user?.name?.[0]?.toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1 overflow-hidden transition-all duration-300" :class="sidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'">
            <p class="text-white text-sm font-medium truncate">{{ auth.user?.name }}</p>
            <p class="text-slate-500 text-xs">Administrador</p>
          </div>
        </div>
        <div class="flex mt-2 transition-all duration-300" :class="sidebarCollapsed ? 'flex-col items-center gap-2' : 'gap-1'">
          <RouterLink to="/" class="group relative flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors w-full" :class="sidebarCollapsed ? 'p-2.5 w-auto rounded-xl' : 'py-1.5 px-2'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <span v-if="!sidebarCollapsed">Ver loja</span>
            <div v-if="sidebarCollapsed" class="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-slate-700/50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800"></div>
              Ver loja
            </div>
          </RouterLink>
          <button @click="handleLogout" class="group relative flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors w-full" :class="sidebarCollapsed ? 'p-2.5 w-auto rounded-xl' : 'py-1.5 px-2'">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span v-if="!sidebarCollapsed">Sair</span>
            <div v-if="sidebarCollapsed" class="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg opacity-0 -translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 z-50 whitespace-nowrap shadow-xl border border-slate-700/50 flex items-center">
              <div class="absolute -left-1 top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-800"></div>
              Sair
            </div>
          </button>
        </div>
      </div>
    </aside>

    <!-- ── Mobile overlay ──────────────────────────────────────── -->
    <div v-show="mobileMenuOpen"
      class="fixed inset-0 z-40 md:hidden bg-black/60 transition-opacity duration-200"
      :class="mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @click="mobileMenuOpen = false">
    </div>

    <!-- ── Mobile Drawer ──────────────────────────────────────── -->
    <aside class="admin-sidebar admin-sidebar-mobile fixed inset-y-0 left-0 z-50 w-[min(86vw,320px)] flex flex-col md:hidden transition-transform duration-200 ease-out"
      :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'">
        <div class="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
          <RouterLink to="/" class="admin-logo-card flex items-center gap-3 p-2" @click="mobileMenuOpen = false">
            <img src="/site-pedagogico-logo.png" alt="Site Pedagógico" class="h-10 w-auto max-w-[190px] object-contain" />
          </RouterLink>
          <button @click="mobileMenuOpen = false" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <RouterLink v-for="item in [...mainNav, ...settingsNav]" :key="item.to" :to="item.to"
            @click="mobileMenuOpen = false"
            :class="['flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all', isActive(item.to) ? 'admin-nav-active text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800']">
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

    <!-- ── Main ───────────────────────────────────────────────── -->
    <div :class="['admin-workspace flex-1 flex flex-col transition-all duration-300 min-w-0', sidebarCollapsed ? 'md:ml-20' : 'md:ml-64']">
      <!-- Topbar -->
      <header class="admin-topbar h-[68px] flex items-center justify-between px-4 md:px-6 sticky top-0 z-20">
        <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <span class="hidden md:inline">Admin</span>
          <span class="hidden md:inline text-slate-300">/</span>
          <span class="text-slate-900 font-semibold">{{ currentPageLabel }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sistema online
          </span>
          <div class="admin-avatar w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold">
            {{ auth.user?.name?.[0]?.toUpperCase() }}
          </div>
        </div>
      </header>

      <main class="admin-content flex-1 p-3 sm:p-4 md:p-6 pb-24 md:pb-8">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <!-- Cache each admin view after its first load: revisiting a tab is
                 instant (no remount/refetch). Views can refresh quietly via
                 onActivated when fresh data matters. -->
            <KeepAlive>
              <component :is="Component" :key="$route.path" />
            </KeepAlive>
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- ── Mobile Bottom Nav ─────────────────────────────────── -->
    <nav class="admin-bottom-nav fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white/95 backdrop-blur-xl border-t flex safe-area-inset-bottom">
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
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { useSiteConfigStore } from '@/stores/site-config.store';

const auth = useAuthStore();
const { config } = useSiteConfigStore();
const router = useRouter();
const route = useRoute();
const mobileMenuOpen = ref(false);
const sidebarCollapsed = ref(false);
watch(() => route.path, () => { mobileMenuOpen.value = false; });

const icon = {
  grid: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>',
  box: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  tag: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>',
  clipboard: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
  users: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
  palette: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
  cog: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  changelog: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>',
  mail: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
  lifebuoy: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-6 0a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  bell: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>',
};

interface NavItem { to: string; label: string; icon: string; badge?: string }

const mainNav: NavItem[] = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: icon.grid },
  { to: '/admin/produtos', label: 'Produtos', icon: icon.box },
  { to: '/admin/categorias', label: 'Categorias', icon: icon.tag },
  { to: '/admin/pedidos', label: 'Pedidos', icon: icon.clipboard },
  { to: '/admin/usuarios', label: 'Usuários', icon: icon.users },
  { to: '/admin/inscritos', label: 'Inscritos', icon: icon.mail },
  { to: '/admin/notificacoes', label: 'Notificações', icon: icon.bell },
  { to: '/admin/enviar-produto', label: 'Enviar Produto', icon: icon.mail },
];

const settingsNav: NavItem[] = [
  { to: '/admin/suporte', label: 'Suporte', icon: icon.lifebuoy },
  { to: '/admin/customizar', label: 'Customizar Site', icon: icon.palette },
  { to: '/admin/integracoes', label: 'Integrações', icon: icon.cog },
  { to: '/admin/changelog', label: 'Changelog', icon: icon.changelog },
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
.admin-shell {
  --admin-cyan: #00aebd;
  --admin-pink: #ef5d9d;
  --admin-lime: #9bd400;
  --admin-purple: #7d4aa8;
  background: #f7f8fc;
}

.admin-sidebar {
  background:
    radial-gradient(circle at 15% 5%, rgba(0, 174, 189, 0.14), transparent 16rem),
    radial-gradient(circle at 85% 95%, rgba(239, 93, 157, 0.12), transparent 18rem),
    linear-gradient(180deg, #20152f, #171120 72%, #15101d);
  box-shadow: 12px 0 35px -28px rgba(39, 21, 55, 0.8);
}

.admin-logo-card {
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 16px;
  background: white;
  box-shadow: 0 12px 28px -18px rgba(0,0,0,0.7);
}
.admin-logo-card img { max-height: 58px; }

.admin-monogram,
.admin-avatar {
  background: linear-gradient(135deg, var(--admin-cyan), var(--admin-purple) 52%, var(--admin-pink));
  box-shadow: 0 9px 20px -10px rgba(125, 74, 168, 0.8);
}

.admin-nav-active {
  background: linear-gradient(135deg, rgba(0,174,189,0.9), rgba(125,74,168,0.96) 54%, rgba(239,93,157,0.9));
  box-shadow: 0 10px 22px -13px rgba(125,74,168,0.9), inset 0 1px rgba(255,255,255,0.13);
}

.admin-workspace {
  background:
    radial-gradient(circle at 100% 0, rgba(0,174,189,0.055), transparent 28rem),
    radial-gradient(circle at 0 100%, rgba(239,93,157,0.045), transparent 30rem),
    #f7f8fc;
}

.admin-topbar {
  border-bottom: 1px solid rgba(125, 74, 168, 0.1);
  background: rgba(255,255,255,0.88);
  backdrop-filter: blur(18px) saturate(1.25);
  box-shadow: 0 8px 24px -24px rgba(55, 31, 75, 0.45);
}

.admin-content {
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
}

/* Playful admin: every routed view's headings use the rounded display face */
:deep(h1), :deep(h2), :deep(h3) {
  font-family: 'Fredoka', 'Nunito', system-ui, sans-serif;
}

.admin-content :deep(h1) {
  color: #241a2d;
  letter-spacing: -0.025em;
}

.admin-content :deep(.bg-white.rounded-2xl),
.admin-content :deep(.bg-white.rounded-xl),
.admin-content :deep(.bg-white.rounded-3xl) {
  border-color: rgba(125, 74, 168, 0.095);
  box-shadow: 0 10px 30px -25px rgba(63, 37, 82, 0.48);
}

.admin-content :deep(input:not([type='checkbox']):not([type='radio'])),
.admin-content :deep(select),
.admin-content :deep(textarea) {
  border-color: #e4dfe7;
  background-color: rgba(255,255,255,0.94);
  transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
}

.admin-content :deep(input:not([type='checkbox']):not([type='radio']):hover),
.admin-content :deep(select:hover),
.admin-content :deep(textarea:hover) {
  border-color: rgba(0,174,189,0.38);
}

.admin-content :deep(input:not([type='checkbox']):not([type='radio']):focus),
.admin-content :deep(select:focus),
.admin-content :deep(textarea:focus) {
  border-color: var(--admin-cyan) !important;
  --tw-ring-color: rgba(0,174,189,0.14) !important;
  box-shadow: 0 0 0 4px rgba(0,174,189,0.1);
}

.admin-content :deep(button),
.admin-content :deep(a) {
  -webkit-tap-highlight-color: transparent;
}

.admin-content :deep(button:not(:disabled):active),
.admin-content :deep(a:active) {
  transform: scale(0.98);
}

.admin-content :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
}

.admin-content :deep(thead th) {
  color: #776b7e;
  background: #faf9fc;
}

.admin-content :deep(tbody tr) {
  transition: background-color 150ms ease;
}
.admin-content :deep(tbody tr:hover) { background: rgba(0,174,189,0.025); }

.admin-bottom-nav {
  min-height: 64px;
  border-color: rgba(125,74,168,0.12);
  box-shadow: 0 -12px 30px -22px rgba(55,31,75,0.42);
}

.admin-bottom-nav > * { position: relative; min-height: 62px; }
.admin-bottom-nav > *.text-violet-600::before {
  content: '';
  position: absolute;
  top: 5px;
  width: 36px;
  height: 29px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0,174,189,0.12), rgba(239,93,157,0.13));
}
.admin-bottom-nav > *.text-violet-600 { color: var(--admin-purple); }
.admin-bottom-nav > * > span,
.admin-bottom-nav > * > svg { position: relative; z-index: 1; }

@media (max-width: 767px) {
  .admin-content :deep(h1) { font-size: 1.5rem; line-height: 1.15; }
  .admin-content :deep(h2) { line-height: 1.2; }
  .admin-content :deep(.rounded-2xl) { border-radius: 18px; }
  .admin-content :deep(input:not([type='checkbox']):not([type='radio'])),
  .admin-content :deep(select) { min-height: 44px; font-size: 16px; }
  .admin-content :deep(button) { min-height: 40px; }
  .admin-topbar { height: 62px; }
  .admin-sidebar-mobile { box-shadow: 24px 0 55px -25px rgba(15,9,22,0.8); }
}

/* Enter-only transition: the outgoing page is removed instantly (no blank
   flash); the incoming page fades + rises gently for a lively, cohesive feel. */
.page-enter-active { transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
.page-enter-from { opacity: 0; transform: translateY(10px); }
.page-leave-active { transition: none; }

@media (prefers-reduced-motion: reduce) {
  .page-enter-active { transition: none; }
  .page-enter-from { opacity: 1; transform: none; }
}
</style>
