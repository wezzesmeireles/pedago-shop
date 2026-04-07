<template>
  <div class="max-w-md mx-auto px-4 py-20 text-center">
    <div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
      <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </div>
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Pagamento não aprovado</h1>
    <p class="text-gray-500 mb-8">Não foi possível processar seu pagamento. Nenhuma cobrança foi realizada.</p>

    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-left">
      <p class="text-sm font-semibold text-amber-800 mb-2">O que pode ter acontecido:</p>
      <ul class="text-sm text-amber-700 space-y-1 list-disc list-inside">
        <li>Saldo insuficiente no cartão</li>
        <li>Dados do cartão incorretos</li>
        <li>Cartão não habilitado para compras online</li>
        <li>Limite do cartão atingido</li>
      </ul>
    </div>

    <div class="flex flex-col gap-3">
      <RouterLink to="/checkout" class="btn-primary py-3.5 text-base">
        Tentar novamente
      </RouterLink>
      <RouterLink to="/catalogo" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">
        Voltar ao catálogo
      </RouterLink>
    </div>
  </div>
</template>
