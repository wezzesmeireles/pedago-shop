<template>
  <div class="max-w-3xl">

    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
          <svg class="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
        </div>
        <div>
          <h1 class="text-2xl font-black text-gray-900 tracking-tight">Changelog</h1>
          <p class="text-sm text-gray-400">Histórico de todas as atualizações da plataforma</p>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="relative">
      <!-- Vertical line -->
      <div class="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-violet-200 via-violet-100 to-transparent"></div>

      <div class="space-y-10">
        <div v-for="release in changelog" :key="release.date" class="relative pl-12">

          <!-- Dot -->
          <div :class="['absolute left-0 top-1 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border-2 border-white z-10',
            release.highlight ? 'bg-violet-600' : 'bg-white border-gray-200']">
            <svg v-if="release.highlight" class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>

          <!-- Card -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            <!-- Card header -->
            <div :class="['px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap',
              release.highlight ? 'bg-gradient-to-r from-violet-50 to-white' : '']">
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-black text-gray-900 text-sm">{{ release.version }}</span>
                  <span v-if="release.highlight"
                    class="inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Mais Recente
                  </span>
                </div>
                <p class="text-xs text-gray-400 mt-0.5">{{ release.date }}</p>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span v-for="tag in release.tags" :key="tag" :class="tagClass(tag)">
                  {{ tag }}
                </span>
              </div>
            </div>

            <!-- Changes list -->
            <div class="px-5 py-4 space-y-2">
              <div v-for="change in release.changes" :key="change.text"
                class="flex items-start gap-3 group">
                <span :class="['flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black mt-0.5', typeClass(change.type)]">
                  {{ typeLabel(change.type) }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-700 leading-snug">{{ change.text }}</p>
                  <p v-if="change.detail" class="text-xs text-gray-400 mt-0.5 leading-relaxed">{{ change.detail }}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Change {
  type: 'feat' | 'fix' | 'improve' | 'remove';
  text: string;
  detail?: string;
}

interface Release {
  version: string;
  date: string;
  highlight?: boolean;
  tags: string[];
  changes: Change[];
}

function tagClass(tag: string) {
  const map: Record<string, string> = {
    'Notificações': 'bg-blue-50 text-blue-600 border border-blue-100',
    'Login': 'bg-amber-50 text-amber-600 border border-amber-100',
    'Design': 'bg-pink-50 text-pink-600 border border-pink-100',
    'Downloads': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    'Pedidos': 'bg-violet-50 text-violet-600 border border-violet-100',
    'Email': 'bg-orange-50 text-orange-600 border border-orange-100',
    'Segurança': 'bg-red-50 text-red-600 border border-red-100',
    'Site': 'bg-gray-50 text-gray-600 border border-gray-200',
    'Admin': 'bg-slate-50 text-slate-600 border border-slate-200',
  };
  return `text-[10px] font-bold px-2 py-0.5 rounded-full ${map[tag] ?? 'bg-gray-100 text-gray-500'}`;
}

function typeClass(type: string) {
  const map: Record<string, string> = {
    feat:    'bg-emerald-100 text-emerald-700',
    fix:     'bg-red-100 text-red-600',
    improve: 'bg-blue-100 text-blue-600',
    remove:  'bg-gray-100 text-gray-500',
  };
  return map[type] ?? 'bg-gray-100 text-gray-500';
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    feat:    '+',
    fix:     '✕',
    improve: '↑',
    remove:  '−',
  };
  return map[type] ?? '·';
}

