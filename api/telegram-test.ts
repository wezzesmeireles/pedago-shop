import { getDocument, requireAdmin } from '../server/appwrite';

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Acesso negado.' });

  const chatId = clean(req.body?.chatId, 80);
  const recipientName = clean(req.body?.name, 100);
  if (!chatId) return res.status(400).json({ error: 'Chat ID obrigatório.' });

  try {
    const document: any = await getDocument('site_config', 'global');
    const config = typeof document.value === 'string' ? JSON.parse(document.value) : document.value;
    if (!config?.telegramBotToken) return res.status(409).json({ error: 'Salve o token do bot antes de testar.' });

    const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          `✅ <b>TESTE CONCLUÍDO</b>\n━━━━━━━━━━━━━━━━━━\n` +
          `Olá${recipientName ? `, <b>${recipientName.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</b>` : ''}!\n\n` +
          `O Telegram do Site Pedagógico está configurado e protegido pelo servidor.`,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[{ text: '📦 Abrir pedidos', url: 'https://www.sitepedagogico.com/admin/pedidos' }]],
        },
      }),
    });
    if (!response.ok) return res.status(502).json({ error: 'O Telegram recusou o envio. Confira o Chat ID.' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('[telegram-test]', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ error: 'Não foi possível testar agora.' });
  }
}
