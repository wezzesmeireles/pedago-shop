<template>
  <div>
    <!-- Hero -->
    <section class="relative overflow-hidden py-20 md:py-28" style="background: linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)">
      <div class="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <span class="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">Nossa História</span>
        <h1 class="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
          Simplificando o ensino no dia a dia
        </h1>
        <p class="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
          Somos uma plataforma apaixonada por educação, criada para facilitar a vida de professores e pedagogos com materiais digitais de alta qualidade.
        </p>
      </div>
    </section>

    <!-- Mission / Values -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div v-for="value in values" :key="value.title" class="bg-white rounded-3xl border border-gray-100 shadow-sm p-7 text-center hover:shadow-md transition-shadow">
          <div class="text-4xl mb-4">{{ value.emoji }}</div>
          <h3 class="font-bold text-gray-900 text-lg mb-2">{{ value.title }}</h3>
          <p class="text-gray-500 text-sm leading-relaxed">{{ value.text }}</p>
        </div>
      </div>

      <!-- Story section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
        <div>
          <h2 class="text-3xl font-black text-gray-900 mb-5">Por que criamos o {{ config.storeName }}?</h2>
          <div class="space-y-4 text-gray-600 leading-relaxed">
            <p>
              Tudo começou com uma necessidade real: professoras que passavam horas procurando atividades pedagógicas de qualidade na internet, sem encontrar o que precisavam.
            </p>
            <p>
              Decidimos criar uma plataforma onde educadores pudessem encontrar materiais bem elaborados, prontos para imprimir, a preços acessíveis e com acesso imediato após o pagamento.
            </p>
            <p>
              Cada atividade é desenvolvida por pedagogos experientes, pensada para engajar os alunos e facilitar o dia a dia em sala de aula.
            </p>
          </div>
          <RouterLink
            to="/catalogo"
            class="inline-flex items-center gap-2 mt-8 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow text-sm"
          >
            Ver Atividades
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </RouterLink>
        </div>
        <div class="relative">
          <div class="bg-gradient-to-br from-violet-100 to-pink-100 rounded-3xl p-10 text-center">
            <div class="text-7xl mb-4">📚</div>
            <div class="grid grid-cols-2 gap-4 mt-6">
              <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl p-4 shadow-sm">
                <p class="text-2xl font-black text-primary-600">{{ stat.value }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ stat.label }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Team / How it works -->
      <div class="bg-gray-50 rounded-3xl p-10 mb-16">
        <h2 class="text-2xl font-black text-gray-900 text-center mb-10">Como funciona?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div v-for="(step, i) in steps" :key="step.title" class="text-center relative">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl" :class="step.bg">
              {{ step.emoji }}
            </div>
            <div v-if="i < steps.length - 1" class="hidden sm:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-gray-200"></div>
            <h3 class="font-bold text-gray-900 text-sm mb-1">{{ step.title }}</h3>
            <p class="text-xs text-gray-500 leading-relaxed">{{ step.text }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center bg-gradient-to-r from-violet-600 to-pink-500 rounded-3xl p-12 text-white">
        <h2 class="text-3xl font-black mb-3">Pronta para começar?</h2>
        <p class="text-white/80 mb-8 max-w-lg mx-auto">Explore nosso catálogo com centenas de atividades pedagógicas digitais e facilite sua rotina em sala de aula.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <RouterLink to="/catalogo" class="bg-white text-primary-700 font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow text-sm">
            Ver Catálogo
          </RouterLink>
          <RouterLink to="/contato" class="border-2 border-white/50 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors text-sm">
            Fale Conosco
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useSiteConfigStore } from '@/stores/site-config.store';

const { config } = useSiteConfigStore();

const values = [
  { emoji: '🎯', title: 'Qualidade', text: 'Cada atividade é cuidadosamente desenvolvida por pedagogos experientes para garantir resultados reais em sala de aula.' },
  { emoji: '⚡', title: 'Praticidade', text: 'Compre, baixe e imprima. Sem complicações, sem espera. Tudo pensado para economizar o seu tempo.' },
  { emoji: '💛', title: 'Acessibilidade', text: 'Preços justos para que todos os educadores possam ter acesso a materiais de qualidade, independente do orçamento.' },
];

const stats = [
  { value: '500+', label: 'Atividades' },
  { value: '10k+', label: 'Professores atendidos' },
  { value: '4.9★', label: 'Avaliação média' },
  { value: '100%', label: 'Entrega digital' },
];

const steps = [
  { emoji: '🔍', title: 'Explore', text: 'Navegue pelo catálogo e encontre a atividade ideal para sua turma.', bg: 'bg-violet-100' },
  { emoji: '🛒', title: 'Compre', text: 'Adicione ao carrinho e escolha como pagar: PIX ou cartão.', bg: 'bg-pink-100' },
  { emoji: '⬇️', title: 'Baixe', text: 'Após o pagamento, o PDF fica disponível para download na sua conta imediatamente.', bg: 'bg-blue-100' },
  { emoji: '🖨️', title: 'Imprima', text: 'Baixe, imprima e aplique em sala de aula. Simples assim!', bg: 'bg-green-100' },
];
</script>
