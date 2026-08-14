import { appwriteServer, getDocument, publicSiteConfig, requireAdmin, serverHeaders } from '../server/appwrite';

const SENSITIVE_KEYS = new Set([
  'mercadoPagoAccessToken',
  'mercadoPagoWebhookSecret',
  'telegramBotToken',
  'telegramChatId',
  'telegramRecipients',
  'googleClientSecret',
]);

function parseConfig(document: any) {
  return typeof document.value === 'string' ? JSON.parse(document.value) : (document.value ?? {});
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const isAdmin = await requireAdmin(req);
      const config = parseConfig(await getDocument('site_config', 'global'));
      res.setHeader('Cache-Control', isAdmin ? 'private, no-store' : 'public, max-age=60, s-maxage=300');
      return res.json(isAdmin ? config : publicSiteConfig(config));
    }

    if (req.method === 'PUT') {
      if (!(await requireAdmin(req))) return res.status(403).json({ error: 'Acesso negado.' });
      const current = parseConfig(await getDocument('site_config', 'global'));
      const incoming = req.body && typeof req.body === 'object' ? req.body : {};

      // Empty secret inputs mean "keep the current value", never erase a secret
      // just because the admin form intentionally received only masked values.
      for (const key of SENSITIVE_KEYS) {
        if (incoming[key] === '' || incoming[key] == null) delete incoming[key];
      }
      const value = JSON.stringify({ ...current, ...incoming });
      const response = await fetch(
        `${appwriteServer.endpoint}/databases/${appwriteServer.database}/collections/site_config/documents/global`,
        {
          method: 'PATCH',
          headers: serverHeaders(true),
          body: JSON.stringify({ data: { value, updatedAt: new Date().toISOString() } }),
        },
      );
      if (!response.ok) throw new Error(`Appwrite config update failed (${response.status})`);
      return res.json(publicSiteConfig(JSON.parse(value)));
    }

    return res.status(405).end();
  } catch (error) {
    console.error('[site-config]', error);
    return res.status(500).json({ error: 'Não foi possível carregar a configuração.' });
  }
}
