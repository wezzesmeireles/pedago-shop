import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1')
  .setKey(process.env.APPWRITE_API_KEY || 'standard_8a8cbeb93825163f891428794842cbc66f4a794b281c24ca7149627b4b46dea002de70148111cbf9083defdc721d97009e0fad63dece74e7cac3f26c37f4b340cf567feee02533185750e0e16c275eb3ef182d6566fa91659b72cc3acf35e14853d9b08d08a35b4e6a382ca771556605a3bd603dd1972a46152bfe4b88d325d0')

const db = new Databases(client)

async function getConfig() {
  const cfgDoc = await db.getDocument('pedago-db', 'site_config', 'global')
  const siteConfig = JSON.parse(cfgDoc.value)
  return {
    token: siteConfig.discordBotToken || process.env.DISCORD_BOT_TOKEN,
    supportChannelId: siteConfig.discordSupportChannelId || '1550614015175295047',
    developerUserId: siteConfig.discordDeveloperUserId || '411221099506958336',
    frontendUrl: process.env.FRONTEND_URL || 'https://www.sitepedagogico.com',
    botUserId: '1550608671275352304'
  }
}

function dtBR(iso) {
  try { return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) }
  catch { return iso }
}

async function getStoredTickets() {
  try {
    const doc = await db.getDocument('pedago-db', 'site_config', 'support_tickets')
    return JSON.parse(doc.value || '[]')
  } catch (err) {
    if (err.code === 404) {
      try {
        await db.createDocument('pedago-db', 'site_config', 'support_tickets', {
          key: 'support_tickets',
          value: JSON.stringify([])
        })
      } catch {}
    }
    return []
  }
}

async function saveTicket(ticket) {
  const tickets = await getStoredTickets()
  tickets.push(ticket)
  try {
    await db.updateDocument('pedago-db', 'site_config', 'support_tickets', {
      value: JSON.stringify(tickets)
    })
  } catch (err) {
    console.error('Failed to persist ticket:', err.message)
  }
}

async function sendDM(token, userId, payload) {
  try {
    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ recipient_id: userId })
    })
    const dmChannel = await dmRes.json()
    if (!dmChannel.id) {
      console.error('Could not open DM channel with user:', userId, dmChannel)
      return false
    }

    const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    return msgRes.ok
  } catch (err) {
    console.error('Error sending DM:', err.message)
    return false
  }
}

async function handleMessage(msg, cfg) {
  if (!msg || !msg.id || msg.author?.id === cfg.botUserId) return
  if (msg.channel_id !== cfg.supportChannelId) return

  let content = (msg.content || '').trim()

  // Se o conteúdo veio vazio do Gateway, busca a mensagem completa via REST
  if (!content) {
    try {
      const fullRes = await fetch(`https://discord.com/api/v10/channels/${cfg.supportChannelId}/messages/${msg.id}`, {
        headers: { 'Authorization': `Bot ${cfg.token}` }
      })
      const fullMsg = await fullRes.json()
      content = (fullMsg.content || '').trim()
    } catch {}
  }

  if (!content) return

  console.log(`[#suporte] ${msg.author.username}: ${content}`)

  const lower = content.toLowerCase()

  // Verifica se é pedido de relatório
  if (
    lower === '!relatorio' ||
    lower === '!relatório' ||
    lower.includes('gerar relatorio') ||
    lower.includes('gerar relatório') ||
    lower === 'relatorio' ||
    lower === 'relatório'
  ) {
    await generateDailyReport(cfg, msg.id)
    return
  }

  // É um bug ou pedido de suporte
  const nowIso = new Date().toISOString()
  const tickets = await getStoredTickets()
  const ticketNum = String(tickets.length + 1).padStart(3, '0')
  const ticketId = `SUP-${new Date().getFullYear()}-${ticketNum}`

  const newTicket = {
    id: ticketId,
    messageId: msg.id,
    author: msg.author.username,
    authorId: msg.author.id,
    content: content,
    createdAt: nowIso,
    status: 'PENDENTE',
  }

  await saveTicket(newTicket)

  // Responde imediatamente no canal
  await fetch(`https://discord.com/api/v10/channels/${cfg.supportChannelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: 'Pedido adicionado para o desenvolvedor',
      message_reference: { message_id: msg.id },
      embeds: [{
        title: `📌 Chamado Registrado — #${ticketId}`,
        description: `Olá **${msg.author.username}**, o seu pedido/bug foi registrado e adicionado à fila para o desenvolvedor.`,
        color: 0x3B82F6,
        fields: [
          { name: '📝 Descrição do Bug', value: `>>> ${content.slice(0, 900)}`, inline: false },
          { name: '👤 Solicitante', value: `<@${msg.author.id}>`, inline: true },
          { name: '⏳ Status', value: '`PENDENTE PARA O DEV`', inline: true },
          { name: '🕒 Registrado em', value: dtBR(nowIso), inline: true },
        ],
        footer: { text: 'Site Pedagógico • Suporte Técnico' },
        timestamp: nowIso,
      }],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: 'Painel Admin',
              url: `${cfg.frontendUrl}/admin`,
              emoji: { name: '📊' },
            },
            {
              type: 2,
              style: 5,
              label: 'Ver Site',
              url: cfg.frontendUrl,
              emoji: { name: '🌐' },
            }
          ]
        }
      ]
    })
  })
}

