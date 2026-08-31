export function initTelegramLogger(app: any) {
  const recent = new Map<string, number>();

  const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);

  const sendToTelegram = async (payload: { type: string; message: string; context?: string; stack?: string }) => {
    try {
      const fingerprint = `${payload.type}|${payload.message}|${window.location.pathname}`;
      const previous = recent.get(fingerprint) || 0;
      if (Date.now() - previous < 60_000) return;
      recent.set(fingerprint, Date.now());

      await fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: clean(payload.type, 60),
          message: clean(payload.message, 1200),
          context: clean(payload.context, 300),
          stack: clean(payload.stack, 1200),
          url: window.location.href,
          device: clean(`${navigator.platform || ''} · ${navigator.userAgent}`, 180),
        }),
        keepalive: true,
      });
    } catch (e) {
      console.warn('[Error Reporter] Falha ao enviar alerta', e);
    }
  };

  // 1. Captura erros internos do Vue (componentes, ciclo de vida)
  app.config.errorHandler = (err: any, instance: any, info: string) => {
    console.error('[Vue Error]', err, info);
    void sendToTelegram({
      type: 'Erro interno do Vue',
      message: err?.message || String(err),
      context: info,
      stack: err?.stack || '',
    });
  };

  // 2. Captura promessas rejeitadas (ex: erro de rede não tratado)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    // Ignora erros de plugin ou "cancelled" que são normais
    if (reason && (reason === 'cancelled' || String(reason.message).includes('plugin'))) return;
    
    void sendToTelegram({
      type: 'Promise rejeitada',
      message: reason?.message || String(reason),
      stack: reason?.stack || '',
    });
  });

  // 3. Captura erros globais de script (fora do Vue)
  window.addEventListener('error', (event) => {
    void sendToTelegram({
      type: 'Erro global de JavaScript',
      message: event.message,
      context: `${event.filename}:${event.lineno}:${event.colno}`,
      stack: event.error?.stack || '',
    });
  });

  console.log('[Error Reporter] Inicializado com envio protegido pelo servidor.');
}
