<template>
  <div class="text-center py-8">
    <div class="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p class="text-gray-500 text-sm">Autenticando com Google...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { account } from '@/lib/appwrite';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  try {
    await account.get(); // Verify session exists
    await auth.fetchMe(); // Populate store
    if (!auth.user?.phone) {
      router.push({ name: 'phone-required' });
    } else {
      router.push('/');
    }
  } catch {
    router.push('/auth/login?error=oauth_failed');
  }
});
</script>