async function generateDailyReport(cfg, triggerMessageId = null) {
  if (!cfg) cfg = await getConfig()
  const tickets = await getStoredTickets()
  const today = new Date().toISOString().slice(0, 10)

  // Filtra tickets de hoje
  const todayTickets = tickets.filter(t => t.createdAt && t.createdAt.startsWith(today))

  if (todayTickets.length === 0) {
    await fetch(`https://discord.com/api/v10/channels/${cfg.supportChannelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${cfg.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: `📊 **RELATÓRIO DE SUPORTE DO DIA (${dtBR(new Date().toISOString()).slice(0, 10)})**\n\nNenhum bug ou suporte pendente registrado hoje! O sistema está funcionando 100%. 🎉`,
        ...(triggerMessageId ? { message_reference: { message_id: triggerMessageId } } : {})
      })
    })
    return
  }

  // 1. Resumo público no canal #suporte
  const ticketListSummary = todayTickets.map((t, idx) => {
    return `**${idx + 1}. [${t.id}]** por **@${t.author}** às ${dtBR(t.createdAt).split(' ')[1]}\n> ⚠️ *${t.content}*`
  }).join('\n\n')

  await fetch(`https://discord.com/api/v10/channels/${cfg.supportChannelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${cfg.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: `📊 **RELATÓRIO DIÁRIO DE SUPORTE & BUGS (${dtBR(new Date().toISOString()).slice(0, 10)})**\nTotal de chamados de hoje: **${todayTickets.length}**`,
      ...(triggerMessageId ? { message_reference: { message_id: triggerMessageId } } : {}),
      embeds: [{
        title: `📋 Resumo dos Chamados de Hoje`,
        description: ticketListSummary.slice(0, 4000),
        color: 0xEF4444,
        fields: [
          {
            name: '🔒 Envio Seguro do Prompt',
            value: `O **Prompt Técnico de Correção** com as instruções e códigos para consertar esses bugs foi gerado e enviado **diretamente no privado do Desenvolvedor** (<@${cfg.developerUserId}>).`,
            inline: false
          }
        ],
        footer: { text: 'Site Pedagógico • Suporte Técnico' },
        timestamp: new Date().toISOString()
      }]
    })
  })

  // 2. Monta o Prompt de Correção completo para a IA / Desenvolvedor
  const promptText = [
    `# PROMPT DE CORREÇÃO DE BUGS — SITE PEDAGÓGICO (${dtBR(new Date().toISOString()).slice(0, 10)})`,
    ``,
    `Você é o desenvolvedor responsável pela plataforma Site Pedagógico (Vue 3, Tailwind, Appwrite).`,
    `Hoje foram abertos ${todayTickets.length} chamado(s) de suporte/bugs pela equipe através do Discord.`,
    ``,
    `## 📋 LISTA DE PROBLEMAS REPORTADOS HOJE:`,
    ...todayTickets.map((t, i) => `${i + 1}. [${t.id}] ${t.content}\n   - Autor: ${t.author} | Horário: ${dtBR(t.createdAt)}`),
    ``,
    `## 🛠️ INSTRUÇÕES DE EXECUÇÃO:`,
    `1. Analise a descrição de cada bug acima.`,
    `2. Localize os arquivos pertinentes no repositório (frontend apps/web ou funções Appwrite).`,
    `3. Reproduza o cenário e elabore o plano de correção.`,
    `4. Aplique as correções mantendo a estabilidade e execute build/testes.`,
    `5. Após corrigir, atualize o status dos chamados para RESOLVIDO.`
  ].join('\n')

  const promptBlock = `\`\`\`markdown\n${promptText.slice(0, 1900)}\n\`\`\``

  // 3. Envia no PRIVADO (DM) do desenvolvedor
  await sendDM(cfg.token, cfg.developerUserId, {
    content: `🚨 **PROMPT DE CORREÇÃO DO DIA — SITE PEDAGÓGICO (${dtBR(new Date().toISOString()).slice(0, 10)})**\n\nOlá desenvolvedor! Foram registrados **${todayTickets.length}** chamado(s) de suporte hoje. Abaixo está o seu prompt pronto para copiar e colar para o assistente/IA:`,
    embeds: [{
      title: '🛠️ Relatório Técnico Privado do Desenvolvedor',
      description: ticketListSummary.slice(0, 3000),
      color: 0x5865F2,
      footer: { text: 'Site Pedagógico • Entrega Privada do Desenvolvedor' },
      timestamp: new Date().toISOString()
    }]
  })

  await sendDM(cfg.token, cfg.developerUserId, {
    content: promptBlock
  })

  console.log('Daily report sent to #suporte and private DM sent to developer successfully!')
}

