export function initTelegramLogger(app: any) {
  const sendToTelegram = async (message: string) => {
    try {
      // Tenta pegar do .env, senão pega do painel Admin salvo no localStorage
      let botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      let chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        try {
          const raw = localStorage.getItem('sp_site_cfg_v1');
          if (raw) {
            const cfg = JSON.parse(raw);
            botToken = botToken || cfg.telegramBotToken;
            chatId = chatId || (cfg.telegramRecipients && cfg.telegramRecipients.length > 0 ? cfg.telegramRecipients[0].chatId : null);
          }
        } catch (e) {}
      }

      if (!botToken || !chatId) {
        console.warn('[Telegram Logger] Bot não configurado. Erro não enviado.');
        return;
      }

      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const text = `🚨 *Alerta de Erro no Site*\n\n<pre>${message}</pre>\n\n*Navegador:* ${navigator.userAgent}\n*URL:* ${window.location.href}`;
      
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
        })
      });
    } catch (e) {
      console.error('[Telegram Logger] Falha ao enviar erro para o Telegram', e);
    }
  };

  // 1. Captura erros internos do Vue (componentes, ciclo de vida)
  app.config.errorHandler = (err: any, instance: any, info: string) => {
    console.error('[Vue Error]', err, info);
    sendToTelegram(`[Vue Error]\nInfo: ${info}\nMessage: ${err?.message || err}\nStack: ${err?.stack || ''}`);
  };

  // 2. Captura promessas rejeitadas (ex: erro de rede não tratado)
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    // Ignora erros de plugin ou "cancelled" que são normais
    if (reason && (reason === 'cancelled' || String(reason.message).includes('plugin'))) return;
    
    sendToTelegram(`[Unhandled Rejection]\nReason: ${reason?.message || reason}`);
  });

  // 3. Captura erros globais de script (fora do Vue)
  window.addEventListener('error', (event) => {
    sendToTelegram(`[Global Error]\nMessage: ${event.message}\nFile: ${event.filename}:${event.lineno}:${event.colno}\nStack: ${event.error?.stack || ''}`);
  });

  console.log('[Telegram Logger] Inicializado com sucesso.');
}
