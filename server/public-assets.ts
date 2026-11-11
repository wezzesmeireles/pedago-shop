const STORAGE_HOSTS = new Set([
  'www.sitepedagogico.com', 'sitepedagogico.com', 'appwrite.wsgestao.digital',
]);

// Stored URLs may still point at the previous hosting provider. Keep public
// storage on the same origin as the request so every deployed domain uses /v1.
export function publicAssets<T>(value: T, req: any): T {
  if (typeof value === 'string') {
    try {
      const source = new URL(value);
      if (!STORAGE_HOSTS.has(source.hostname) || !source.pathname.startsWith('/v1/storage/')) return value;
      const host = String(req.headers?.host || 'www.sitepedagogico.com');
      const scheme = /^(localhost|127\.0\.0\.1)(:|$)/.test(host) ? 'http' : 'https';
      const origin = new URL(`${scheme}://${host}`).origin;
      return `${origin}${source.pathname}${source.search}${source.hash}` as T;
    } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(item => publicAssets(item, req)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, publicAssets(item, req)])) as T;
  }
  return value;
}
