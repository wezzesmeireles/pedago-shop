<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-white shadow-sm sticky top-0 z-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 sm:h-16">
        <RouterLink to="/" class="text-lg sm:text-xl font-bold text-gradient truncate max-w-[140px] sm:max-w-none">{{ config.storeName }}</RouterLink>
        <!-- Desktop nav -->
        <nav class="hidden sm:flex items-center gap-4">
          <RouterLink to="/minha-conta/pedidos" class="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Pedidos</RouterLink>
          <RouterLink to="/minha-conta/downloads" class="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">Downloads</RouterLink>
          <RouterLink to="/" class="text-gray-600 hover:text-primary-600 text-sm font-medium transition-colors">← Loja</RouterLink>
        </nav>
        <!-- Mobile: back to store -->
        <RouterLink to="/" class="sm:hidden text-sm text-primary-600 font-medium flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Loja
        </RouterLink>
      </div>
    </header>

    <main class="flex-1 max-w-4xl mx-auto w-full px-4 py-6 pb-24 sm:pb-8">
      <RouterView />
    </main>

    <!-- Mobile bottom navigation -->
    <nav class="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20 safe-area-bottom">
      <div class="grid grid-cols-2 h-16">
        <RouterLink to="/minha-conta/pedidos"
          class="flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
          :class="$route.path.includes('/pedidos') ? 'text-primary-600' : 'text-gray-500'">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Pedidos
        </RouterLink>
        <RouterLink to="/minha-conta/downloads"
          class="flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
          :class="$route.path.includes('/downloads') ? 'text-primary-600' : 'text-gray-500'">
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
