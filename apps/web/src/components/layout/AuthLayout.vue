<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <RouterLink to="/">
          <img v-if="config.logoUrl" :src="config.logoUrl" class="h-12 mx-auto" :alt="config.storeName" />
          <h1 v-else class="text-3xl font-bold text-gradient">{{ config.storeName }}</h1>
        </RouterLink>
        <p class="text-gray-500 mt-2 text-sm">{{ config.storeDescription }}</p>
      </div>
      <div class="card p-8">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSiteConfigStore } from '@/stores/site-config.store';
const { config } = useSiteConfigStore();
</script>
