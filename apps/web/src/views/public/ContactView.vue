<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
    <!-- Header -->
    <div class="text-center mb-12">
      <span class="inline-block bg-primary-100 text-primary-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Fale Conosco</span>
      <h1 class="text-3xl sm:text-4xl font-black text-gray-900 mb-3">Entre em Contato</h1>
      <p class="text-gray-500 max-w-xl mx-auto">Tem alguma dúvida, sugestão ou precisa de ajuda? Nossa equipe está aqui para te atender!</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

      <!-- Contact info -->
      <div class="lg:col-span-2 space-y-4">
        <!-- WhatsApp -->
        <a
          v-if="config.socialLinks?.whatsapp"
          :href="`https://wa.me/${config.socialLinks.whatsapp}?text=Olá! Tenho uma dúvida sobre o ${config.storeName}.`"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl p-5 transition-all group"
        >
          <div class="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-gray-900">WhatsApp</p>
            <p class="text-sm text-green-700">Clique para conversar agora</p>
          </div>
          <svg class="w-5 h-5 text-green-400 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>

        <!-- Instagram -->
        <a
          v-if="config.socialLinks?.instagram"
          :href="config.socialLinks.instagram"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-4 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-2xl p-5 transition-all group"
        >
          <div class="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-gray-900">Instagram</p>
            <p class="text-sm text-pink-600">Siga nossas novidades</p>
          </div>
          <svg class="w-5 h-5 text-pink-300 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>

        <!-- TikTok -->
        <a
          v-if="config.socialLinks?.tiktok"
          :href="config.socialLinks.tiktok"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl p-5 transition-all group"
        >
          <div class="w-12 h-12 bg-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-gray-900">TikTok</p>
            <p class="text-sm text-slate-500">Siga nosso TikTok</p>
          </div>
          <svg class="w-5 h-5 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>

        <!-- FAQ cards -->
        <div class="bg-violet-50 border border-violet-100 rounded-2xl p-5 space-y-4 mt-4">
          <h3 class="font-bold text-gray-900 text-sm uppercase tracking-wide">Dúvidas frequentes</h3>
          <div v-for="faq in faqs" :key="faq.q" class="border-b border-violet-100 last:border-0 pb-3 last:pb-0">
            <p class="font-semibold text-gray-800 text-sm mb-1">{{ faq.q }}</p>
            <p class="text-xs text-gray-500 leading-relaxed">{{ faq.a }}</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="lg:col-span-3">
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          <h2 class="font-bold text-gray-900 text-lg mb-6">Envie sua mensagem</h2>

          <div v-if="sent" class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h3 class="font-bold text-gray-900 text-xl mb-2">Mensagem enviada!</h3>
            <p class="text-gray-500 text-sm">Responderemos em até 24 horas. Obrigado pelo contato!</p>
            <button @click="sent = false" class="mt-6 text-primary-600 text-sm font-medium hover:underline">Enviar outra mensagem</button>
          </div>

          <form v-else @submit.prevent="sendMessage" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nome *</label>
                <input v-model="form.name" required placeholder="Seu nome" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">E-mail *</label>
                <input v-model="form.email" type="email" required placeholder="seu@email.com" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Assunto *</label>
              <select v-model="form.subject" required class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white">
                <option value="" disabled>Selecione um assunto...</option>
                <option value="Dúvida sobre produto">Dúvida sobre produto</option>
                <option value="Problema no download">Problema no download</option>
                <option value="Pagamento">Pagamento</option>
                <option value="Sugestão">Sugestão</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Mensagem *</label>
              <textarea v-model="form.message" required rows="5" placeholder="Descreva sua dúvida ou mensagem..." class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"></textarea>
            </div>
            <button type="submit" class="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.99] text-white font-bold py-3 rounded-xl transition-all duration-200 shadow text-sm">
              Enviar Mensagem
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useSiteConfigStore } from '@/stores/site-config.store';

const { config } = useSiteConfigStore();
const sent = ref(false);

const form = reactive({ name: '', email: '', subject: '', message: '' });

const faqs = [
  { q: 'Como recebo minha compra?', a: 'Após a confirmação do pagamento, o link de download é enviado automaticamente para o seu e-mail e fica disponível na sua conta.' },
  { q: 'Os arquivos têm prazo de validade?', a: 'Os downloads ficam disponíveis por 30 dias após a compra. Salve o arquivo no seu dispositivo!' },
  { q: 'Posso imprimir os materiais?', a: 'Sim! Todos os materiais são em PDF de alta qualidade, prontos para impressão.' },
  { q: 'Qual o prazo de resposta?', a: 'Respondemos todas as mensagens em até 24 horas nos dias úteis.' },
];

function sendMessage() {
  // In a real app, this would call an API/edge function or send to WhatsApp
  const whatsapp = config.socialLinks?.whatsapp;
  if (whatsapp) {
    const text = encodeURIComponent(`*${form.subject}*\n\nNome: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
    window.open(`https://wa.me/${whatsapp}?text=${text}`, '_blank');
  }
  sent.value = true;
  Object.assign(form, { name: '', email: '', subject: '', message: '' });
}
</script>
