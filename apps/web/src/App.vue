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
  <PwaInstallPrompt />
  <PwaNotificationPrompt />
  <PwaConnectionStatus />
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useSiteConfigStore } from '@/stores/site-config.store';
import PhoneRequiredModal from '@/components/ui/PhoneRequiredModal.vue';
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt.vue';
import PwaNotificationPrompt from '@/components/pwa/PwaNotificationPrompt.vue';
import PwaConnectionStatus from '@/components/pwa/PwaConnectionStatus.vue';

const siteConfig = useSiteConfigStore();
const route = useRoute();

const canonicalUrl = computed(() => {
  const base = 'https://www.sitepedagogico.com';
  if (route.name === 'catalog' && typeof route.query.categoria === 'string') {
    return `${base}/catalogo?categoria=${encodeURIComponent(route.query.categoria)}`;
  }
  return `${base}${route.path}`;
});

// Mantém o domínio novo como fonte oficial e preserva categorias indexáveis.
useHead({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl,
    },
  ],
});

onMounted(() => {
  siteConfig.fetch();
});
</script>
