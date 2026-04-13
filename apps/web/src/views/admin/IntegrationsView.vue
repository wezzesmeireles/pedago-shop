<template>
  <div class="max-w-3xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-xl font-bold text-slate-900">Integrações</h1>
      <p class="text-sm text-slate-500 mt-0.5">Configure as chaves de API dos serviços de pagamento</p>
    </div>

    <!-- Tutorial -->
    <div class="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-5 mb-6">
      <div class="flex items-center gap-2">
        <svg class="w-5 h-5 text-violet-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <h2 class="font-semibold text-violet-900">Tutorial de Integração</h2>
        <button @click="tutorialOpen = !tutorialOpen" class="ml-auto text-violet-600 hover:text-violet-800 text-sm font-medium transition-colors">
          {{ tutorialOpen ? 'Ocultar' : 'Ver tutorial' }}
        </button>
      </div>

      <div v-if="tutorialOpen" class="mt-5 space-y-6">
        <!-- Mercado Pago tutorial -->
        <div>
          <h3 class="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-sky-500 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">MP</span>
            Configurar Mercado Pago PIX
          </h3>
          <ol class="space-y-3 text-sm text-slate-700">
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <div>Acesse <span class="font-medium text-violet-700">mercadopago.com.br</span> e faça login na sua conta.</div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <div>Vá em <span class="font-medium">Seu negócio → Configurações → Credenciais</span>.</div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                Em <span class="font-medium">Credenciais de produção</span>, copie o <span class="font-medium text-violet-700">Access Token</span> (começa com <code class="bg-white px-1 rounded text-xs">APP_USR-</code>).
                <p class="text-xs text-slate-500 mt-1">Para testes, use as credenciais de teste (começa com <code class="bg-white px-1 rounded text-xs">TEST-</code>).</p>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
              <div>Cole o token no campo <span class="font-medium">Access Token</span> abaixo e salve.</div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">5</span>
              <div>
                <span class="font-medium">Configure o Webhook</span> para receber notificações de pagamento:
                <ul class="mt-2 space-y-1 ml-1">
                  <li class="text-xs text-slate-600">• No Painel MP → Webhooks → Criar</li>
                  <li class="text-xs text-slate-600">• URL: <code class="bg-white px-1 rounded">{{ apiUrl }}</code></li>
                  <li class="text-xs text-slate-600">• Eventos: marque <span class="font-medium">Pagamentos</span></li>
                  <li class="text-xs text-slate-600">• Copie o <span class="font-medium">Secret</span> gerado para o campo Webhook Secret abaixo</li>
                </ul>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">✓</span>
              <div>Pronto! O QR Code PIX será gerado automaticamente a cada pedido.</div>
            </li>
          </ol>
          <div class="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span><strong>Em produção:</strong> O servidor precisa ter um endereço público acessível para o webhook funcionar.</span>
          </div>
        </div>

        <hr class="border-violet-100" />

        <!-- Google OAuth tutorial -->
        <div>
          <h3 class="font-semibold text-slate-900 flex items-center gap-2 mb-3">
            <span class="w-6 h-6 border border-slate-200 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </span>
            Configurar Login com Google
          </h3>
          <ol class="space-y-3 text-sm text-slate-700">
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <div>Acesse <span class="font-medium text-violet-700">console.cloud.google.com</span> e crie um projeto.</div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <div>Vá em <span class="font-medium">APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth</span>.</div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <div>Tipo de aplicativo: <span class="font-medium">Aplicativo da Web</span>.</div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-violet-100 text-violet-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
              <div>
                Em <span class="font-medium">URIs de redirecionamento autorizados</span>, adicione:
                <code class="block bg-white border border-slate-200 rounded-lg px-3 py-1.5 mt-1 text-xs break-all">https://[seu-projeto].supabase.co/auth/v1/callback</code>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">!</span>
              <div>Salve aqui e <span class="font-medium">reinicie o servidor API</span> para as credenciais entrarem em vigor.</div>
            </li>
          </ol>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full"></div>
    </div>

    <div v-else class="space-y-4">
      <!-- Mercado Pago -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 flex-wrap gap-y-2">
          <div class="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-slate-900">Mercado Pago</h2>
            <p class="text-xs text-slate-500">Pagamentos via PIX e Cartão de Crédito</p>
          </div>
          <div class="ml-auto">
            <span :class="['text-xs px-2.5 py-1 rounded-full font-semibold', form.mercadoPagoAccessToken ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
              {{ form.mercadoPagoAccessToken ? 'Configurado' : 'Não configurado' }}
            </span>
          </div>
        </div>

        <div class="p-4 sm:p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Access Token
              <span class="ml-1 text-[10px] text-slate-400 font-normal normal-case tracking-normal">(obrigatório para processar pagamentos)</span>
            </label>
            <div class="relative">
              <input v-model="form.mercadoPagoAccessToken" :type="showMpToken ? 'text' : 'password'"
                placeholder="APP_USR-xxxx... ou TEST-xxxx..."
                class="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono" />
              <button @click="showMpToken = !showMpToken" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg v-if="showMpToken" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-slate-400">Use o token de produção (APP_USR-...) ou de teste (TEST-...) para testes.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Chave PIX</label>
              <input v-model="form.mercadoPagoPixKey" type="text" placeholder="CPF, e-mail ou chave aleatória"
                class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Webhook Secret</label>
              <div class="relative">
                <input v-model="form.mercadoPagoWebhookSecret" :type="showWebhookSecret ? 'text' : 'password'"
                  placeholder="Segredo do webhook MP"
                  class="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono" />
                <button @click="showWebhookSecret = !showWebhookSecret" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  <svg v-if="showWebhookSecret" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-sky-50 rounded-xl p-3 flex gap-2 text-xs text-sky-700">
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Configure o webhook no painel do Mercado Pago apontando para:<br><code class="block bg-sky-100 px-2 py-1 mt-1 rounded font-mono break-all">{{ apiUrl }}</code></span>
          </div>
        </div>
      </div>

      <!-- Telegram Bot -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 flex-wrap gap-y-2">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style="background:#229ED9">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.013 9.484c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.876.737z"/>
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-slate-900">Telegram</h2>
            <p class="text-xs text-slate-500">Notificações de vendas pelo bot</p>
          </div>
          <div class="ml-auto">
            <span :class="['text-xs px-2.5 py-1 rounded-full font-semibold', form.telegramBotToken && form.telegramRecipients.length ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500']">
              {{ form.telegramBotToken && form.telegramRecipients.length ? `${form.telegramRecipients.length} destinatário${form.telegramRecipients.length > 1 ? 's' : ''}` : 'Não configurado' }}
            </span>
          </div>
        </div>

        <div class="p-4 sm:p-6 space-y-4">
          <!-- Tutorial inline -->
          <div class="bg-sky-50 border border-sky-100 rounded-xl p-4 text-sm text-sky-800 space-y-2">
            <p class="font-semibold flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Como configurar
            </p>
            <ol class="space-y-1 text-xs text-sky-700 list-decimal list-inside">
              <li>No Telegram, abra o <strong>@BotFather</strong> e envie <code class="bg-sky-100 px-1 rounded">/newbot</code></li>
              <li>Siga as instruções e copie o <strong>Token</strong> gerado</li>
              <li>Adicione o bot ao seu grupo ou abra uma conversa direta com ele</li>
              <li>Envie qualquer mensagem ao bot/grupo, depois acesse:<br><code class="bg-sky-100 px-1 rounded break-all">https://api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</code></li>
              <li>Copie o <strong>chat.id</strong> do resultado (pode ser negativo em grupos)</li>
            </ol>
          </div>

          <!-- Bot Token -->
          <div>
            <label class="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Bot Token</label>
            <div class="relative">
              <input v-model="form.telegramBotToken" :type="showTgToken ? 'text' : 'password'"
                placeholder="123456789:AAF..."
                class="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono" />
              <button @click="showTgToken = !showTgToken" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg v-if="showTgToken" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
          </div>

          <!-- Recipients list -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-semibold text-slate-600 uppercase tracking-wide">Destinatários</label>
              <button @click="addRecipient"
                class="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 px-2.5 py-1 rounded-lg hover:bg-violet-50 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                Adicionar
              </button>
            </div>

            <div class="space-y-2">
              <div v-if="form.telegramRecipients.length === 0"
                class="text-center py-5 text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                Nenhum destinatário. Clique em "Adicionar" para incluir.
              </div>

              <div v-for="(r, i) in form.telegramRecipients" :key="r.id"
                class="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <!-- Name -->
                <input v-model="r.name" type="text" placeholder="Nome (ex: Admin, Sócia...)"
                  class="w-32 sm:w-40 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent flex-shrink-0" />
                <!-- Chat ID -->
                <input v-model="r.chatId" type="text" placeholder="Chat ID"
                  class="flex-1 min-w-0 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent" />
                <!-- Test -->
                <button @click="testRecipient(r)" :disabled="!form.telegramBotToken || !r.chatId || r.testing"
                  class="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-sky-300 text-sky-600 hover:bg-sky-50 transition-all disabled:opacity-40"
                  title="Testar este destinatário">
                  <svg v-if="r.testing" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  <svg v-else class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.013 9.484c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.876.737z"/></svg>
                  <span class="hidden sm:inline">{{ r.testing ? 'Enviando' : 'Testar' }}</span>
                </button>
                <!-- Test result -->
                <Transition name="fade-save">
                  <span v-if="r.testResult" :class="['text-xs font-medium flex-shrink-0', r.testResult === 'ok' ? 'text-emerald-600' : 'text-red-500']">
                    {{ r.testResult === 'ok' ? '✓ OK' : '✗ Erro' }}
                  </span>
                </Transition>
                <!-- Remove -->
                <button @click="removeRecipient(i)"
                  class="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remover">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <p class="mt-1.5 text-xs text-slate-400">Cada destinatário recebe todas as notificações de venda.</p>
          </div>
        </div>
      </div>

      <!-- Google OAuth -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 flex-wrap gap-y-2">
          <div class="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-slate-900">Google OAuth</h2>
            <p class="text-xs text-slate-500">Login com conta Google</p>
          </div>
          <span class="ml-auto text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">Supabase Auth</span>
        </div>
        <div class="p-4 sm:p-6">
          <div class="bg-violet-50 rounded-xl p-4 flex gap-3 text-sm text-violet-700">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p class="font-semibold mb-1">Configurado via Supabase Auth</p>
              <p class="text-xs text-violet-600">O Google OAuth é configurado diretamente no painel do Supabase em <strong>Authentication → Providers → Google</strong>. Não requer configuração aqui.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <Transition name="fade-save">
          <p v-if="savedAt" class="text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Salvo com sucesso
          </p>
          <div v-else></div>
        </Transition>
        <button @click="save" :disabled="saving"
          class="inline-flex items-center justify-center gap-2 bg-violet-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm disabled:opacity-60 w-full sm:w-auto">
          <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
          {{ saving ? 'Salvando...' : 'Salvar Configurações' }}
        </button>
      </div>

      <p v-if="error" class="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';

