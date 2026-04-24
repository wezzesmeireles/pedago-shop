<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="route.path" />
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
