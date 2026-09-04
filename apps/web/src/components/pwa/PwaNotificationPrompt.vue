<template>
  <Transition name="push-card">
    <aside v-if="visible" class="push-card" role="dialog" aria-label="Ativar notificações de pedidos">
      <button type="button" class="push-close" aria-label="Agora não" @click="dismiss">
        <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <div class="push-bell" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
      </div>
      <div>
        <h2>{{ feedback || cardTitle }}</h2>
        <p v-if="!feedback">{{ cardDescription }}</p>
      </div>
      <button v-if="!feedback && primaryLabel" type="button" class="push-enable" :disabled="loading" @click="handlePrimary">
        {{ loading ? 'Ativando…' : primaryLabel }}
      </button>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { isInAppBrowser } from '@/lib/inAppBrowser';
import {
  canUseWebPush,
  enableWebPush,
  isIosDevice,
  isStandalonePwa,
} from '@/pwa/push';

const DISMISS_KEY = 'pedago-web-push-dismissed-until';
const auth = useAuthStore();
const router = useRouter();
const visible = ref(false);
const loading = ref(false);
const feedback = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;

const permission = computed(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
const pushSupported = computed(() => canUseWebPush());
const needsIosInstall = computed(() => isIosDevice() && !isStandalonePwa());
const isEnabled = computed(() => Boolean(
  auth.user?.id && localStorage.getItem('pedago-web-push-enabled') === auth.user.id,
));
const cardTitle = computed(() => {
  if (needsIosInstall.value) return 'Instale para ativar no iPhone';
  if (!pushSupported.value) return 'Navegador sem suporte a avisos';
  if (!auth.user?.id) return 'Entre para ativar os avisos';
  if (permission.value === 'denied') return 'Notificações bloqueadas';
  if (permission.value === 'granted' && isEnabled.value) return 'Avisos já estão ativos';
  return 'Acompanhe seus pedidos';
});
const cardDescription = computed(() => {
  if (needsIosInstall.value) return 'Toque em Compartilhar, escolha Adicionar à Tela de Início e abra o Site Pedagógico pelo novo ícone.';
  if (!pushSupported.value && isIosDevice()) return 'Atualize o iPhone para o iOS 16.4 ou mais recente e abra o site pelo ícone da Tela de Início.';
  if (!pushSupported.value) return 'Este navegador não oferece os recursos necessários para notificações.';
  if (!auth.user?.id) return 'O token de notificação precisa ser vinculado à sua conta.';
  if (permission.value === 'denied') return 'Libere as notificações nas configurações deste site no navegador.';
  if (permission.value === 'granted' && isEnabled.value) return 'Este aparelho está pronto para receber novidades e atualizações de pedidos.';
  return 'Receba avisos quando o PIX for aprovado e o material estiver disponível.';
});
const primaryLabel = computed(() => {
  if (needsIosInstall.value) return 'Como instalar';
  if (!pushSupported.value) return '';
  if (!auth.user?.id) return 'Entrar na conta';
  if (permission.value === 'denied' || (permission.value === 'granted' && isEnabled.value)) return '';
  return 'Ativar avisos';
});

function schedule(userId?: string): void {
  const isLocalTest = import.meta.env.DEV;
  if (isInAppBrowser()) return;
  if (!isLocalTest && !canUseWebPush() && !needsIosInstall.value) return;
  if (!isLocalTest && !userId) return;
  if (!isLocalTest && !needsIosInstall.value && Notification.permission !== 'default') return;
  if (!isLocalTest && userId && localStorage.getItem('pedago-web-push-enabled') === userId) return;
  if (!isLocalTest && Number(localStorage.getItem(DISMISS_KEY) || 0) > Date.now()) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { visible.value = true; }, isLocalTest ? 300 : 1500);
}

watch(() => auth.user?.id, (userId) => {
  visible.value = false;
  schedule(userId);
}, { immediate: true });

function handlePrimary(): void {
  if (needsIosInstall.value) {
    visible.value = false;
    window.dispatchEvent(new CustomEvent('pedago:show-ios-install'));
    return;
  }
  if (!auth.user?.id) {
    router.push({ name: 'login', query: { redirect: window.location.pathname } });
    return;
  }
  enable();
}

async function enable(): Promise<void> {
  const userId = auth.user?.id;
  if (!userId) return;
  loading.value = true;
  try {
    const result = await enableWebPush(userId);
    feedback.value = result === 'enabled'
      ? 'Avisos ativados com sucesso!'
      : result === 'denied'
        ? 'Permissão não concedida.'
        : 'Notificações indisponíveis neste aparelho.';
  } catch (error) {
    console.error('Falha ao ativar Web Push:', error);
    feedback.value = 'Não foi possível ativar agora.';
  } finally {
    loading.value = false;
    setTimeout(() => { visible.value = false; }, 2600);
  }
}

function dismiss(): void {
  visible.value = false;
  localStorage.setItem(DISMISS_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer);
});
</script>

<style scoped>
.push-card { position: fixed; z-index: 89; left: 50%; bottom: calc(76px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); display: grid; grid-template-columns: auto minmax(0,1fr) auto; align-items: center; gap: 12px; width: min(92vw, 650px); padding: 14px 16px; border: 1px solid rgba(0,174,189,.22); border-radius: 22px; color: #183244; background: rgba(247,255,255,.97); box-shadow: 0 20px 55px -20px rgba(20,89,99,.45); backdrop-filter: blur(18px); }
.push-bell { display: grid; place-items: center; width: 50px; height: 50px; border-radius: 16px; color: #7d4aa8; background: linear-gradient(135deg, #e5fbfd, #fbe8f3); }
.push-bell svg { width: 25px; height: 25px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.push-card h2 { margin: 0; font-family: 'Fredoka', sans-serif; font-size: 17px; font-weight: 700; }
.push-card p { margin: 3px 0 0; color: #66747a; font-size: 12px; line-height: 1.35; }
.push-enable { min-height: 42px; padding: 0 15px; border: 0; border-radius: 14px; color: white; background: linear-gradient(135deg, #00aebd, #7d4aa8); font-size: 13px; font-weight: 800; }
.push-enable:disabled { opacity: .65; }
.push-close { position: absolute; top: -9px; right: -7px; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 1px solid #e4eff0; border-radius: 50%; color: #64757a; background: white; }
.push-close svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.push-card-enter-active, .push-card-leave-active { transition: opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1); }
.push-card-enter-from, .push-card-leave-to { opacity: 0; transform: translate(-50%, 18px) scale(.96); }
@media (min-width: 768px) { .push-card { bottom: 24px; } }
@media (max-width: 520px) { .push-card { grid-template-columns: auto minmax(0,1fr); } .push-enable { grid-column: 1 / -1; width: 100%; } }
</style>
