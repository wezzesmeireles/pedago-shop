<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-bold text-gray-900 mb-2">Integrações</h1>
    <p class="text-gray-500 text-sm mb-8">Configure as chaves de API dos serviços de pagamento e autenticação.</p>

    <!-- Tutorial -->
    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6 mb-6">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <h2 class="font-semibold text-indigo-900">Tutorial de Integração</h2>
        <button @click="tutorialOpen = !tutorialOpen" class="ml-auto text-indigo-500 hover:text-indigo-700 text-sm font-medium">
          {{ tutorialOpen ? 'Ocultar' : 'Ver tutorial' }}
        </button>
      </div>

      <div v-if="tutorialOpen" class="space-y-6 mt-2">

        <!-- Mercado Pago tutorial -->
        <div>
          <h3 class="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <span class="w-6 h-6 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">MP</span>
            Configurar Mercado Pago PIX
          </h3>
          <ol class="space-y-3 text-sm text-gray-700">
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                Acesse <span class="font-medium text-indigo-700">mercadopago.com.br</span> e faça login na sua conta.
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                Vá em <span class="font-medium">Seu negócio → Configurações → Credenciais</span>.
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                Em <span class="font-medium">Credenciais de produção</span>, copie o <span class="font-medium text-indigo-700">Access Token</span> (começa com <code class="bg-white px-1 rounded text-xs">APP_USR-</code>).
                <p class="text-xs text-gray-500 mt-1">Para testes, use as <span class="font-medium">Credenciais de teste</span> (começa com <code class="bg-white px-1 rounded text-xs">TEST-</code>).</p>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
              <div>
                Cole o token no campo <span class="font-medium">Access Token</span> abaixo e salve.
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">5</span>
              <div>
                <span class="font-medium">Configure o Webhook</span> para receber notificações de pagamento aprovado:
                <ul class="mt-2 space-y-1 ml-1">
                  <li class="text-xs text-gray-600">• No Painel MP → Webhooks → Criar</li>
                  <li class="text-xs text-gray-600">• URL: <code class="bg-white px-1 rounded">{{ apiUrl }}</code></li>
                  <li class="text-xs text-gray-600">• Eventos: marque <span class="font-medium">Pagamentos</span></li>
                  <li class="text-xs text-gray-600">• Copie o <span class="font-medium">Secret</span> gerado para o campo Webhook Secret abaixo</li>
                </ul>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">✓</span>
              <div>
                Pronto! O QR Code PIX será gerado automaticamente a cada pedido. O pedido é confirmado assim que o Mercado Pago notifica via webhook.
              </div>
            </li>
          </ol>

          <div class="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <span>
              <strong>Atenção em produção:</strong> O servidor precisa ter um endereço público acessível para o webhook funcionar. Em desenvolvimento local, use <a href="https://ngrok.com" target="_blank" class="underline">ngrok</a> ou similar para expor a porta 3000.
            </span>
          </div>
        </div>

        <hr class="border-indigo-100" />

        <!-- Google OAuth tutorial -->
        <div>
          <h3 class="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <span class="w-6 h-6 border border-gray-200 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            </span>
            Configurar Login com Google
          </h3>
          <ol class="space-y-3 text-sm text-gray-700">
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                Acesse <span class="font-medium text-indigo-700">console.cloud.google.com</span> e crie um projeto (ou use um existente).
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                Vá em <span class="font-medium">APIs e Serviços → Credenciais → Criar credenciais → ID do cliente OAuth</span>.
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                Tipo de aplicativo: <span class="font-medium">Aplicativo da Web</span>.
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">4</span>
              <div>
                Em <span class="font-medium">URIs de redirecionamento autorizados</span>, adicione:
                <code class="block bg-white border border-gray-200 rounded-lg px-3 py-1.5 mt-1 text-xs">https://[seu-projeto].supabase.co/auth/v1/callback</code>
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">5</span>
              <div>
                Copie o <span class="font-medium">Client ID</span> e o <span class="font-medium">Client Secret</span> e cole nos campos abaixo.
              </div>
            </li>
            <li class="flex gap-3">
              <span class="w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">!</span>
              <div>
                Salve aqui e <span class="font-medium">reinicie o servidor API</span> para as credenciais entrarem em vigor.
              </div>
            </li>
          </ol>
        </div>

      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
    </div>

    <div v-else class="space-y-6">
      <!-- Mercado Pago -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-gray-900">Mercado Pago</h2>
            <p class="text-xs text-gray-500">Pagamentos via PIX e Cartão de Crédito</p>
          </div>
          <div class="ml-auto">
            <span :class="['text-xs px-2.5 py-1 rounded-full font-medium', form.mercadoPagoAccessToken ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500']">
              {{ form.mercadoPagoAccessToken ? 'Configurado' : 'Não configurado' }}
            </span>
          </div>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              Access Token
              <span class="ml-1 text-xs text-gray-400 font-normal">(obrigatório para processar pagamentos)</span>
            </label>
            <div class="relative">
              <input
                v-model="form.mercadoPagoAccessToken"
                :type="showMpToken ? 'text' : 'password'"
                placeholder="APP_USR-xxxx... ou TEST-xxxx..."
                class="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
              <button @click="showMpToken = !showMpToken" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg v-if="showMpToken" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              </button>
            </div>
            <p class="mt-1 text-xs text-gray-400">Use o token de produção (APP_USR-...) para pagamentos reais ou o de teste (TEST-...) para testes.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Chave PIX</label>
              <input
                v-model="form.mercadoPagoPixKey"
                type="text"
                placeholder="CPF, e-mail ou chave aleatória"
                class="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1.5">Webhook Secret</label>
              <div class="relative">
                <input
                  v-model="form.mercadoPagoWebhookSecret"
                  :type="showWebhookSecret ? 'text' : 'password'"
                  placeholder="Segredo do webhook MP"
                  class="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                />
                <button @click="showWebhookSecret = !showWebhookSecret" type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg v-if="showWebhookSecret" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="bg-blue-50 rounded-xl p-3 flex gap-2 text-xs text-blue-700">
            <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>Configure o webhook no painel do Mercado Pago apontando para a Edge Function: <code class="bg-blue-100 px-1 rounded">{{ apiUrl }}</code></span>
          </div>
        </div>
      </div>

      <!-- Google OAuth -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div class="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <div>
            <h2 class="font-semibold text-gray-900">Google OAuth</h2>
            <p class="text-xs text-gray-500">Login com conta Google</p>
          </div>
        </div>
        <div class="p-6">
          <div class="bg-blue-50 rounded-xl p-4 flex gap-3 text-sm text-blue-700">
            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p class="font-medium mb-1">Configurado via Supabase Auth</p>
              <p class="text-xs text-blue-600">O Google OAuth é configurado diretamente no painel do Supabase em <strong>Authentication → Providers → Google</strong>. Não requer configuração aqui.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save button -->
      <div class="flex items-center justify-between">
        <p v-if="savedAt" class="text-sm text-green-600 flex items-center gap-1.5">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          Salvo com sucesso
        </p>
        <div v-else></div>
        <button @click="save" :disabled="saving" class="btn-primary px-8 py-2.5 text-sm">
          <svg v-if="saving" class="animate-spin mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ saving ? 'Salvando...' : 'Salvar Configurações' }}
        </button>
      </div>

      <p v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{{ error }}</p>
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

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const apiUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

const form = ref({
  mercadoPagoAccessToken: '',
  mercadoPagoPixKey: '',
  mercadoPagoWebhookSecret: '',
});

onMounted(async () => {
  try {
    const { data } = await supabase.from('site_config').select('value').eq('key', 'integrations').single();
    if (data?.value) Object.assign(form.value, data.value);
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
    await supabase.from('site_config').upsert({ key: 'integrations', value: form.value, updated_at: new Date().toISOString() });
    savedAt.value = true;
    setTimeout(() => (savedAt.value = false), 3000);
  } catch (e: any) {
    error.value = 'Erro ao salvar. Tente novamente.';
  } finally {
    saving.value = false;
  }
}
</script>
