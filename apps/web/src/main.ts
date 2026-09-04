import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';
import App from './App.vue';
import router from './router';
import { initTelegramLogger } from './lib/telegram-logger';
import './assets/main.css';

// A PWA aberta durante uma publicação pode manter uma página antiga que aponta
// para um chunk já substituído. Limpa somente os caches do site e recarrega uma
// vez por sessão, evitando a tela vazia e também evitando loop de atualização.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  const recoveryKey = 'pedago-pwa-recovery-at';
  const lastRecovery = Number(sessionStorage.getItem(recoveryKey) || 0);
  if (Date.now() - lastRecovery < 60_000) return;
  sessionStorage.setItem(recoveryKey, String(Date.now()));

  const clearWorkers = 'serviceWorker' in navigator
    ? navigator.serviceWorker.getRegistrations().then((registrations) =>
        Promise.all(registrations.map((registration) => registration.unregister())),
      )
    : Promise.resolve([]);
  const clearCaches = 'caches' in window
    ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    : Promise.resolve([]);

  Promise.allSettled([clearWorkers, clearCaches]).finally(() => window.location.reload());
});

async function main() {
  // No mobile, substitui fetch pelo plugin nativo (sem CORS) antes de qualquer uso do router
  if (import.meta.env.VITE_TARGET === 'mobile') {
    const fetchMod = await import('./mobile/fetch')
    await fetchMod.patchFetch()
  }

  const app = createApp(App);
  const pinia = createPinia();
  const head = createHead();
  
  initTelegramLogger(app);

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
