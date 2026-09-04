import { getDocument, publicSiteConfig } from '../server/appwrite';

const SITE_ORIGIN = 'https://www.sitepedagogico.com';
const APPWRITE_ORIGIN = 'https://appwrite.wsgestao.digital';

function sameOriginAsset(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (value.startsWith(`${APPWRITE_ORIGIN}/v1/`)) {
    return `${SITE_ORIGIN}${value.slice(APPWRITE_ORIGIN.length)}`;
  }
  return value;
}

function normalizePublicAssets(config: Record<string, any>) {
  return {
    ...config,
    logoUrl: sameOriginAsset(config.logoUrl),
    faviconUrl: sameOriginAsset(config.faviconUrl),
    bannerImageUrl: sameOriginAsset(config.bannerImageUrl),
    banners: Array.isArray(config.banners)
      ? config.banners.map((banner: Record<string, unknown>) => ({
          ...banner,
          imageUrl: sameOriginAsset(banner.imageUrl),
        }))
      : [],
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const document: any = await getDocument('site_config', 'global');
    const value = typeof document.value === 'string' ? JSON.parse(document.value) : document.value;
    const safe = publicSiteConfig(value ?? {});
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(normalizePublicAssets(safe));
  } catch (error) {
    console.error('[config]', error);
    return res.status(500).json({ error: 'Não foi possível carregar a configuração pública.' });
  }
}
