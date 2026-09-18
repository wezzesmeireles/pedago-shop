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
    content: '📢 **NOVA ATUALIZAÇÃO NO AR — SISTEMA DE SUPORTE & TICKETS TÉCNICOS**',
    embeds: [{
      title: '🛠️ Central de Suporte, Tickets e Relatórios Automatizados',
      description: 'Implementamos e disponibilizamos para toda a equipe uma infraestrutura completa de suporte técnico e resolução de bugs direto pelo Discord!',
      color: 0x10B981,
      author: {
        name: 'Site Pedagógico • Central de Atualizações',
        icon_url: 'https://www.sitepedagogico.com/favicon.ico',
        url: frontendUrl,
      },
      fields: [
        {
          name: '🎫 1. Canal #suporte com Botão Interativo',
          value: '• Criamos o canal <#1550614015175295047> com um painel fixo de atendimento.\n• Botão verde **`🎫 Abrir Ticket`** que abre um formulário nativo na tela do Discord para preenchimento de bugs ou solicitações.\n• Também aceita mensagens normais digitadas no chat.',
          inline: false,
        },
        {
          name: '🤖 2. Confirmação Instantânea de Chamados',
          value: '• Cada chamado recebe um protocolo numerado oficial (ex: `#SUP-2026-001`).\n• O bot responde na hora para todos: **`Pedido adicionado para o desenvolvedor`** com status `PENDENTE`.',
          inline: false,
        },
        {
          name: '🔒 3. Prompt de Correção Privado no DM do Desenvolvedor',
          value: '• Ao final do dia (ou via botão **Gerar Relatório do Dia**), o bot compila todos os bugs.\n• O **Prompt Técnico de Correção** pronto para ser colado na IA/Dev é entregue **diretamente no privado do desenvolvedor (@weslay3663)** com sigilo e segurança.',
          inline: false,
        },
        {
          name: '✅ 4. Resolução Oficial com Retorno Automático no Suporte',
          value: '• O desenvolvedor recebe no seu privado o botão verde **`✅ Marcar Chamados como Solucionados`**.\n• Ao clicar, o bot atualiza o banco de dados e dispara no canal <#1550614015175295047> o comunicado oficial confirmando que os problemas foram corrigidos e estão aplicados em produção!',
          inline: false,
        }
      ],
      footer: { text: 'Site Pedagógico • Atualizações em Produção' },
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

  console.log('Update posted to #atualizações! Status:', res.status)
}

run().catch(console.error)
