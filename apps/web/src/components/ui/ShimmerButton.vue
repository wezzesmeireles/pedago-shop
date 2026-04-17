<template>
  <button
    v-bind="$attrs"
    :style="{
      '--shimmer-color': shimmerColor,
      '--radius': borderRadius,
      '--speed': shimmerDuration,
      '--bg': background,
    }"
    class="shimmer-btn group relative z-0 flex cursor-pointer items-center justify-center
           overflow-hidden border border-white/10 px-6 py-3 whitespace-nowrap text-white
           transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px"
  >
    <!-- spark layer -->
    <div class="absolute inset-0 overflow-hidden -z-10 blur-[2px]">
      <div class="shimmer-slide absolute inset-0 aspect-square h-full">
        <div class="spin-around absolute -inset-full bg-[conic-gradient(from_calc(270deg-45deg),transparent_0,var(--shimmer-color)_90deg,transparent_90deg)]" />
      </div>
    </div>

    <slot />

    <!-- highlight -->
    <div class="absolute inset-0 rounded-[inherit] shadow-[inset_0_-8px_10px_#ffffff1f]
                group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]
                group-active:shadow-[inset_0_-10px_10px_#ffffff3f]
                transition-shadow duration-300" />

    <!-- backdrop -->
    <div class="absolute inset-[2px] -z-20 rounded-[inherit]" :style="{ background }" />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  shimmerColor?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}>(), {
  shimmerColor: '#ffffff',
  borderRadius: '12px',
  shimmerDuration: '3s',
  background: 'rgba(124, 58, 237, 1)',
});
</script>

<style scoped>
.shimmer-btn {
  border-radius: var(--radius);
}
.shimmer-slide {
  animation: shimmer-slide var(--speed, 3s) ease-in-out infinite alternate;
}
.spin-around {
  animation: spin-around calc(var(--speed, 3s) * 2) linear infinite;
}
@keyframes shimmer-slide {
  to { transform: translate(calc(100cqw - 100%), 0); }
}
@keyframes spin-around {
  0%   { transform: translateZ(0) rotate(0); }
  15%, 35% { transform: translateZ(0) rotate(90deg); }
  65%, 85% { transform: translateZ(0) rotate(270deg); }
  100% { transform: translateZ(0) rotate(360deg); }
}
</style>
