import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@vueuse/head';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();
const head = createHead();

app.use(pinia);
app.use(router);
app.use(head);

app.mount('#app');

// Inicialização nativa: só no build mobile. A condição é estática (substituída
// em build), então o Rollup elimina este bloco — e as deps Capacitor — do
// bundle web.
if (import.meta.env.VITE_TARGET === 'mobile') {
  import('./mobile/native').then(({ initNative }) => initNative(router));
}
