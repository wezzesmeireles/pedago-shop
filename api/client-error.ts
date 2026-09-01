import { createHash } from 'node:crypto';
import { getDocument } from '../server/appwrite';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const DEDUPE_MS = 15 * 60_000;
const buckets = new Map<string, { startedAt: number; count: number }>();
const recentFingerprints = new Map<string, number>();
const globalBuckets = new Map<string, { startedAt: number; count: number }>();

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

function scrub(value: unknown, max: number): string {
  return clean(value, max)
    .replace(/([?&](?:token|key|secret|code|authorization)=)[^&\s]+/gi, '$1[PROTEGIDO]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [PROTEGIDO]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[TOKEN PROTEGIDO]');
}

function html(value: unknown, max = 500): string {
  let escaped = '';
  for (const character of scrub(value, max)) {
    const encoded = character === '&' ? '&amp;' : character === '<' ? '&lt;' : character === '>' ? '&gt;' : character;
    if (escaped.length + encoded.length > max) break;
    escaped += encoded;
  }
  return escaped;
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

function allowGlobalRate(severity: 'warning' | 'critical'): boolean {
  const now = Date.now();
  const windowMs = severity === 'critical' ? 10 * 60_000 : 30 * 60_000;
  const maxInWindow = severity === 'critical' ? 3 : 1;
  const bucket = globalBuckets.get(severity);
  if (!bucket || now - bucket.startedAt > windowMs) {
    globalBuckets.set(severity, { startedAt: now, count: 1 });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= maxInWindow;
}

function safePath(value: unknown): string {
  try {
    const url = new URL(clean(value, 700));
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return clean(value, 500).split(/[?#]/)[0];
  }
}

function normalizedFingerprint(value: string): string {
  return value
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\b\d{4,}\b/g, ':n')
    .replace(/https?:\/\/\S+/g, ':url');
}

function parseBody(body: unknown): Record<string, unknown> {
  if (body && typeof body === 'object') return body as Record<string, unknown>;
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  return {};
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!allowedOrigin(req)) return res.status(403).end();

  const ip = requestIp(req);
  if (!allowRate(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).end();
  }

  const body = parseBody(req.body);
  const type = scrub(body.type, 60) || 'Erro no navegador';
  const message = scrub(body.message, 1200);
  if (!message) return res.status(400).end();

  const pageUrl = safePath(body.url);
  const severity = body.severity === 'critical' ? 'critical' : 'warning';
  const fingerprint = createHash('sha256')
    .update(`${type}|${normalizedFingerprint(message)}|${pageUrl}`)
    .digest('hex');
  const incidentId = fingerprint.slice(0, 8).toUpperCase();
  const previous = recentFingerprints.get(fingerprint) || 0;
  if (Date.now() - previous < DEDUPE_MS) return res.status(202).end();
  recentFingerprints.set(fingerprint, Date.now());
  if (!allowGlobalRate(severity)) return res.status(202).end();

  try {
    const configDocument: any = await getDocument('site_config', 'global');
    const config = typeof configDocument.value === 'string' ? JSON.parse(configDocument.value) : configDocument.value;
    if (!config?.telegramBotToken) throw new Error('Telegram bot não configurado');

    const recipients = Array.isArray(config.telegramRecipients) ? config.telegramRecipients : [];
    const chatIds = [...new Set(recipients.length
      ? recipients.map((recipient: any) => clean(recipient?.chatId, 80)).filter(Boolean)
      : [clean(config.telegramChatId, 80)].filter(Boolean))];
    if (!chatIds.length) throw new Error('Nenhum destinatário do Telegram configurado');

    const title = severity === 'critical' ? '🚨 ERRO CRÍTICO NO SITE' : '⚠️ ALERTA NO SITE';
    const stack = scrub(body.stack, 900).split(/\bat\s+/).slice(0, 5).join('\nat ');
    const text =
      `<b>${title}</b>  •  <code>#${incidentId}</code>\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `<b>${html(type, 60)}</b>\n` +
      `<pre>${html(message, 1100)}</pre>\n\n` +
      `<b>CONTEXTO</b>\n` +
      `🔗 ${html(pageUrl || 'Rota não informada', 500)}\n` +
      `🌐 IP: <code>${html(ip, 64)}</code>\n` +
      `📶 ${body.online === false ? 'Aparelho offline' : 'Aparelho online'}\n` +
      `📱 ${html(body.device || 'Aparelho não informado', 220)}\n` +
      (body.context ? `🧩 ${html(body.context, 300)}\n` : '') +
      (stack ? `\n<b>RESUMO TÉCNICO</b>\n<pre>${html(stack, 900)}</pre>\n` : '') +
      `🕐 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    const panelUrl = 'https://www.sitepedagogico.com/admin/dashboard';
    const deliveries = await Promise.all(chatIds.map(async (chatId: string) => {
      try {
        const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            link_preview_options: { is_disabled: true },
            reply_markup: { inline_keyboard: [[{ text: '🛠 Abrir painel', url: panelUrl }]] },
          }),
        });
        const result: any = await response.json().catch(() => ({}));
        return { chat: chatId.slice(-4), ok: response.ok && result?.ok === true, status: response.status };
      } catch {
        return { chat: chatId.slice(-4), ok: false, status: 0 };
      }
    }));

    const succeeded = deliveries.filter((delivery) => delivery.ok);
    const failed = deliveries.filter((delivery) => !delivery.ok);
    if (failed.length) console.error('[client-error] Telegram falhou', { incidentId, failed });
    if (!succeeded.length) {
      recentFingerprints.delete(fingerprint);
      return res.status(502).end();
    }
    console.info('[client-error] Alerta entregue', { incidentId, delivered: succeeded.length, failed: failed.length });
    return res.status(204).end();
  } catch (error) {
    recentFingerprints.delete(fingerprint);
    console.error('[client-error]', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).end();
  }
}
