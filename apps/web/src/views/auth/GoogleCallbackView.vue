<template>
  <div class="text-center py-8">
    <div class="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
    <p class="text-gray-500 text-sm">Autenticando com Google...</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    router.push('/auth/login');
    return;
  }
  await auth.fetchMe();

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', data.session.user.id)
    .single();

  if (!profile?.phone) {
    router.push({ name: 'phone-required' });
  } else {
    router.push('/');
  }
});
</script>
