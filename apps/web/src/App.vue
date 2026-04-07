<template>
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSiteConfigStore } from '@/stores/site-config.store';

const siteConfig = useSiteConfigStore();

onMounted(() => {
  siteConfig.fetch();
});
</script>
