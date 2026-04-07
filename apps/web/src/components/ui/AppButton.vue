<template>
  <button
    :type="type ?? 'button'"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98]',
      variantClasses[variant ?? 'primary'],
      sizeClasses[size ?? 'md'],
      (disabled || loading) && 'opacity-60 cursor-not-allowed'
    ]"
    v-bind="$attrs"
  >
    <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}>();

const variantClasses: Record<string, string> = {
  primary:   'bg-violet-600 hover:bg-violet-700 text-white shadow-sm focus:ring-violet-500',
  secondary: 'bg-white hover:bg-slate-50 text-violet-600 border-2 border-violet-600 focus:ring-violet-500',
  danger:    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  ghost:     'text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-300',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};
</script>
