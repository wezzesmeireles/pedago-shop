<template>
  <AppModal :model-value="modelValue" :title="`Abra no navegador para baixar`" @update:model-value="$emit('update:modelValue', $event)">
    <div class="space-y-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
          </svg>
        </div>
        <p class="text-sm text-slate-600 leading-relaxed">
          Você está no navegador {{ name ? `do ${name}` : 'do aplicativo' }}, que não consegue salvar arquivos.
          Abra esta página no <strong>Chrome</strong> ou <strong>Safari</strong> para baixar normalmente.
        </p>
      </div>

      <!-- Platform steps -->
      <div class="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700">
        <p class="font-semibold mb-2">Como abrir:</p>
        <ol class="list-decimal list-inside space-y-1">
          <li>Toque no menu <strong>⋯</strong> (canto {{ isIOS ? 'inferior' : 'superior' }} da tela)</li>
          <li>Escolha <strong>“Abrir no navegador”</strong>{{ isIOS ? ' / “Abrir no Safari”' : ' / “Abrir no Chrome”' }}</li>
          <li>Toque em <strong>Baixar</strong> novamente</li>
        </ol>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-2">
        <button v-if="isAndroid" @click="openChrome"
          class="w-full inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors">
          Abrir no Chrome
        </button>
        <button @click="copyLink"
          class="w-full inline-flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          {{ copied ? 'Link copiado!' : 'Copiar link da página' }}
        </button>
      </div>
    </div>
  </AppModal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppModal from './AppModal.vue';
import { isAndroid as detectAndroid, isIOS as detectIOS, tryOpenInChromeAndroid } from '@/lib/inAppBrowser';

defineProps<{ modelValue: boolean; name?: string }>();
defineEmits(['update:modelValue']);

const isAndroid = detectAndroid();
const isIOS = detectIOS();
const copied = ref(false);

async function copyLink() {
  const url = window.location.href;
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // Fallback for webviews without clipboard API
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch { /* ignore */ }
    document.body.removeChild(ta);
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function openChrome() {
  tryOpenInChromeAndroid(window.location.href);
}
</script>
