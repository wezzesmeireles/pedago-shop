import { publicApiUrl } from './public-api';

export function tokenDownloadPath(token: string): string {
  return `/api/download?token=${encodeURIComponent(token)}`;
}

export function pdfFilename(productName: string): string {
  const safeName = (productName || 'atividade')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase() || 'atividade';

  return `${safeName.replace(/\.pdf$/i, '')}.pdf`;
}

export function isIosDevice(
  userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '',
  platform = typeof navigator !== 'undefined' ? navigator.platform : '',
  maxTouchPoints = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
): boolean {
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export function supportsIosFileSave(): boolean {
  if (!isIosDevice() || typeof navigator === 'undefined' || typeof File === 'undefined') return false;
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;

  const probe = new File([], 'atividade.pdf', { type: 'application/pdf' });
  return navigator.canShare({ files: [probe] });
}

export async function prepareTokenDownload(token: string, productName: string): Promise<File> {
  const response = await fetch(publicApiUrl(tokenDownloadPath(token)), {
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Não foi possível preparar o PDF (${response.status}).`);
  }

  const blob = await response.blob();
  return new File([blob], pdfFilename(productName), {
    type: blob.type || 'application/pdf',
    lastModified: Date.now(),
  });
}

export async function savePreparedFile(file: File): Promise<void> {
  if (!navigator.canShare({ files: [file] })) {
    throw new Error('Este aparelho não permite salvar o PDF diretamente.');
  }
  await navigator.share({ files: [file], title: file.name });
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
