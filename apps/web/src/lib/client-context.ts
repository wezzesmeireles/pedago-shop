export interface ClientContext {
  publicIp: string;
  userAgent: string;
  platform: string;
  platformVersion: string;
  model: string;
  brands: string;
  language: string;
  timezone: string;
  viewport: string;
  screen: string;
  touchPoints: number;
  appMode: 'pwa' | 'browser';
}

type NavigatorWithHints = Navigator & {
  userAgentData?: {
    brands?: Array<{ brand: string; version: string }>;
    mobile?: boolean;
    platform?: string;
    getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
  };
  standalone?: boolean;
};

function clean(value: unknown, max = 300): string {
  if (typeof value !== 'string') return '';
  return Array.from(value)
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? ' ' : character;
    })
    .join('')
    .trim()
    .slice(0, max);
}

export async function collectClientContext(): Promise<ClientContext | undefined> {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return undefined;

  const nav = navigator as NavigatorWithHints;
  const hints = nav.userAgentData;
  let highEntropy: Record<string, unknown> = {};
  let publicIp = '';
  try {
    highEntropy = await hints?.getHighEntropyValues?.(['model', 'platformVersion']) ?? {};
  } catch {
    // Some browsers deliberately deny high-entropy device hints.
  }
  try {
    const response = await fetch('/api/client-context', { credentials: 'same-origin', cache: 'no-store' });
    if (response.ok) publicIp = clean((await response.json())?.ip, 64);
  } catch {
    // Checkout continues normally when network privacy tools block this request.
  }

  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone === true;

  return {
    publicIp,
    userAgent: clean(nav.userAgent),
    platform: clean(hints?.platform || nav.platform, 80),
    platformVersion: clean(highEntropy.platformVersion, 40),
    model: clean(highEntropy.model, 100),
    brands: clean(hints?.brands?.map(({ brand, version }) => `${brand} ${version}`).join(', '), 180),
    language: clean(nav.language, 30),
    timezone: clean(Intl.DateTimeFormat().resolvedOptions().timeZone, 80),
    viewport: `${Math.round(window.innerWidth)}x${Math.round(window.innerHeight)}`,
    screen: `${Math.round(window.screen?.width || 0)}x${Math.round(window.screen?.height || 0)}`,
    touchPoints: Math.max(0, Math.min(Number(nav.maxTouchPoints || 0), 20)),
    appMode: standalone ? 'pwa' : 'browser',
  };
}
