<template>
  <div
    v-if="enabled && (pulling || refreshing)"
    class="pull-refresh"
    :class="{ ready, refreshing }"
    :style="{ transform: `translate(-50%, ${indicatorY}px)` }"
    role="status"
    aria-live="polite"
  >
    <span class="pull-refresh-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M20 6v5h-5M4 18v-5h5M6.1 9A7 7 0 0118.3 6.7L20 11M4 13l1.7 4.3A7 7 0 0017.9 15" /></svg>
    </span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { dampedPullDistance, shouldRefresh } from '@/lib/pullToRefresh';

const enabled = ref(false);
const pulling = ref(false);
const refreshing = ref(false);
const distance = ref(0);
let startX = 0;
let startY = 0;

const ready = computed(() => shouldRefresh(distance.value));
const indicatorY = computed(() => Math.max(-64, distance.value - 58));
const label = computed(() => refreshing.value
  ? 'Atualizando…'
  : ready.value
    ? 'Solte para atualizar'
    : 'Puxe para atualizar');

function isStandalonePwa(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]'));
}

function onTouchStart(event: TouchEvent): void {
  if (!enabled.value || refreshing.value || window.scrollY > 0 || event.touches.length !== 1 || isInteractiveTarget(event.target)) return;
  startX = event.touches[0].clientX;
  startY = event.touches[0].clientY;
  pulling.value = true;
  distance.value = 0;
}

function onTouchMove(event: TouchEvent): void {
  if (!pulling.value || event.touches.length !== 1) return;
  const deltaX = Math.abs(event.touches[0].clientX - startX);
  const deltaY = event.touches[0].clientY - startY;
  if (deltaY <= 0 || deltaX > deltaY) {
    reset();
    return;
  }
  distance.value = dampedPullDistance(deltaY);
  if (distance.value > 0) event.preventDefault();
}

function onTouchEnd(): void {
  if (!pulling.value) return;
  if (shouldRefresh(distance.value)) {
    void refreshApp();
    return;
  }
  reset();
}

function reset(): void {
  pulling.value = false;
  distance.value = 0;
}

async function refreshApp(): Promise<void> {
  pulling.value = false;
  refreshing.value = true;
  distance.value = 72;
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(registrations.map((registration) => registration.update()));
    }
  } finally {
    window.location.reload();
  }
}

onMounted(() => {
  enabled.value = import.meta.env.VITE_TARGET !== 'mobile' &&
    (import.meta.env.DEV || isStandalonePwa());
  if (!enabled.value) return;
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd, { passive: true });
  document.addEventListener('touchcancel', reset, { passive: true });
});

onBeforeUnmount(() => {
  document.removeEventListener('touchstart', onTouchStart);
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  document.removeEventListener('touchcancel', reset);
});
</script>

<style scoped>
.pull-refresh {
  position: fixed;
  z-index: 120;
  top: calc(8px + env(safe-area-inset-top, 0px));
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 15px;
  border: 1px solid rgba(125, 74, 168, .16);
  border-radius: 999px;
  color: #5f397f;
  background: rgba(255, 255, 255, .97);
  box-shadow: 0 12px 30px -14px rgba(50, 24, 84, .55);
  font-size: 12px;
  font-weight: 800;
  transition: transform .16s ease, color .16s ease, background .16s ease;
  pointer-events: none;
}
.pull-refresh.ready { color: #fff; background: linear-gradient(135deg, #7d4aa8, #ef5d9d); }
.pull-refresh-icon { display: grid; place-items: center; width: 22px; height: 22px; }
.pull-refresh-icon svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transform: rotate(calc(var(--pull-turn, 0) * 1deg)); }
.pull-refresh.refreshing .pull-refresh-icon { animation: pull-spin .8s linear infinite; }
@keyframes pull-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .pull-refresh { transition: none; }
  .pull-refresh.refreshing .pull-refresh-icon { animation: none; }
}
</style>