async function startListener() {
  const cfg = await getConfig()
  console.log('Iniciando listener do Bot para o canal #suporte...')
  console.log('Developer ID:', cfg.developerUserId, '| Suporte Channel:', cfg.supportChannelId)

  const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json')

  let heartbeatInterval = 41250
  let timer = null

  ws.onopen = () => console.log('Conectado ao Gateway Discord com sucesso!')
  ws.onmessage = async (event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload.op === 10) {
        heartbeatInterval = payload.d.heartbeat_interval
        timer = setInterval(() => ws.send(JSON.stringify({ op: 1, d: null })), heartbeatInterval)
        ws.send(JSON.stringify({
          op: 2,
          d: {
            token: cfg.token,
            intents: 513, // Guilds + Guild Messages
            properties: { os: 'windows', browser: 'sitepedagogico', device: 'sitepedagogico' }
          }
        }))
      }

      if (payload.t === 'MESSAGE_CREATE') {
        await handleMessage(payload.d, cfg)
      }
    } catch (e) {
      console.error('Erro processando evento:', e.message)
    }
  }

  ws.onclose = (e) => {
    console.log(`Gateway desconectado (code ${e.code}). Reconectando em 5s...`)
    if (timer) clearInterval(timer)
    setTimeout(startListener, 5000)
  }

  ws.onerror = (err) => {
    console.error('Erro WebSocket:', err.message)
  }
}

// Execução
const mode = process.argv[2] || 'listen'
if (mode === 'report') {
  getConfig().then(cfg => generateDailyReport(cfg)).catch(console.error)
} else {
  startListener()
}
