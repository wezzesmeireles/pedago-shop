<template>
  <div class="text-center py-8">
    <div class="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p class="text-gray-500 text-sm">Autenticando com Google...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { setAccessToken } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  const token = route.query.token as string;
  if (token) {
    setAccessToken(token);
    try {
      await auth.fetchMe();
      router.push('/');
    } catch {
      router.push('/auth/login');
    }
  } else {
    router.push('/auth/login');
  }
});
</script>
