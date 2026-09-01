<template>
  <Transition name="pwa-card">
    <aside
      v-if="visible"
      class="pwa-install-card"
      role="dialog"
      aria-label="Instalar Site Pedagógico"
    >
      <button class="pwa-close" type="button" aria-label="Agora não" @click="dismiss()">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>

      <img src="/favicon-192.png" alt="" class="pwa-icon" />
      <div class="pwa-copy">
        <p class="pwa-eyebrow">Leve o aprendizado com você</p>
        <h2>Instale o Site Pedagógico</h2>
        <p v-if="!showIosInstructions">Acesso rápido, tela cheia e novidades dos seus materiais.</p>
        <p v-else>
          Toque em <strong>Compartilhar</strong> e depois em
          <strong>Adicionar à Tela de Início</strong>. Abra pelo novo ícone para
          ativar as notificações.
        </p>
      </div>

      <button v-if="!showIosInstructions" class="pwa-install-button" type="button" @click="install">
        Instalar
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" /></svg>
      </button>
      <button v-else class="pwa-understood-button" type="button" @click="dismiss()">Entendi</button>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pedago-pwa-install-dismissed-until';
const visible = ref(false);
const showIosInstructions = ref(false);
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let showTimer: ReturnType<typeof setTimeout> | undefined;

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isDismissed(): boolean {
  return Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now();
}

function canShowHere(): boolean {
  return import.meta.env.VITE_TARGET !== 'mobile' &&
    !location.pathname.startsWith('/admin') &&
    !isStandalone() &&
    !isDismissed();
}

function scheduleShow(delay = 4500): void {
  if (!canShowHere()) return;
  if (showTimer) clearTimeout(showTimer);
  showTimer = setTimeout(() => { visible.value = true; }, delay);
}

function onBeforeInstall(event: Event): void {
  event.preventDefault();
  deferredPrompt = event as BeforeInstallPromptEvent;
  showIosInstructions.value = false;
  scheduleShow();
}

function onInstalled(): void {
  visible.value = false;
  deferredPrompt = null;
  localStorage.removeItem(DISMISS_KEY);
  localStorage.setItem('pedago-pwa-installed', '1');
}

function showIosInstallInstructions(): void {
  if (isStandalone()) return;
  showIosInstructions.value = true;
  visible.value = true;
}

async function install(): Promise<void> {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  if (choice.outcome === 'accepted') {
    onInstalled();
  } else {
    dismiss(7);
  }
}

function dismiss(days = 30): void {
  visible.value = false;
  localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 24 * 60 * 60 * 1000));
}

onMounted(() => {
  window.addEventListener('pedago:show-ios-install', showIosInstallInstructions);
  if (!canShowHere()) return;
  window.addEventListener('beforeinstallprompt', onBeforeInstall);
  window.addEventListener('appinstalled', onInstalled);

  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isiOS) {
    showIosInstructions.value = true;
    scheduleShow(8000);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  window.removeEventListener('appinstalled', onInstalled);
  window.removeEventListener('pedago:show-ios-install', showIosInstallInstructions);
  if (showTimer) clearTimeout(showTimer);
});
</script>

<style scoped>
.pwa-install-card {
  position: fixed;
  z-index: 90;
  left: 50%;
  bottom: calc(76px + env(safe-area-inset-bottom, 0px));
  transform: translateX(-50%);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: min(92vw, 620px);
  padding: 13px 16px;
  color: #321854;
  background: linear-gradient(135deg, rgba(255,255,255,.98), rgba(255,248,252,.98));
  border: 1px solid rgba(125, 74, 168, .18);
  border-radius: 22px;
  box-shadow: 0 20px 55px -18px rgba(50, 24, 84, .45);
  backdrop-filter: blur(18px);
}

.pwa-install-card::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 2px;
  border-radius: inherit;
  background: linear-gradient(100deg, #00aebd, #9bd400, #ff5fa2, #7d4aa8);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.pwa-icon { width: 52px; height: 52px; border-radius: 15px; box-shadow: 0 8px 20px -10px rgba(50,24,84,.55); }
.pwa-copy { min-width: 0; }
.pwa-eyebrow { margin: 0 0 1px; color: #ef5d9d; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.pwa-copy h2 { margin: 0; font-family: 'Fredoka', sans-serif; font-size: 17px; line-height: 1.15; font-weight: 700; }
.pwa-copy p:not(.pwa-eyebrow) { margin: 3px 0 0; color: #6b6474; font-size: 12px; line-height: 1.35; }

.pwa-install-button,
.pwa-understood-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 15px;
  border: 0;
  border-radius: 14px;
  color: white;
  background: linear-gradient(135deg, #7d4aa8, #ef5d9d);
  font-size: 13px;
  font-weight: 800;
  box-shadow: 0 9px 20px -10px rgba(125, 74, 168, .8);
}
.pwa-install-button svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.pwa-close { position: absolute; top: -9px; right: -7px; z-index: 2; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 1px solid #eee8f3; border-radius: 50%; color: #746b7d; background: white; box-shadow: 0 5px 14px -8px #321854; }
.pwa-close svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

.pwa-card-enter-active, .pwa-card-leave-active { transition: opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1); }
.pwa-card-enter-from, .pwa-card-leave-to { opacity: 0; transform: translate(-50%, 18px) scale(.96); }

@media (min-width: 768px) {
  .pwa-install-card { bottom: 24px; }
}
@media (max-width: 520px) {
  .pwa-install-card { grid-template-columns: auto minmax(0, 1fr); padding-right: 13px; }
  .pwa-install-button, .pwa-understood-button { grid-column: 1 / -1; width: 100%; min-height: 40px; }
  .pwa-copy h2 { font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .pwa-card-enter-active, .pwa-card-leave-active { transition: none; }
}
</style>
