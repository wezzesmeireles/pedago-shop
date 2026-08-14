<template>
  <Transition name="connection-toast">
    <div v-if="!online" class="connection-toast" role="status">
      <span aria-hidden="true">☁️</span>
      Você está offline. Algumas informações podem estar desatualizadas.
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const online = ref(true);
const update = () => { online.value = navigator.onLine; };

onMounted(() => {
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
});
onBeforeUnmount(() => {
  window.removeEventListener('online', update);
  window.removeEventListener('offline', update);
});
</script>

<style scoped>
.connection-toast { position: fixed; z-index: 100; top: calc(12px + env(safe-area-inset-top, 0px)); left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; width: max-content; max-width: 92vw; padding: 10px 14px; border: 1px solid #f4d48a; border-radius: 999px; color: #734f0d; background: rgba(255,249,225,.97); box-shadow: 0 12px 30px -18px rgba(90,59,6,.5); font-size: 12px; font-weight: 700; backdrop-filter: blur(12px); }
.connection-toast-enter-active, .connection-toast-leave-active { transition: opacity .2s ease, transform .25s ease; }
.connection-toast-enter-from, .connection-toast-leave-to { opacity: 0; transform: translate(-50%, -12px); }
</style>
