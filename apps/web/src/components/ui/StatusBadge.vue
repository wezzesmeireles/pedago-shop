<template>
  <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', config.bg, config.text]">
    <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot]"></span>
    {{ config.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ status: string }>();

const map: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PAID:            { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Pago' },
  AWAITING_PAYMENT:{ bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Aguardando' },
  PENDING:         { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400',   label: 'Pendente' },
  CANCELLED:       { bg: 'bg-red-100',     text: 'text-red-600',     dot: 'bg-red-500',     label: 'Cancelado' },
  REFUNDED:        { bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Reembolsado' },
  EXPIRED:         { bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-300',   label: 'Expirado' },
};

const config = computed(() => map[props.status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: props.status });
</script>
