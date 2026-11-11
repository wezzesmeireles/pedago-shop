import { getDocument, publicSiteConfig } from '../server/appwrite';
import { publicAssets } from '../server/public-assets';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const document: any = await getDocument('site_config', 'global');
    const value = typeof document.value === 'string' ? JSON.parse(document.value) : document.value;
    const safe = publicSiteConfig(value ?? {});
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(publicAssets(safe, req));
  } catch (error) {
    console.error('[config]', error);
    return res.status(500).json({ error: 'Não foi possível carregar a configuração pública.' });
  }
}