const changelog: Release[] = [
  {
    version: 'v2.7 — 13/04/2026',
    date: '13 de abril de 2026',
    highlight: true,
    tags: ['Pedidos', 'Downloads', 'Design', 'Notificações', 'Login', 'Email'],
    changes: [
      {
        type: 'fix',
        text: 'Downloads duplicados removidos na página Meus Downloads',
        detail: 'Webhook e reconcile-orders criavam múltiplos tokens por item. Agora exibe apenas um por produto, priorizando o mais recente não-revogado.',
      },
      {
        type: 'improve',
        text: 'Página "Meus Pedidos" exibe apenas pedidos pagos',
        detail: 'Cancelados e expirados não aparecem mais na listagem do cliente.',
      },
      {
        type: 'improve',
        text: 'Redesign completo da página "Meus Pedidos"',
        detail: 'Cards com barra colorida por status, resumo com total de compras e total investido, thumbnails dos produtos com preço unitário, pílula de método de pagamento (PIX / Cartão), totalmente responsivo para mobile.',
      },
      {
        type: 'fix',
        text: 'Notificações Telegram chegando para todas as contas cadastradas',
        detail: 'Função reconcile-orders ainda usava o campo antigo telegramChatId (single). Atualizada para ler telegramRecipients (array) igual às demais funções.',
      },
      {
        type: 'improve',
        text: 'Template de email de redefinição de senha personalizado',
        detail: 'Novo design com fundo escuro gradiente, botão roxo com sombra, caixa de aviso e link de fallback.',
      },
      {
        type: 'feat',
        text: 'Página "Esqueci minha senha" criada',
        detail: 'Formulário com email, envia link via Supabase e exibe estado de confirmação com o email utilizado.',
      },
      {
        type: 'feat',
        text: 'Página "Redefinir senha" criada',
        detail: 'Indicador de força de senha (4 níveis), verificação de sessão no carregamento, redireciona para login após sucesso.',
      },
      {
        type: 'improve',
        text: 'Mensagens de erro do login melhoradas',
        detail: 'Usa o código de erro do Supabase (AuthApiError.code) para matching preciso: credenciais inválidas, email não confirmado, captcha, rate limit.',
      },
      {
        type: 'feat',
        text: 'Changelog criado no painel admin',
        detail: 'Histórico versionado de todas as alterações da plataforma, atualizado a cada sessão de desenvolvimento.',
      },
    ],
  },
  {
    version: 'v2.6 — Sessão anterior',
    date: 'Abril 2026',
    highlight: false,
    tags: ['Notificações', 'Site', 'Login', 'Segurança'],
    changes: [
      {
        type: 'feat',
        text: 'Suporte a múltiplas contas Telegram para notificações',
        detail: 'Integrações agora permite adicionar N contas com nome e Chat ID. Cada uma pode ser testada individualmente.',
      },
      {
        type: 'improve',
        text: 'Notificações Telegram enriquecidas com mais detalhes',
        detail: 'Lista de itens, valor total, método de pagamento, email do cliente, data/hora em horário de Brasília, emojis por status.',
      },
      {
        type: 'fix',
        text: 'Notificações Telegram usando HTML em vez de Markdown',
        detail: 'parse_mode alterado para HTML para evitar falhas silenciosas com caracteres especiais.',
      },
      {
        type: 'improve',
        text: 'Botão de suporte WhatsApp visível apenas para usuários logados',
      },
      {
        type: 'fix',
        text: 'Mensagem do WhatsApp usa nome da loja configurável, sem emojis fixos',
      },
      {
        type: 'remove',
        text: 'Seção "Departamentos" removida do rodapé do site',
      },
      {
        type: 'improve',
        text: 'Referências a "entrega por email" substituídas por "download na conta"',
        detail: 'Corrigido em todo o site público para refletir o modelo de entrega digital via plataforma.',
      },
      {
        type: 'feat',
        text: 'Barra de pesquisa e botão de login sempre visíveis no mobile',
      },
      {
        type: 'fix',
        text: 'Pesquisa do catálogo funcionando a partir da busca no header',
        detail: 'CatalogView agora lê o parâmetro busca da URL e reage a mudanças de rota dinamicamente.',
      },
      {
        type: 'feat',
        text: 'Filtro de receita por Dia / Mês / Ano no Dashboard admin',
      },
      {
        type: 'fix',
        text: 'Erro "email rate limit exceeded" no cadastro tratado com fallback',
        detail: 'Se o Supabase atingir o limite de envio de email, tenta logar diretamente com as credenciais informadas.',
      },
    ],
  },
];
</script>
