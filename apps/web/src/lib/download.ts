import { publicApiUrl } from './public-api';

export function tokenDownloadPath(token: string): string {
  return `/api/download?token=${encodeURIComponent(token)}`;
}

// Downloads precisam começar na mesma janela no navegador/PWA. Alguns WebViews
// devolvem um objeto em window.open(), mas descartam a navegação ou o anexo, o
// que fazia o fallback antigo nunca ser executado. No app nativo, abrimos a URL
// pública no navegador do sistema porque não existe uma API /api no localhost.
export async function startTokenDownload(token: string): Promise<void> {
  const url = publicApiUrl(tokenDownloadPath(token));

  if (import.meta.env.VITE_TARGET === 'mobile') {
    const { openUrl } = await import('@/mobile/download');
    await openUrl(url);
    return;
  }

  window.location.assign(url);
}
