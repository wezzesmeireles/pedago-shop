import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';
import App from './App.vue';
import router from './router';
import './assets/main.css';

async function main() {
  // No mobile, substitui fetch pelo plugin nativo (sem CORS) antes de qualquer uso do router
  if (import.meta.env.VITE_TARGET === 'mobile') {
    const fetchMod = await import('./mobile/fetch')
    await fetchMod.patchFetch()
  }

  const app = createApp(App);
  const pinia = createPinia();
  const head = createHead();

  app.use(pinia);
  app.use(router);
  app.use(head);

  app.mount('#app');

  // Inicialização nativa (push notifications, botão voltar, etc.)
  if (import.meta.env.VITE_TARGET === 'mobile') {
    import('./mobile/native').then(({ initNative }) => initNative(router)).catch(() => {});
  }
}

main()
