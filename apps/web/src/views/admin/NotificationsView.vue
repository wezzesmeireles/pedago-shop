<template>
  <div class="max-w-2xl mx-auto">
    <h1 class="text-2xl font-black text-gray-900 mb-1">Notificações</h1>
    <p class="text-sm text-gray-500 mb-6">
      Envie uma notificação push para todos os usuários do aplicativo (publicidade/avisos).
    </p>

    <section class="card p-5 sm:p-6 space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Título <span class="text-red-500">*</span>
        </label>
        <input v-model="title" type="text" maxlength="65" placeholder="Ex.: Promoção de Dia das Mães! 🎉"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <p class="text-[11px] text-gray-400 mt-1">{{ title.length }}/65</p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Mensagem <span class="text-red-500">*</span>
        </label>
        <textarea v-model="body" rows="3" maxlength="200" placeholder="Ex.: Atividades com 30% de desconto só hoje. Aproveite!"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"></textarea>
        <p class="text-[11px] text-gray-400 mt-1">{{ body.length }}/200</p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
          Link ao tocar (opcional)
        </label>
        <input v-model="link" type="text" placeholder="Ex.: /catalogo?destaque=1  (vazio = abre a home)"
          class="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        <p class="text-[11px] text-gray-400 mt-1">Caminho dentro do app. Em branco, o toque abre a tela inicial.</p>
      </div>

      <p class="text-xs text-amber-700 bg-amber-50 rounded-xl px-3.5 py-2.5">
        ⚠️ Só recebem quem tem o aplicativo instalado e as notificações ativadas.
      </p>

      <button @click="send" :disabled="!canSend || sending"
        class="btn-primary w-full py-3 disabled:opacity-60">
        {{ sending ? 'Enviando…' : 'Enviar para todos' }}
      </button>

      <p v-if="result" :class="['text-sm rounded-xl px-3.5 py-3 font-medium', result.ok ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50']">
        {{ result.text }}
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { invokeFunction } from '@/services/api';

const title = ref('');
const body = ref('');
const link = ref('');
const sending = ref(false);
const result = ref<{ ok: boolean; text: string } | null>(null);

const canSend = computed(() => title.value.trim().length > 0 && body.value.trim().length > 0);

async function send() {
  if (!canSend.value || sending.value) return;
  if (!window.confirm('Enviar esta notificação para TODOS os usuários do app?')) return;
  sending.value = true;
  result.value = null;
  try {
    const r: any = await invokeFunction('admin-ops', {
      action: 'broadcast-push',
      title: title.value.trim(),
      body: body.value.trim(),
      link: link.value.trim(),
    });
    if (r?.error) throw new Error(r.error);
    result.value = { ok: true, text: `✓ Enviado para ${r.users} usuário(s) em ${r.batches} lote(s).` };
    title.value = ''; body.value = ''; link.value = '';
  } catch (e: any) {
    result.value = { ok: false, text: 'Erro ao enviar: ' + (e?.message ?? 'tente novamente.') };
  } finally {
    sending.value = false;
  }
}
</script>
