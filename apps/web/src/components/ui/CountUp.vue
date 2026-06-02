<template>
  <span>{{ display }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  value: number;
  duration?: number;
  /** optional formatter, e.g. formatPrice. Defaults to pt-BR integer. */
  format?: (n: number) => string;
}>(), {
  duration: 1100,
});

const current = ref(0);
const display = ref('');
let raf = 0;

const fmt = (n: number) =>
  props.format ? props.format(n) : Math.round(n).toLocaleString('pt-BR');

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function animate(to: number) {
  cancelAnimationFrame(raf);
  const from = current.value;
  const delta = to - from;
  // respect reduced motion / tiny changes
  if (Math.abs(delta) < 1 || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    current.value = to;
    display.value = fmt(to);
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - start) / props.duration, 1);
    current.value = from + delta * easeOutCubic(t);
    display.value = fmt(current.value);
    if (t < 1) raf = requestAnimationFrame(step);
    else { current.value = to; display.value = fmt(to); }
  };
  raf = requestAnimationFrame(step);
}

onMounted(() => {
  display.value = fmt(0);
  animate(props.value);
});
watch(() => props.value, (v) => animate(v));
onUnmounted(() => cancelAnimationFrame(raf));
</script>
