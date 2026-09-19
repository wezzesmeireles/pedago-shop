import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1')
  .setKey(process.env.APPWRITE_API_KEY || 'standard_8a8cbeb93825163f891428794842cbc66f4a794b281c24ca7149627b4b46dea002de70148111cbf9083defdc721d97009e0fad63dece74e7cac3f26c37f4b340cf567feee02533185750e0e16c275eb3ef182d6566fa91659b72cc3acf35e14853d9b08d08a35b4e6a382ca771556605a3bd603dd1972a46152bfe4b88d325d0')

const db = new Databases(client)

async function run() {
  const cfgDoc = await db.getDocument('pedago-db', 'site_config', 'global')
  const siteConfig = JSON.parse(cfgDoc.value)

  const token = siteConfig.discordBotToken
  const channelId = siteConfig.discordUpdatesChannelId || '1550604602066473010'
  const frontendUrl = 'https://www.sitepedagogico.com'

  const payload = {
    content: '📢 **NOVA ATUALIZAÇÃO NO AR — MODO ESCURO NO ADMIN & CORREÇÃO MERCADO PAGO**',
    embeds: [{
      title: '🚀 Atualizações do Sistema — Painel Admin, Pagamentos e UI',
      description: 'Confira as melhorias e correções implementadas e publicadas em produção hoje:',
      color: 0x7C3AED,
      author: {
        name: 'Site Pedagógico • Central de Atualizações',
        icon_url: 'https://www.sitepedagogico.com/favicon.ico',
        url: frontendUrl,
      },
      fields: [
        {
          name: '🌙 1. Dark Mode Completo no Painel Administrativo',
          value: '• **100% das Abas Cobertas:** Dashboard, Produtos, Categorias, Pedidos, Usuários, Suporte, Inscritos, Notificações, Enviar Produto, Customizar, Integrações e Changelog agora contam com tema escuro profissional.\n• **Alternador com 1 Clique:** Botão Sol/Lua com indicador **Escuro / Claro** no topo do painel para alternar entre os temas.\n• **Preferência Salva:** Sua escolha fica salva no navegador (`localStorage`), com o tema escuro vindo ativado por padrão.\n• **Isolamento Seguro:** A loja pública, o carrinho e a área dos alunos permanecem intactos.',
          inline: false,
        },
        {
          name: '💳 2. Geração de QR Code e PIX (Mercado Pago)',
          value: '• **Erro 503 Solucionado:** Identificado e corrigido o problema de autorização nas Cloud Functions de pagamento.\n• **Módulos Prontos:** Garantido o build automático de dependências (`npm install`) nos containers de execução.\n• **Funções Atualizadas:** `create-order`, `reconcile-orders`, `mp-webhook` e `download` recompiladas e validadas com sucesso.',
          inline: false,
        },
        {
          name: '🎨 3. Refinamento Visual e Scrollbar',
          value: '• **Logo sem Fundo Branco:** O fundo branco incômodo da logo no menu lateral do admin foi removido, adotando transparência suave com sombra refinada.\n• **Scrollbars Transparentes:** As barras de rolagem da barra lateral e da navegação foram tratadas com `scrollbar-width: none` e estilo invisível, proporcionando rolagem limpa e moderna.',
          inline: false,
        },
        {
          name: '🎫 4. Suporte Integrado & Solução de Chamados',
          value: '• **Envio Automático ao Dev:** Chamados abertos pelo formulário do Discord são entregues instantaneamente na DM do desenvolvedor.\n• **Botão "Marcar como Solucionado":** O desenvolvedor marca os chamados resolvidos com 1 clique e o bot avisa automaticamente no canal <#1550614015175295047>.',
          inline: false,
        }
      ],
      footer: { text: 'Site Pedagógico • Sistema 100% Operacional em Produção' },
      timestamp: new Date().toISOString(),
    }],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'Painel Admin',
            url: `${frontendUrl}/admin`,
            emoji: { name: '📊' },
          },
          {
            type: 2,
            style: 5,
            label: 'Acessar Loja',
            url: frontendUrl,
            emoji: { name: '🌐' },
          },
          {
            type: 2,
            style: 5,
            label: 'Canal de Suporte',
            url: 'https://discord.com/channels/1336041042578768004/1550614015175295047',
            emoji: { name: '🎫' },
          }
        ]
      }
    ]
  }

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('Erro ao enviar atualização para o Discord:', json)
  } else {
    console.log('✅ Atualização publicada com sucesso no canal #atualizações! ID:', json.id)
  }
}

run().catch(console.error)
