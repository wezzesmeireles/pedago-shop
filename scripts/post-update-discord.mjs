import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1')
  .setKey(process.env.APPWRITE_API_KEY || 'standard_8a8cbeb93825163f891428794842cbc66f4a794b281c24ca7149627b4b46dea002de70148111cbf9083defdc721d97009e0fad63dece74e7cac3f26c37f4b340cf567feee02533185750e0e16c275eb3ef182d6566fa91659b72cc3acf35e14853d9b08d08a35b4e6a382ca771556605a3bd603dd1972a46152bfe4b88d325d0')

const db = new Databases(client)

async function sendUpdateLog() {
  const cfgDoc = await db.getDocument('pedago-db', 'site_config', 'global')
  const siteConfig = JSON.parse(cfgDoc.value)

  const token = siteConfig.discordBotToken
  const channelId = siteConfig.discordUpdatesChannelId || '1550604602066473010'
  const frontendUrl = process.env.FRONTEND_URL || 'https://www.sitepedagogico.com'

  if (!token) {
    console.error('discordBotToken not found in site_config')
    return
  }

  const payload = {
    content: '📢 **REGISTRO DE ATUALIZAÇÕES — SITE PEDAGÓGICO**',
    embeds: [{
      title: '🚀 Novas Atualizações & Melhorias do Sistema — 29/09/2026',
      description: 'Confira em detalhes todas as implementações, correções visuais e melhorias de suporte técnico aplicadas hoje na plataforma:',
      color: 0x5865F2,
      author: {
        name: 'Site Pedagógico • Central de Atualizações',
        icon_url: 'https://www.sitepedagogico.com/favicon.ico',
        url: frontendUrl,
      },
      fields: [
        {
          name: '🌙 1. Modo Escuro (Dark Mode) no Painel Admin',
          value: '• **Cobertura Total:** Implementado tema escuro completo em todas as abas e componentes da administração (`/admin`), cobrindo Dashboard, Pedidos, Produtos, Categorias, Cupons, Banners, Depoimentos, Reconciliação e Configurações.\n• **Alternador Dinâmico:** Botão seletor no topo (Sol ☀️ / Lua 🌙) com indicador de status Claro/Escuro e salvamento automático das preferências no navegador.\n• **Conforto Visual & Contraste:** Tabelas, cards, filtros, formulários e modais estilizados para máxima legibilidade no uso noturno.',
          inline: false,
        },
        {
          name: '🎨 2. Visual da Logo & Barras de Rolagem Transparentes',
          value: '• **Harmonização da Logo:** Corrigido o fundo da logo na barra lateral da administração para integração fluida tanto no tema claro quanto no escuro.\n• **Scrollbars Transparentes:** Barras de rolagem modernas, discretas e translúcidas em todas as tabelas e painéis do admin, eliminando o aspecto visual pesado padrão do navegador.',
          inline: false,
        },
        {
          name: '🎫 3. Suporte no Discord & Abertura de Chamados Corrigida',
          value: '• **Abertura de Chamados para Todos:** Solucionado o problema onde outros membros não conseguiam abrir chamados no canal <#1550614015175295047>.\n• **Zero Timeouts (< 100ms):** A confirmação do formulário (Modal) agora é instantânea no Discord, eliminando qualquer risco da mensagem "Esta interação falhou".\n• **Fallback no Chat:** Ao digitar qualquer mensagem no canal de suporte, o bot responde marcando o usuário com instruções e o botão **Abrir Ticket** na hora.\n• **Novo Painel Fixado:** Publicado e fixado novo painel oficial de atendimento com botões interativos.',
          inline: false,
        },
        {
          name: '💳 4. Estabilidade no Checkout & Mercado Pago',
          value: '• Otimização e resiliência na geração do QR Code Pix e tratamento de retornos de pagamento.',
          inline: false,
        }
      ],
      footer: { text: 'Site Pedagógico • Sistema 100% Operacional e Atualizado' },
      timestamp: new Date().toISOString(),
    }],
    components: [
      {
        type: 1,
        components: [
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
            label: 'Painel Admin',
            url: `${frontendUrl}/admin`,
            emoji: { name: '📊' },
          },
          {
            type: 2,
            style: 5,
            label: 'Ver Chamados (#suporte)',
            url: `https://discord.com/channels/1550601013856047127/1550614015175295047`,
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

  console.log('Update log sent to #atualizações! Status:', res.status)
}

sendUpdateLog().catch(console.error)
