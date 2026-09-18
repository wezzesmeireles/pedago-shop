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
      title: '🚀 Resumo de Atualizações do Sistema — 18/09/2026',
      description: 'Confira em termos práticos tudo o que foi implementado, otimizado e colocado em produção hoje para a equipe:',
      color: 0x5865F2,
      author: {
        name: 'Site Pedagógico • Central de Atualizações',
        icon_url: 'https://www.sitepedagogico.com/favicon.ico',
        url: frontendUrl,
      },
      fields: [
        {
          name: '📊 1. Faturamento e Dashboard Corrigidos',
          value: '• **Cálculo Real do Dia:** Corrigido o faturamento diário para considerar a data de criação do pedido. Pedidos antigos que foram apenas reconciliados hoje não poluem mais o faturamento de hoje.\n• **Carregamento Instantâneo:** Carregamento progressivo em ~150ms sem congelar a tela nem atingir limites da API.\n• **Limpeza Visual:** Todas as tags de teste `(v2)` foram removidas do painel.',
          inline: false,
        },
        {
          name: '🤖 2. Bot Oficial no Discord Ativado',
          value: '• **Integração Nativa:** Conectamos o Bot oficial do Discord com permissões de envio estruturado.\n• **Separação de Canais:**\n  • 🛒 `#notificações-vendas`: Alertas instantâneos de cada pedido e pagamento.\n  • 📢 `#atualizações`: Histórico de melhorias, deploys e comunicados do sistema.',
          inline: false,
        },
        {
          name: '🔘 3. Botões Físicos Interativos',
          value: '• Todas as notificações de vendas agora possuem **botões nativos**:\n  • 🧾 **Ver Pedido:** Vai direto pro pedido no painel de administração.\n  • 👤 **Ver Cliente:** Abre a ficha de cadastro do comprador.\n  • 💬 **WhatsApp:** Inicia conversa com o cliente com mensagem predefinida.\n• **Design Limpo:** Links de texto redundantes foram removidos para manter o visual elegante.',
          inline: false,
        },
        {
          name: '⚡ 4. Alertas Automáticos de Vendas',
          value: '• ⏳ **Novo PIX Gerado:** Dispara assim que o cliente gera o QR Code na tela.\n• 💳 **Checkout no Cartão:** Notifica o início de pagamento com cartão de crédito.\n• 🎁 **Material Gratuito:** Notifica quando um cliente baixa material sem custo.\n• ✅ **Venda Aprovada:** Alerta em verde com valor exato, itens e ID Mercado Pago.',
          inline: false,
        },
        {
          name: '🚀 5. Deploy em Produção',
          value: '• As funções de backend (`create-order`, `mp-webhook`, `reconcile-orders`) foram compiladas e publicadas no Appwrite.\n• Código-fonte sincronizado e publicado no repositório oficial (`main`).',
          inline: false,
        }
      ],
      footer: { text: 'Site Pedagógico • Sistema 100% Operacional' },
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
            label: 'Ver Pedidos',
            url: `${frontendUrl}/admin/pedidos`,
            emoji: { name: '🧾' },
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
