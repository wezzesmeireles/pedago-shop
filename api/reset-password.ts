const APPWRITE = 'https://appwrite.wsgestao.digital/v1';
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token e senha são obrigatórios' });
  if (password.length < 8) return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres' });

  try {
    const h = { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY };

    const tokUrl = `${APPWRITE}/databases/${DB}/collections/recovery_tokens/documents/${token}`;
    console.log('[reset-password] fetching', tokUrl);
    const tokRes = await fetch(tokUrl, { headers: { ...h, 'Content-Type': 'application/json' } });
    if (!tokRes.ok) {
      const errText = await tokRes.text().catch(() => '(no body)');
      console.error('[reset-password] fetch token failed', tokRes.status, errText);
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    const tokenDoc = await tokRes.json();
    if (new Date(tokenDoc.expiresAt) < new Date()) return res.status(410).json({ error: 'Token expirado' });

    const updateRes = await fetch(`${APPWRITE}/users/${tokenDoc.userId}/password`, {
      method: 'PATCH',
      headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `password=${encodeURIComponent(password)}`,
    });
    if (!updateRes.ok) {
      const errData = await updateRes.json().catch(() => ({}));
      console.error('[reset-password] update err:', errData);
      return res.status(500).json({ error: 'Erro ao redefinir senha' });
    }

    fetch(`${APPWRITE}/databases/${DB}/collections/recovery_tokens/documents/${token}`, {
      method: 'DELETE', headers: h,
    }).catch(() => {}); // fire-and-forget: deletion is best-effort

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[api/reset-password]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}
