<template>
  <div class="fixed bottom-[88px] md:bottom-6 right-6 z-[100]">
    <!-- Chat window -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform translate-y-4 opacity-0 scale-95"
      enter-to-class="transform translate-y-0 opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform translate-y-0 opacity-100 scale-100"
      leave-to-class="transform translate-y-4 opacity-0 scale-95"
    >
      <div v-if="isOpen" class="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col mb-4 origin-bottom-right">
        <!-- Header -->
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.375a9.976 9.976 0 004.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-5.505-4.483-9.988-9.993-9.988zm0 18.293c-1.558 0-3.085-.418-4.42-1.21l-.317-.188-3.287.863.878-3.2-.207-.329a8.28 8.28 0 01-1.266-4.437c0-4.57 3.72-8.294 8.295-8.294 4.576 0 8.3 3.725 8.3 8.3 0 4.576-3.724 8.295-8.296 8.295h-.002V20.293z" /><path d="M16.55 13.918c-.25-.125-1.477-.73-1.705-.813-.228-.084-.395-.125-.561.125-.166.25-.643.813-.788.98-.146.166-.291.187-.541.062-1.119-.556-2.023-1.074-2.825-2.453-.105-.181.101-.173.342-.647.083-.166.042-.312-.021-.437-.062-.125-.561-1.353-.77-1.853-.203-.484-.409-.419-.561-.427-.146-.008-.312-.01-.478-.01-.166 0-.437.062-.666.312-.229.25-.873.854-.873 2.082 0 1.229.894 2.416 1.019 2.582.125.166 1.761 2.686 4.266 3.769 1.834.793 2.392.835 3.016.793.578-.039 1.477-.604 1.685-1.187.208-.583.208-1.083.146-1.187-.063-.104-.229-.166-.479-.291z" /></svg>
            </div>
            <div>
              <h3 class="font-bold text-sm">Atendimento</h3>
              <p class="text-[11px] text-green-100">Online agora</p>
            </div>
          </div>
          <button @click="isOpen = false" class="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Chat Area -->
        <div class="bg-slate-50 p-4 max-h-80 overflow-y-auto flex-1 flex flex-col gap-3">
          <!-- Bot message -->
          <div class="flex gap-2 w-11/12">
            <div class="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1">
              <span class="text-[10px]">🤖</span>
            </div>
            <div class="bg-white px-3 py-2 rounded-2xl rounded-tl-none text-sm text-gray-700 shadow-sm border border-gray-100">
              Olá! Como posso ajudar você hoje? Escolha uma das opções ou fale com um humano.
            </div>
          </div>
          
          <template v-if="activeAnswer">
            <!-- User Question selected -->
            <div class="flex justify-end w-full">
              <div class="bg-green-500 text-white px-3 py-2 rounded-2xl rounded-tr-none text-sm shadow-sm ml-auto max-w-[90%]">
                {{ activeQuestionText }}
              </div>
            </div>
            <!-- Bot Answer -->
            <div class="flex gap-2 w-11/12">
              <div class="w-6 h-6 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center mt-1">
                <span class="text-[10px]">🤖</span>
              </div>
              <div class="bg-white px-3 py-2 rounded-2xl rounded-tl-none text-sm text-gray-700 shadow-sm border border-gray-100">
                {{ activeAnswer }}
              </div>
            </div>
          </template>
        </div>

        <!-- Quick actions -->
        <div class="bg-white border-t border-gray-100 p-3 flex flex-col gap-2">
          <button v-if="activeAnswer" @click="activeAnswer = null" class="text-xs text-center text-gray-400 hover:text-gray-600 mb-1 font-medium">
            ← Voltar às opções
          </button>
          
          <template v-if="!activeAnswer">
            <button v-for="(q, idx) in faqOptions" :key="idx" @click="showAnswer(q)" class="text-left text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-100">
              {{ q.question }}
            </button>
          </template>

          <a :href="whatsappUrl" target="_blank" class="mt-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold py-2.5 rounded-xl shadow-sm hover:opacity-90 transition-opacity">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.375a9.976 9.976 0 004.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-5.505-4.483-9.988-9.993-9.988zm0 18.293c-1.558 0-3.085-.418-4.42-1.21l-.317-.188-3.287.863.878-3.2-.207-.329a8.28 8.28 0 01-1.266-4.437c0-4.57 3.72-8.294 8.295-8.294 4.576 0 8.3 3.725 8.3 8.3 0 4.576-3.724 8.295-8.296 8.295h-.002V20.293z" /><path d="M16.55 13.918c-.25-.125-1.477-.73-1.705-.813-.228-.084-.395-.125-.561.125-.166.25-.643.813-.788.98-.146.166-.291.187-.541.062-1.119-.556-2.023-1.074-2.825-2.453-.105-.181.101-.173.342-.647.083-.166.042-.312-.021-.437-.062-.125-.561-1.353-.77-1.853-.203-.484-.409-.419-.561-.427-.146-.008-.312-.01-.478-.01-.166 0-.437.062-.666.312-.229.25-.873.854-.873 2.082 0 1.229.894 2.416 1.019 2.582.125.166 1.761 2.686 4.266 3.769 1.834.793 2.392.835 3.016.793.578-.039 1.477-.604 1.685-1.187.208-.583.208-1.083.146-1.187-.063-.104-.229-.166-.479-.291z" /></svg>
            Falar com Atendente
          </a>
        </div>
      </div>
    </transition>

    <!-- Floating Action Button -->
    <div class="relative">
      <!-- Efeito de piscar (ping) -->
      <div v-if="!isOpen" class="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
      
      <button 
        @click="isOpen = !isOpen" 
        class="relative w-14 h-14 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/40 hover:scale-105 active:scale-95 transition-all"
        aria-label="Abrir chat de ajuda"
      >
        <svg v-if="!isOpen" class="w-7 h-7 drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.375a9.976 9.976 0 004.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-5.505-4.483-9.988-9.993-9.988zm0 18.293c-1.558 0-3.085-.418-4.42-1.21l-.317-.188-3.287.863.878-3.2-.207-.329a8.28 8.28 0 01-1.266-4.437c0-4.57 3.72-8.294 8.295-8.294 4.576 0 8.3 3.725 8.3 8.3 0 4.576-3.724 8.295-8.296 8.295h-.002V20.293z" /><path d="M16.55 13.918c-.25-.125-1.477-.73-1.705-.813-.228-.084-.395-.125-.561.125-.166.25-.643.813-.788.98-.146.166-.291.187-.541.062-1.119-.556-2.023-1.074-2.825-2.453-.105-.181.101-.173.342-.647.083-.166.042-.312-.021-.437-.062-.125-.561-1.353-.77-1.853-.203-.484-.409-.419-.561-.427-.146-.008-.312-.01-.478-.01-.166 0-.437.062-.666.312-.229.25-.873.854-.873 2.082 0 1.229.894 2.416 1.019 2.582.125.166 1.761 2.686 4.266 3.769 1.834.793 2.392.835 3.016.793.578-.039 1.477-.604 1.685-1.187.208-.583.208-1.083.146-1.187-.063-.104-.229-.166-.479-.291z" /></svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSiteConfigStore } from '@/stores/site-config.store';

const siteConfig = useSiteConfigStore();
const isOpen = ref(false);
const activeAnswer = ref<string | null>(null);
const activeQuestionText = ref<string>('');

const whatsappNumber = computed(() => {
  let num = siteConfig.config.socialLinks?.whatsapp || '5511999999999';
  return num.replace(/\D/g, ''); // Extrai apenas os digitos
});

const whatsappUrl = computed(() => {
  return `https://wa.me/${whatsappNumber.value}?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20meu%20pedido%21`;
});

const faqOptions = [
  { question: 'Como recebo os produtos?', answer: 'Após a confirmação do pagamento, você recebe imediatamente o link para download dos PDFs direto na tela e também no seu e-mail!' },
  { question: 'Quais as formas de pagamento?', answer: 'Aceitamos PIX (aprovação imediata) e Cartão de Crédito em até 12x.' },
  { question: 'Tenho acesso vitalício?', answer: 'Sim! Uma vez comprado, você pode baixar o arquivo PDF quantas vezes quiser através do seu painel.' }
];

function showAnswer(q: any) {
  activeQuestionText.value = q.question;
  activeAnswer.value = q.answer;
}
</script>
