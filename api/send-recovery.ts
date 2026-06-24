import { randomUUID } from 'crypto';

const SITE = 'https://www.sitepedagogico.com';
const APPWRITE = 'https://appwrite.wsgestao.digital/v1';
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
        from: 'Site Pedag\u00f3gico <noreply@sitepedagogico.com>',
        to: [email],
        subject: 'Redefina sua senha - Site Pedag\u00f3gico',
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
  body{background:#f8fafc;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;min-height:100vh}
  .bg-decor{position:fixed;top:0;left:0;right:0;height:240px;background:linear-gradient(135deg,#7C3AED 0%,#EC4899 100%);z-index:0}
  .container{max-width:520px;margin:0 auto;padding:48px 16px;position:relative;z-index:1}
  .logo{text-align:center;margin-bottom:24px}
  .logo img{max-height:48px;width:auto;border-radius:12px}
  .card{background:#fff;border-radius:20px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,.06),0 20px 60px rgba(0,0,0,.08)}
  .badge{display:inline-flex;align-items:center;gap:6px;background:#f0fdf4;color:#16a34a;font-size:12px;font-weight:600;padding:6px 14px;border-radius:50px;margin-bottom:20px}
  .badge svg{width:14px;height:14px}
  h1{font-size:22px;font-weight:700;color:#0f172a;margin-bottom:8px}
  p{font-size:15px;color:#475569;line-height:1.7}
  .btn-wrap{text-align:center;margin:32px 0}
  .btn{display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;font-size:15px;font-weight:600;padding:14px 44px;border-radius:50px;text-decoration:none;box-shadow:0 4px 14px rgba(124,58,237,.35);transition:all .2s;letter-spacing:.01em}
  .btn:hover{box-shadow:0 6px 20px rgba(124,58,237,.45);transform:translateY(-1px)}
  .fallback-wrap{background:#f8fafc;border-radius:12px;padding:16px;margin:24px 0}
  .fallback-label{font-size:13px;color:#64748b;margin-bottom:8px;text-align:center}
  .fallback-link{font-size:12px;color:#7C3AED;word-break:break-all;text-align:center;line-height:1.5}
  .divider{height:1px;background:#e2e8f0;margin:28px 0}
  .info-row{display:flex;gap:12px;align-items:flex-start;margin-bottom:12px}
  .info-icon{width:20px;height:20px;flex-shrink:0;margin-top:2px}
  .info-text{font-size:13px;color:#64748b;line-height:1.6}
  .info-text strong{color:#334155}
  .footer{text-align:center;padding:24px 0 0;font-size:12px;color:#94a3b8}
  .footer a{color:#94a3b8;text-decoration:underline}
  @media(max-width:480px){.card{padding:28px 20px}.container{padding:24px 12px}h1{font-size:20px}.btn{display:block;text-align:center}}
</style></head>
<body>
<div class="bg-decor"></div>
<div class="container">
  <div class="logo"><img src="${logoSrc}" alt="Site Pedag\u00f3gico" /></div>
  <div class="card">
    <div class="badge">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      Redefini\u00e7\u00e3o de senha
    </div>
    <h1>Ol\u00e1, ${name}!</h1>
    <p>Recebemos uma solicita\u00e7\u00e3o para redefinir a senha da sua conta no <strong>Site Pedag\u00f3gico</strong>.</p>
    <div class="btn-wrap"><a href="${resetLink}" class="btn">Redefinir Senha</a></div>
    <div class="fallback-wrap">
      <div class="fallback-label">Se o bot\u00e3o acima n\u00e3o funcionar, copie o link:</div>
      <div class="fallback-link">${resetLink}</div>
    </div>
    <div class="divider"></div>
    <div class="info-row">
      <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      <div class="info-text">Este link expira em <strong>1 hora</strong> e pode ser usado apenas uma vez.</div>
    </div>
    <div class="info-row">
      <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
      <div class="info-text">N\u00e3o foi voc\u00ea? <strong>Ignore este email</strong> — sua senha permanece segura.</div>
    </div>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} Site Pedag\u00f3gico &middot; <a href="https://www.sitepedagogico.com">www.sitepedagogico.com</a>
  </div>
</div>
</body></html>`;
}