const loading = ref(true);
const saving = ref(false);
const savedAt = ref(false);
const error = ref('');
const tutorialOpen = ref(true);
const showMpToken = ref(false);
const showWebhookSecret = ref(false);
const showTgToken = ref(false);
const testingTg = ref(false);

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const apiUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

interface TgRecipient { id: string; name: string; chatId: string; testing?: boolean; testResult?: string }

const form = ref({
  mercadoPagoAccessToken: '',
  mercadoPagoPixKey: '',
  mercadoPagoWebhookSecret: '',
  telegramBotToken: '',
  telegramRecipients: [] as TgRecipient[],
});

function addRecipient() {
  form.value.telegramRecipients.push({ id: crypto.randomUUID(), name: '', chatId: '', testing: false, testResult: '' });
}

function removeRecipient(i: number) {
  form.value.telegramRecipients.splice(i, 1);
}

async function testRecipient(r: TgRecipient) {
  r.testing = true;
  r.testResult = '';
  try {
    const res = await fetch(`https://api.telegram.org/bot${form.value.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: r.chatId,
        text: `✅ *Teste de notificação*\n\nOlá${r.name ? ', ' + r.name : ''}! O bot está configurado corretamente.`,
        parse_mode: 'Markdown',
      }),
    });
    const json = await res.json();
    r.testResult = json.ok ? 'ok' : 'erro';
  } catch {
    r.testResult = 'erro';
  } finally {
    r.testing = false;
    setTimeout(() => (r.testResult = ''), 4000);
  }
}

onMounted(async () => {
  try {
    const { data } = await supabase.from('site_config').select('value').eq('key', 'global').single();
    if (data?.value) {
      const v = data.value as any;
      form.value.mercadoPagoAccessToken = v.mercadoPagoAccessToken ?? '';
      form.value.mercadoPagoPixKey = v.mercadoPagoPixKey ?? '';
      form.value.mercadoPagoWebhookSecret = v.mercadoPagoWebhookSecret ?? '';
      form.value.telegramBotToken = v.telegramBotToken ?? '';
      // migrate old single chatId to recipients list
      if (v.telegramRecipients?.length) {
        form.value.telegramRecipients = v.telegramRecipients.map((r: any) => ({ ...r, testing: false, testResult: '' }));
      } else if (v.telegramChatId) {
        form.value.telegramRecipients = [{ id: crypto.randomUUID(), name: 'Admin', chatId: v.telegramChatId, testing: false, testResult: '' }];
      }
    }
  } catch {
    // use defaults
  } finally {
    loading.value = false;
  }
});

async function save() {
  saving.value = true;
  error.value = '';
  savedAt.value = false;
  try {
    const { data: existing } = await supabase.from('site_config').select('value').eq('key', 'global').single();
    const current = (existing?.value as any) ?? {};
    const merged = {
      ...current,
      mercadoPagoAccessToken: form.value.mercadoPagoAccessToken,
      mercadoPagoPixKey: form.value.mercadoPagoPixKey,
      mercadoPagoWebhookSecret: form.value.mercadoPagoWebhookSecret,
      telegramBotToken: form.value.telegramBotToken,
      telegramRecipients: form.value.telegramRecipients.map(({ id, name, chatId }) => ({ id, name, chatId })),
    };
    await supabase.from('site_config').upsert(
      { key: 'global', value: merged, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
    savedAt.value = true;
    setTimeout(() => (savedAt.value = false), 3000);
  } catch {
    error.value = 'Erro ao salvar. Tente novamente.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.fade-save-enter-active, .fade-save-leave-active { transition: opacity 0.3s; }
.fade-save-enter-from, .fade-save-leave-to { opacity: 0; }
</style>
