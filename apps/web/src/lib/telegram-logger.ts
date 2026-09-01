type ErrorPayload = {
  type: string;
  message: string;
  context?: string;
  stack?: string;
  severity?: 'warning' | 'critical';
};

const PRODUCTION_HOSTS = new Set(['sitepedagogico.com', 'www.sitepedagogico.com']);
const DEDUPE_MS = 10 * 60_000;
const MAX_PER_MINUTE = 3;
const MAX_PER_SESSION = 12;

function clean(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function errorMessage(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message?: unknown }).message ?? '');
  }
  return String(value ?? '');
}

function isExpectedBrowserError(value: unknown): boolean {
  const name = value && typeof value === 'object' && 'name' in value
    ? String((value as { name?: unknown }).name ?? '')
    : '';
  const message = errorMessage(value).toLowerCase();

  if (name === 'AbortError' || name === 'CanceledError') return true;
  if (!message) return true;
  if (/\b(cancelled|canceled|aborted)\b/.test(message)) return true;
  if (message.includes('resizeobserver loop')) return true;
  if (message.includes('chrome-extension://') || message.includes('moz-extension://')) return true;
  if (message.includes('plugin') && message.includes('error')) return true;

  const networkFailure = /failed to fetch|networkerror|network request failed|load failed/.test(message);
  return networkFailure && navigator.onLine === false;
}

function stableFingerprint(payload: ErrorPayload): string {
  const normalized = payload.message
    .toLowerCase()
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, ':id')
    .replace(/\b\d{4,}\b/g, ':n')
    .replace(/https?:\/\/\S+/g, ':url');
  return `${payload.type}|${normalized}|${window.location.pathname}`;
}

function reportingEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true') return true;
  return import.meta.env.PROD && PRODUCTION_HOSTS.has(window.location.hostname);
}

export function initTelegramLogger(app: any) {
  if (!reportingEnabled()) {
    console.info('[Error Reporter] Desativado neste ambiente.');
    return;
  }

  const recent = new Map<string, number>();
  let minuteStartedAt = Date.now();
  let sentThisMinute = 0;
  let sentThisSession = 0;

  const sendToTelegram = async (payload: ErrorPayload) => {
    try {
      if (isExpectedBrowserError(payload.message)) return;

      const now = Date.now();
      if (now - minuteStartedAt >= 60_000) {
        minuteStartedAt = now;
        sentThisMinute = 0;
      }
      if (sentThisMinute >= MAX_PER_MINUTE || sentThisSession >= MAX_PER_SESSION) return;

      const fingerprint = stableFingerprint(payload);
      const previous = recent.get(fingerprint) || 0;
      if (now - previous < DEDUPE_MS) return;
      recent.set(fingerprint, now);
      sentThisMinute += 1;
      sentThisSession += 1;

      const response = await fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: clean(payload.type, 60),
          message: clean(payload.message, 1200),
          context: clean(payload.context, 300),
          stack: clean(payload.stack, 1200),
          severity: payload.severity || 'warning',
          url: `${window.location.origin}${window.location.pathname}`,
          online: navigator.onLine,
          device: clean(`${navigator.platform || ''} · ${navigator.userAgent}`, 220),
        }),
        keepalive: true,
      });

      if (!response.ok && response.status !== 202) {
        recent.delete(fingerprint);
        console.warn(`[Error Reporter] Servidor respondeu ${response.status}.`);
      }
    } catch (error) {
      console.warn('[Error Reporter] Falha ao enviar alerta', error);
    }
  };

  app.config.errorHandler = (error: any, _instance: any, info: string) => {
    console.error('[Vue Error]', error, info);
    if (isExpectedBrowserError(error)) return;
    void sendToTelegram({
      type: 'Erro interno do Vue',
      message: errorMessage(error),
      context: info,
      stack: error?.stack || '',
      severity: 'critical',
    });
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (isExpectedBrowserError(reason)) return;
    void sendToTelegram({
      type: 'Promise rejeitada',
      message: errorMessage(reason),
      stack: reason?.stack || '',
      severity: 'warning',
    });
  });

  window.addEventListener('error', (event) => {
    if (!event.message || event.message === 'Script error.' || isExpectedBrowserError(event.error || event.message)) return;
    if (event.filename?.startsWith('chrome-extension://') || event.filename?.startsWith('moz-extension://')) return;
    void sendToTelegram({
      type: 'Erro global de JavaScript',
      message: event.message,
      context: `${event.filename || 'script'}:${event.lineno || 0}:${event.colno || 0}`,
      stack: event.error?.stack || '',
      severity: 'critical',
    });
  });

  console.info('[Error Reporter] Ativo para erros reais em produção.');
}
