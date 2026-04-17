<template>
  <span ref="el" class="tabular-nums" :class="className">{{ display }}</span>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
  locale?: string;
  suffix?: string;
}>(), {
  duration: 1800,
  delay: 0,
  locale: 'pt-BR',
  suffix: '',
});

const el = ref<HTMLElement | null>(null);
const display = ref('0');
let observer: IntersectionObserver | null = null;
let animated = false;

function animate() {
  if (animated) return;
  animated = true;
  const steps = 60;
  const increment = props.value / steps;
  let current = 0;
  const tick = props.duration / steps;
  const timer = setInterval(() => {
    current += increment;
    if (current >= props.value) {
      current = props.value;
      clearInterval(timer);
    }
    display.value = new Intl.NumberFormat(props.locale).format(Math.floor(current)) + props.suffix;
  }, tick);
}

onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      setTimeout(animate, props.delay * 1000);
    }
  }, { threshold: 0.1 });
  if (el.value) observer.observe(el.value);
});

onUnmounted(() => observer?.disconnect());
</script>
