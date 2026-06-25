import { randomUUID } from 'crypto';

const SITE = 'https://www.sitepedagogico.com';
const APPWRITE = 'https://appwrite.wsgestao.digital/v1';
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;

function authHeaders() {
  return { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY, 'Content-Type': 'application/json' };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).end();

  const { productId, email, message } = req.body;
  if (!email) return res.status(400).json({ error: 'Email é obrigatório' });

  try {
    // Lookup user (optional — permite enviar para emails não cadastrados)
    const qs = 'queries[]=' + encodeURIComponent(JSON.stringify({ method: 'equal', attribute: 'email', values: [email.toLowerCase().trim()] })) + '&queries[]=' + encodeURIComponent(JSON.stringify({ method: 'limit', values: [1] }));
    const userRes = await fetch(`${APPWRITE}/users?${qs}`, { headers: authHeaders() });
    const userData = userRes.ok ? await userRes.json() : { users: [] };
    const user = userData.users?.[0] ?? null;

    // Lookup-only mode
    if (productId === '__lookup__') {
      if (!user) return res.json({ ok: true, notRegistered: true, name: '', email });
      return res.json({ ok: true, name: user.name || '', email: user.email });
    }

    // Lookup product
    const prodRes = await fetch(`${APPWRITE}/databases/${DB}/collections/products/documents/${productId}`, { headers: authHeaders() });
    if (!prodRes.ok) return res.status(404).json({ error: 'Produto não encontrado' });
    const product = await prodRes.json();

    const productName = product.name;
    const productImage = product.coverImageUrl || '';
    const productDesc = product.description || '';
    const deliveryType = product.deliveryType || 'file';
    const deliveryLink = product.deliveryLink || '';

    // Create download token
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const tokenDoc = {
      token,
      orderId: '',
      orderItemId: '',
      productId,
      maxDownloads: 99,
      downloadCount: 0,
      expiresAt,
      deliveryLink: deliveryType === 'link' ? deliveryLink : '',
      revokedAt: null,
      lastDownloadAt: null,
    };
    const docRes = await fetch(`${APPWRITE}/databases/${DB}/collections/download_tokens/documents`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ documentId: token, data: tokenDoc, permissions: [] }),
    });
    if (!docRes.ok) {
      const err = await docRes.text();
      console.error('[send-product] store err:', err);
      return res.status(500).json({ error: 'Erro ao gerar link de download' });
    }

    // Lookup logo
    let logoUrl = '';
    try {
      const cfgRes = await fetch(`${APPWRITE}/databases/${DB}/collections/site_config/documents/global`, { headers: authHeaders() });
      if (cfgRes.ok) { const cfg = await cfgRes.json(); logoUrl = cfg.logoUrl || ''; }
    } catch {}

    const downloadLink = `${SITE}/api/download?token=${token}`;
    const userName = user?.name || user?.email || email;
    const customMsg = message || '';

    // Fetch product file for attachment (file-type only)
    let attachment: any = null;
    if (deliveryType !== 'link' && product.fileKey) {
      try {
        const fileId = String(product.fileKey).replace(/\.[^.]+$/, '');
        const storageRes = await fetch(
          `${APPWRITE}/storage/buckets/product-files/files/${fileId}/download?project=${encodeURIComponent(PROJECT)}`,
          { headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY } },
        );
        if (storageRes.ok) {
          const buf = Buffer.from(await storageRes.arrayBuffer());
          const safeName = (productName || 'arquivo')
            .replace(/[^a-z0-9._-]/gi, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toLowerCase() || 'arquivo';
          attachment = { filename: `${safeName}.pdf`, content: buf.toString('base64') };
        }
      } catch {}
    }

    // Build email payload
    const emailPayload: any = {
      from: 'Site Pedagógico <noreply@sitepedagogico.com>',
      to: [email],
      subject: `Seu download - ${productName}`,
      html: buildHtml({ downloadLink, productName, productImage, productDesc, userName, logoUrl, customMsg, deliveryType, deliveryLink: deliveryType === 'link' ? deliveryLink : '' }),
    };
    if (attachment) emailPayload.attachments = [attachment];

    // Send email
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailPayload),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('[send-product] resend err:', err);
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }

    res.json({ ok: true, token });
  } catch (err: any) {
    console.error('[api/send-product]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

function buildHtml({ downloadLink, productName, productImage, productDesc, userName, logoUrl, customMsg, deliveryType, deliveryLink }: {
  downloadLink: string; productName: string; productImage: string; productDesc: string; userName: string; logoUrl: string; customMsg: string;
  deliveryType: string; deliveryLink: string;
}): string {
  const logoSrc = logoUrl || 'https://www.sitepedagogico.com/favicon-192.png';
  const previewImg = productImage
    ? `<div class="preview-img"><img src="${productImage}" alt="${productName}" /></div>`
    : '';
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
  .preview-img{border-radius:14px;overflow:hidden;margin:20px 0;background:#f1f5f9}
  .preview-img img{width:100%;height:auto;max-height:280px;object-fit:cover;display:block}
  .desc{font-size:13px;color:#64748b;line-height:1.6;margin:12px 0 20px;padding:0 4px}
  .btn-wrap{text-align:center;margin:28px 0}
  .btn{display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;font-size:15px;font-weight:600;padding:14px 44px;border-radius:50px;text-decoration:none;box-shadow:0 4px 14px rgba(124,58,237,.35);letter-spacing:.01em}
  .fallback-wrap{background:#f8fafc;border-radius:12px;padding:16px;margin:24px 0}
  .fallback-label{font-size:13px;color:#64748b;margin-bottom:8px;text-align:center}
  .fallback-link{font-size:12px;color:#7C3AED;word-break:break-all;text-align:center;line-height:1.5}
  .custom-msg{background:#fefce8;border-radius:12px;padding:16px;margin:20px 0;font-size:14px;color:#92400e;line-height:1.6}
  .divider{height:1px;background:#e2e8f0;margin:28px 0}
  .info-text{font-size:13px;color:#64748b;line-height:1.6;text-align:center}
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
      Seu material chegou!
    </div>
    <h1>Ol\u00e1, ${userName}!</h1>
    <p>Disponibilizamos o material abaixo para voc\u00ea.</p>
    ${customMsg ? `<div class="custom-msg">${customMsg}</div>` : ''}
    ${previewImg}
    <h2 style="font-size:18px;font-weight:700;color:#0f172a;text-align:center">${productName}</h2>
    ${productDesc ? `<div class="desc">${productDesc}</div>` : ''}
    ${deliveryType === 'link'
      ? `<div class="btn-wrap"><a href="${deliveryLink}" class="btn">Acessar Material</a></div>
         <div class="fallback-wrap"><div class="fallback-label">Se o bot\u00e3o n\u00e3o funcionar:</div>
         <div class="fallback-link">${deliveryLink}</div></div>`
      : `<div class="btn-wrap"><a href="${downloadLink}" class="btn">Baixar Agora</a></div>
         <div class="fallback-wrap"><div class="fallback-label">Se o bot\u00e3o n\u00e3o funcionar, copie o link:</div>
         <div class="fallback-link">${downloadLink}</div></div>`
    }
    <div class="divider"></div>
    <div class="info-text">Este link expira em <strong>30 dias</strong> e pode ser usado at\u00e9 <strong>99 vezes</strong>.</div>
  </div>
  <div class="footer">
    &copy; ${new Date().getFullYear()} Site Pedag\u00f3gico &middot; <a href="https://www.sitepedagogico.com">www.sitepedagogico.com</a>
  </div>
</div>
</body></html>`;
}
