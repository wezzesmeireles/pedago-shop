import { createHash } from 'node:crypto';
import { getDocument } from '../server/appwrite';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const buckets = new Map<string, { startedAt: number; count: number }>();
const recentFingerprints = new Map<string, number>();

function clean(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function html(value: unknown, max = 500): string {
  return clean(value, max).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function requestIp(req: any): string {
  const raw = req.headers?.['x-vercel-forwarded-for'] || req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'] || '';
  return clean(Array.isArray(raw) ? raw[0] : String(raw).split(',')[0], 64) || 'unknown';
}

function allowedOrigin(req: any): boolean {
  const origin = clean(req.headers?.origin, 200);
  if (!origin) return false;
  const configured = clean(process.env.FRONTEND_URL, 200).replace(/\/$/, '');
  return new Set([
    'https://www.sitepedagogico.com',
    'https://sitepedagogico.com',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    configured,
  ].filter(Boolean)).has(origin);
}

function allowRate(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.startedAt > WINDOW_MS) {
    buckets.set(ip, { startedAt: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= MAX_PER_WINDOW;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!allowedOrigin(req)) return res.status(403).end();

  const ip = requestIp(req);
  if (!allowRate(ip)) return res.status(429).end();

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const type = clean(body.type, 60) || 'Erro no navegador';
  const message = clean(body.message, 1200);
  if (!message) return res.status(400).end();

  const fingerprint = createHash('sha256')
    .update(`${type}|${message}|${clean(body.url, 500)}`)
    .digest('hex');
  const previous = recentFingerprints.get(fingerprint) || 0;
  if (Date.now() - previous < 5 * 60_000) return res.status(202).end();
  recentFingerprints.set(fingerprint, Date.now());

  try {
    const configDocument: any = await getDocument('site_config', 'global');
    const config = typeof configDocument.value === 'string' ? JSON.parse(configDocument.value) : configDocument.value;
    if (!config?.telegramBotToken) return res.status(204).end();

    const recipients = Array.isArray(config.telegramRecipients) ? config.telegramRecipients : [];
    const chatIds = recipients.length
      ? recipients.map((recipient: any) => clean(recipient?.chatId, 80)).filter(Boolean)
      : [clean(config.telegramChatId, 80)].filter(Boolean);
    if (!chatIds.length) return res.status(204).end();

    const pageUrl = clean(body.url, 500).split('#')[0];
    const text =
      `🚨 <b>ERRO NO SITE</b>\n━━━━━━━━━━━━━━━━━━\n` +
      `⚠️ <b>${html(type, 60)}</b>\n` +
      `<pre>${html(message, 1200)}</pre>\n\n` +
      `<b>CONTEXTO</b>\n` +
      `🔗 ${html(pageUrl || 'URL não informada', 500)}\n` +
      `🌐 IP: <code>${html(ip, 64)}</code>\n` +
      `📱 ${html(body.device || 'Aparelho não informado', 180)}\n` +
      (body.context ? `🧩 ${html(body.context, 300)}\n` : '') +
      (body.stack ? `\n<b>RESUMO TÉCNICO</b>\n<pre>${html(body.stack, 1200)}</pre>\n` : '') +
      `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    const panelUrl = 'https://www.sitepedagogico.com/admin/dashboard';
    await Promise.allSettled(chatIds.map((chatId: string) => fetch(
      `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          link_preview_options: { is_disabled: true },
          reply_markup: { inline_keyboard: [[{ text: '🛠 Abrir painel', url: panelUrl }]] },
        }),
      },
    )));
    return res.status(204).end();
  } catch (error) {
    console.error('[client-error]', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).end();
  }
}
