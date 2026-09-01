const APPWRITE = process.env.APPWRITE_ENDPOINT ?? 'https://appwrite.wsgestao.digital/v1';
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;

export const appwriteServer = { endpoint: APPWRITE, project: PROJECT, database: DB };

export function serverHeaders(contentType = false): Record<string, string> {
  if (!API_KEY) throw new Error('APPWRITE_API_KEY is not configured');
  return {
    'X-Appwrite-Project': PROJECT,
    'X-Appwrite-Key': API_KEY,
    ...(contentType ? { 'Content-Type': 'application/json' } : {}),
  };
}

export function query(method: string, attribute?: string, values?: unknown[]) {
  const value: Record<string, unknown> = { method };
  if (attribute) value.attribute = attribute;
  if (values) value.values = values;
  return JSON.stringify(value);
}

export function queryString(queries: string[]) {
  return queries.map((item) => `queries[]=${encodeURIComponent(item)}`).join('&');
}

export async function getDocument(collection: string, documentId: string) {
  const response = await fetch(
    `${APPWRITE}/databases/${DB}/collections/${collection}/documents/${documentId}`,
    { headers: serverHeaders() },
  );
  if (!response.ok) throw new Error(`Appwrite document read failed (${response.status})`);
  return response.json();
}

export async function listDocuments(collection: string, queries: string[]) {
  const response = await fetch(
    `${APPWRITE}/databases/${DB}/collections/${collection}/documents?${queryString(queries)}`,
    { headers: serverHeaders() },
  );
  if (!response.ok) throw new Error(`Appwrite list failed (${response.status})`);
  return response.json();
}

export async function requireAdmin(req: any) {
  const authorization = String(req.headers?.authorization ?? '');
  const jwt = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!jwt) return null;

  const accountResponse = await fetch(`${APPWRITE}/account`, {
    headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-JWT': jwt },
  });
  if (!accountResponse.ok) return null;
  const account: any = await accountResponse.json();

  const profiles: any = await listDocuments('profiles', [
    query('equal', 'userId', [account.$id]),
    query('limit', undefined, [1]),
  ]);
  const profile = profiles.documents?.[0];
  return profile?.role === 'ADMIN' && profile?.isActive !== false ? account : null;
}

export function publicSiteConfig(config: Record<string, unknown>) {
  const {
    mercadoPagoAccessToken: _mpToken,
    mercadoPagoWebhookSecret: _mpWebhook,
    telegramBotToken: _telegramToken,
    telegramChatId: _telegramChat,
    telegramRecipients: _telegramRecipients,
    googleClientSecret: _googleSecret,
    ...safe
  } = config;
  return safe;
}

export function adminSiteConfig(config: Record<string, any>) {
  const safe = publicSiteConfig(config) as Record<string, unknown>;
  return {
    ...safe,
    telegramRecipients: Array.isArray(config.telegramRecipients) ? config.telegramRecipients : [],
    telegramChatId: config.telegramChatId ?? '',
    mercadoPagoConfigured: Boolean(config.mercadoPagoAccessToken),
    mercadoPagoWebhookConfigured: Boolean(config.mercadoPagoWebhookSecret),
    telegramConfigured: Boolean(config.telegramBotToken),
    googleSecretConfigured: Boolean(config.googleClientSecret),
  };
}

export function publicProduct(product: Record<string, unknown>) {
  const {
    fileKey: _fileKey,
    deliveryLink: _deliveryLink,
    ...safe
  } = product;
  return safe;
}
