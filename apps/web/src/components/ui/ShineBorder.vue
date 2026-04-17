<template>
  <div class="relative" :class="className">
    <slot />
    <div
      class="shine-border pointer-events-none absolute inset-0 rounded-[inherit]"
      :style="{
        '--duration': `${duration}s`,
        '--border-width': `${borderWidth}px`,
        backgroundImage: `radial-gradient(transparent,transparent, ${Array.isArray(shineColor) ? shineColor.join(',') : shineColor},transparent,transparent)`,
        backgroundSize: '300% 300%',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        padding: `${borderWidth}px`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
  className?: string;
}>(), {
  borderWidth: 1,
  duration: 14,
  shineColor: '#7C3AED',
});
</script>

<style scoped>
.shine-border {
  animation: shine var(--duration, 14s) linear infinite;
  will-change: background-position;
}
@keyframes shine {
  0%   { background-position: 0% 0%; }
  50%  { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}
</style>
