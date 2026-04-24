<template>
  <svg :class="$attrs.class" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Símbolo PIX: 4 kites separados por X no centro, formando ❖ -->
    <!-- Topo -->
    <polygon :fill="fill" points="50,2  82,34  50,44  18,34"/>
    <!-- Direita -->
    <polygon :fill="fill" points="98,50  66,18  56,50  66,82"/>
    <!-- Baixo -->
    <polygon :fill="fill" points="50,98  18,66  50,56  82,66"/>
    <!-- Esquerda -->
    <polygon :fill="fill" points="2,50  34,18  44,50  34,82"/>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ color?: string }>(), { color: '#32BCAD' });
const fill = props.color === 'white' ? '#ffffff' : props.color;
</script>
