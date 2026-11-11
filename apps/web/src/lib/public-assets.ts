const storageHosts = new Set(['www.sitepedagogico.com', 'sitepedagogico.com', 'appwrite.wsgestao.digital']);

export function resolveStorageAssets<T>(value: T, origin: string): T {
  if (typeof value === 'string') {
    try {
      const url = new URL(value);
      if (storageHosts.has(url.hostname) && url.pathname.startsWith('/v1/storage/')) {
        return `${origin}${url.pathname}${url.search}${url.hash}` as T;
      }
    } catch { /* Plain text and relative assets do not need rewriting. */ }
    return value;
  }
  if (Array.isArray(value)) return value.map(item => resolveStorageAssets(item, origin)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, resolveStorageAssets(item, origin)]),
  ) as T;
  return value;
}
