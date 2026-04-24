<template>
  <div class="min-h-screen flex flex-col bg-gray-50">

    <!-- Header com gradiente -->
    <header class="sticky top-0 z-20 shadow-sm">
      <div class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700" />
        <div class="absolute inset-0 opacity-10"
          style="background-image: radial-gradient(circle at 90% 50%, white 0%, transparent 60%);" />
        <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <RouterLink to="/" class="flex items-center gap-2 group">
            <div class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-all">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </div>
            <span class="text-white font-black text-lg truncate max-w-[140px] sm:max-w-none">{{ config.storeName }}</span>
          </RouterLink>

          <!-- Desktop nav -->
          <nav class="hidden sm:flex items-center gap-1">
            <RouterLink
              to="/minha-conta/pedidos"
              class="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all"
              :class="$route.path.includes('/pedidos') ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              Pedidos
            </RouterLink>
            <RouterLink
              to="/minha-conta/downloads"
              class="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl transition-all"
              :class="$route.path.includes('/downloads') ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Downloads
            </RouterLink>
          </nav>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 sm:pb-8">
      <RouterView />
    </main>

    <!-- Mobile bottom nav -->
    <nav class="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20 safe-area-bottom shadow-lg">
      <div class="grid grid-cols-2 h-16">
        <RouterLink
          to="/minha-conta/pedidos"
          class="flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors"
          :class="$route.path.includes('/pedidos') ? 'text-primary-600' : 'text-gray-400'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Pedidos
        </RouterLink>
        <RouterLink
          to="/minha-conta/downloads"
          class="flex flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors"
          :class="$route.path.includes('/downloads') ? 'text-primary-600' : 'text-gray-400'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Downloads
        </RouterLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useSiteConfigStore } from '@/stores/site-config.store';
const { config } = useSiteConfigStore();
</script>
