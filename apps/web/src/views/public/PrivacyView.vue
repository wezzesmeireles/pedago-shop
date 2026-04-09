<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
    <!-- Header -->
    <div class="mb-10">
      <span class="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">Documento Legal</span>
      <h1 class="text-3xl font-black text-gray-900 mb-3">Política de Privacidade</h1>
      <p class="text-gray-500 text-sm">Última atualização: {{ lastUpdated }}</p>
    </div>

    <!-- Content -->
    <div class="prose prose-gray max-w-none space-y-8">

      <div v-for="section in sections" :key="section.title" class="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-lg flex-shrink-0">
            {{ section.emoji }}
          </div>
          <h2 class="text-lg font-bold text-gray-900">{{ section.title }}</h2>
        </div>
        <div class="text-gray-600 text-sm leading-relaxed space-y-3">
          <p v-for="(para, i) in section.content" :key="i">{{ para }}</p>
          <ul v-if="section.list" class="list-disc list-inside space-y-1 ml-2">
            <li v-for="item in section.list" :key="item" class="text-gray-500">{{ item }}</li>
          </ul>
        </div>
      </div>

      <!-- Contact for privacy -->
      <div class="bg-primary-50 rounded-2xl border border-primary-100 p-7">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center text-lg flex-shrink-0">📬</div>
          <h2 class="text-lg font-bold text-gray-900">Dúvidas sobre Privacidade?</h2>
        </div>
        <p class="text-gray-600 text-sm leading-relaxed mb-4">
          Se você tiver dúvidas sobre como tratamos seus dados ou quiser exercer seus direitos, entre em contato conosco.
        </p>
        <RouterLink to="/contato" class="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm">
          Entrar em Contato
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const lastUpdated = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date('2026-04-01'));

const sections = [
  {
    emoji: '📋',
    title: '1. Informações que Coletamos',
    content: [
      'Para prestar nossos serviços, coletamos algumas informações pessoais quando você se cadastra e realiza compras em nossa plataforma.',
    ],
    list: [
      'Nome completo e endereço de e-mail',
      'Dados de autenticação (senha criptografada)',
      'Histórico de pedidos e downloads',
      'Informações de pagamento processadas por parceiros certificados (Mercado Pago)',
      'Dados de navegação (cookies de sessão e preferências)',
    ],
  },
  {
    emoji: '🎯',
    title: '2. Como Usamos suas Informações',
    content: [
      'Utilizamos seus dados exclusivamente para operar e melhorar nossos serviços.',
    ],
    list: [
      'Processar e confirmar seus pedidos de compra',
      'Enviar os arquivos digitais adquiridos por e-mail',
      'Comunicar atualizações sobre seus pedidos',
      'Enviar promoções e novidades (caso você opte por receber)',
      'Garantir a segurança da sua conta',
      'Melhorar nossa plataforma com base no comportamento de uso',
    ],
  },
  {
    emoji: '🤝',
    title: '3. Compartilhamento de Dados',
    content: [
      'Não vendemos nem alugamos seus dados pessoais para terceiros.',
      'Compartilhamos informações apenas com parceiros essenciais para a operação dos serviços, como processadores de pagamento (Mercado Pago) e provedores de infraestrutura (Supabase), sempre sob acordos de confidencialidade e em conformidade com a LGPD.',
    ],
  },
  {
    emoji: '🍪',
    title: '4. Cookies e Rastreamento',
    content: [
      'Utilizamos cookies e tecnologias similares para manter sua sessão ativa, salvar preferências e analisar o tráfego do site de forma agregada e anônima.',
      'Você pode desativar cookies nas configurações do seu navegador, porém algumas funcionalidades da plataforma podem deixar de funcionar corretamente.',
    ],
  },
  {
    emoji: '🔒',
    title: '5. Segurança dos Dados',
    content: [
      'Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado, perda ou destruição.',
      'Todas as comunicações com nossa plataforma são protegidas por criptografia TLS/HTTPS. Senhas são armazenadas com hash seguro e nunca em texto puro. Pagamentos são processados diretamente pelos parceiros certificados, sem que armazenemos dados de cartão.',
    ],
  },
  {
    emoji: '⏱️',
    title: '6. Retenção de Dados',
    content: [
      'Mantemos seus dados enquanto sua conta estiver ativa ou pelo período necessário para cumprir obrigações legais e contábeis.',
      'Links de download ficam disponíveis por 30 dias após a compra. Após esse período, o arquivo pode ser solicitado novamente pelo suporte.',
    ],
  },
  {
    emoji: '⚖️',
    title: '7. Seus Direitos (LGPD)',
    content: [
      'Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem os seguintes direitos:',
    ],
    list: [
      'Confirmar a existência de tratamento de seus dados',
      'Acessar os dados que temos sobre você',
      'Corrigir dados incompletos, inexatos ou desatualizados',
      'Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários',
      'Solicitar a portabilidade dos seus dados',
      'Revogar o consentimento a qualquer momento',
    ],
  },
  {
    emoji: '📅',
    title: '8. Alterações nesta Política',
    content: [
      'Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações relevantes, notificaremos por e-mail ou através de aviso na plataforma.',
      'Recomendamos revisar esta página regularmente. O uso contínuo da plataforma após alterações indica aceitação dos novos termos.',
    ],
  },
];
</script>
