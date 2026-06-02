<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <!-- Key by the top-level layout, NOT the full path, so navigating between
           tabs inside a layout (e.g. /admin/*) keeps the shell mounted instead
           of remounting + refetching it on every tab change (the flicker). -->
      <component :is="Component" :key="(route.matched[0]?.path) || route.path" />
    </Transition>
  </RouterView>
  <PhoneRequiredModal />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSiteConfigStore } from '@/stores/site-config.store';
import PhoneRequiredModal from '@/components/ui/PhoneRequiredModal.vue';

const siteConfig = useSiteConfigStore();

onMounted(() => {
  siteConfig.fetch();
});
</script>
