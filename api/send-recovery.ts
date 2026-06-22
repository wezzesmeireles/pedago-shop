import { randomUUID } from 'crypto';

const SITE = 'https://www.sitepedagogico.com';
const APPWRITE = `${SITE}/v1`;
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const COLLECTION = 'recovery_tokens';

function authHeaders() {
  return { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY, 'Content-Type': 'application/json' };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email não informado' });

  try {
    const qs = 'queries[]=' + encodeURIComponent(JSON.stringify({ method: 'equal', attribute: 'email', values: [email.toLowerCase().trim()] })) + '&queries[]=' + encodeURIComponent(JSON.stringify({ method: 'limit', values: [1] }));
    const userRes = await fetch(`${APPWRITE}/users?${qs}`, { headers: authHeaders() });
    if (!userRes.ok) return res.json({ ok: true });
    const userData = await userRes.json();
    const user = userData.users?.[0];
    if (!user) return res.json({ ok: true });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const docRes = await fetch(`${APPWRITE}/databases/${DB}/collections/${COLLECTION}/documents`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        documentId: token,
        data: { token, userId: user.$id, email, expiresAt },
        permissions: [],
      }),
    });
    if (!docRes.ok) {
      const err = await docRes.text();
      console.error('[send-recovery] store err:', err);
      return res.status(500).json({ error: 'Erro ao gerar token' });
    }

    let logoUrl = '';
    try {
      const cfgRes = await fetch(`${APPWRITE}/databases/${DB}/collections/site_config/documents/global`, { headers: authHeaders() });
      if (cfgRes.ok) { const cfg = await cfgRes.json(); logoUrl = cfg.logoUrl || ''; }
    } catch {}

    const resetLink = `${SITE}/auth/reset-senha?token=${token}`;
    const name = user.name || user.email;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Pedago Shop <noreply@sitepedagogico.com>',
        to: [email],
        subject: 'Redefina sua senha - Pedago Shop',
        html: buildHtml({ resetLink, logoUrl, name }),
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('[send-recovery] resend err:', err);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('[api/send-recovery]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

function buildHtml({ resetLink, logoUrl, name }: { resetLink: string; logoUrl: string; name: string }): string {
  const logoSrc = logoUrl || 'https://www.sitepedagogico.com/favicon-192.png';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px}
  .container{max-width:560px;margin:0 auto;padding:48px 0}
  .card{background:#fff;border-radius:24px;padding:40px 32px;box-shadow:0 20px 60px rgba(0,0,0,.15)}
  .logo{text-align:center;margin-bottom:32px}
  .logo img{max-height:64px;width:auto}
  h1{font-size:24px;font-weight:700;color:#1e293b;margin-bottom:8px;text-align:center}
  .sub{font-size:14px;color:#64748b;text-align:center;margin-bottom:32px;line-height:1.6}
  .btn-wrap{text-align:center;margin:32px 0}
  .btn{display:inline-block;background:#7C3AED;color:#fff;font-size:16px;font-weight:600;padding:14px 40px;border-radius:50px;text-decoration:none;box-shadow:0 4px 12px rgba(124,58,237,.35)}
  .divider{height:1px;background:#e2e8f0;margin:32px 0}
  .info{font-size:13px;color:#94a3b8;text-align:center;line-height:1.8}
  .info strong{color:#64748b}
  .footer{text-align:center;padding:32px 0 0;font-size:12px;color:#cbd5e1}
  @media(max-width:480px){.card{padding:24px 20px}h1{font-size:20px}.btn{display:block}}
</style></head>
<body><div class="container"><div class="card">
  <div class="logo"><img src="${logoSrc}" alt="Pedago Shop" /></div>
  <h1>Redefina sua senha</h1>
  <p class="sub">Ol\u00e1 <strong>${name}</strong>, recebemos uma solicita\u00e7\u00e3o para redefinir a senha da sua conta.</p>
  <div class="btn-wrap"><a href="${resetLink}" class="btn">Redefinir Senha</a></div>
  <p class="sub" style="margin-bottom:0">Se o bot\u00e3o acima n\u00e3o funcionar, copie e cole o link:</p>
  <p style="font-size:12px;color:#7C3AED;text-align:center;word-break:break-all;margin-top:8px">${resetLink}</p>
  <div class="divider"></div>
  <p class="info">Este link expira em <strong>1 hora</strong>.</p>
  <p class="info">Se voc\u00ea n\u00e3o solicitou esta redefini\u00e7\u00e3o, ignore este email.</p>
</div><div class="footer">&copy; ${new Date().getFullYear()} Pedago Shop</div></div></body></html>`;
}
