<template>
  <svg :class="$attrs.class" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- 4 losangos formando o símbolo PIX -->
    <!-- Topo -->
    <polygon :fill="fill" points="50,3 66,34 50,48 34,34"/>
    <!-- Direita -->
    <polygon :fill="fill" points="52,52 66,34 97,50 66,66"/>
    <!-- Baixo -->
    <polygon :fill="fill" points="50,52 66,66 50,97 34,66"/>
    <!-- Esquerda -->
    <polygon :fill="fill" points="3,50 34,34 48,52 34,66"/>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ color?: string }>(), { color: '#32BCAD' });
const fill = props.color === 'white' ? '#ffffff' : props.color;
</script>
