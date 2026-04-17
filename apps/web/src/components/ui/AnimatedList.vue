<template>
  <div class="flex flex-col items-center gap-3 overflow-hidden" :class="className">
    <TransitionGroup name="al" tag="div" class="flex flex-col items-center gap-3 w-full">
      <div
        v-for="item in visible"
        :key="item.key"
        class="al-item mx-auto w-full"
      >
        <slot :item="item.data" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = withDefaults(defineProps<{
  items: any[];
  delay?: number;
  maxVisible?: number;
  className?: string;
}>(), {
  delay: 1200,
  maxVisible: 5,
});

const index = ref(0);
const visible = computed(() => {
  const result = [];
  for (let i = 0; i <= index.value && i < props.items.length; i++) {
    result.unshift({ key: i, data: props.items[i] });
  }
  return result.slice(0, props.maxVisible);
});

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % props.items.length;
  }, props.delay);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.al-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.al-leave-active {
  transition: all 0.2s ease;
  position: absolute;
}
.al-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(-12px);
}
.al-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.al-move {
  transition: transform 0.35s ease;
}
</style>
