<template>
  <div class="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
    <!-- Fundo com gradiente e blobs decorativos -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600" />
    <div class="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl"
      style="background: radial-gradient(circle, #ec4899, transparent)" />
    <div class="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 blur-3xl"
      style="background: radial-gradient(circle, #a78bfa, transparent)" />
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
      style="background: radial-gradient(circle, white, transparent)" />

    <div class="relative w-full max-w-md">
      <!-- Logo / Nome da loja -->
      <div class="text-center mb-8 animate-slide-in-down">
        <RouterLink to="/" class="inline-block">
          <img v-if="config.logoUrl" :src="config.logoUrl" class="h-14 mx-auto drop-shadow-xl" :alt="config.storeName" />
          <h1 v-else class="text-4xl font-black text-white drop-shadow-lg tracking-tight">
            {{ config.storeName }}
          </h1>
        </RouterLink>
        <p v-if="config.storeDescription" class="text-white/60 mt-2 text-sm">{{ config.storeDescription }}</p>
      </div>

      <!-- Card de conteúdo -->
      <div class="bg-white rounded-3xl shadow-2xl shadow-black/20 p-8 animate-slide-in-up">
        <RouterView />
      </div>

      <!-- Rodapé -->
      <p class="text-center text-white/40 text-xs mt-6">
        © {{ new Date().getFullYear() }} {{ config.storeName }}. Todos os direitos reservados.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSiteConfigStore } from '@/stores/site-config.store';
const { config } = useSiteConfigStore();
</script>

<style scoped>
.animate-slide-in-down { animation: slideDown 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
.animate-slide-in-up   { animation: slideUp   0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
@keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
@keyframes slideUp   { from { opacity:0; transform:translateY(20px);  } to { opacity:1; transform:translateY(0); } }
</style>
