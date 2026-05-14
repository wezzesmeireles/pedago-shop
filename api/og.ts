// anon key é pública — já está no bundle JS do frontend
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://hdldxgbvkjcoesmfoglm.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_W64H0XMozN-8ll1QaaNPyw_JC7SkAhF';
const SITE_URL = 'https://sitepedagogico.com.br';

const BOT_UA = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|googlebot|bingbot|slackbot|telegrambot|vkshare|ia_archiver|applebot/i;

async function supaGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
  });
  return res.ok ? (res.json() as Promise<any[]>) : [];
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildOgHtml(o: { title: string; desc: string; image: string; url: string; storeName: string }) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:image" content="${esc(o.image)}">
<meta property="og:url" content="${esc(o.url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(o.storeName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${esc(o.image)}">
<meta http-equiv="refresh" content="0;url=${esc(o.url)}">
</head><body>Carregando...</body></html>`;
}

export default async function handler(req: any, res: any) {
  const ua = String(req.headers['user-agent'] ?? '');
  const slug = String(req.query.slug ?? '').replace(/[^a-z0-9-]/gi, '');
  const isBot = BOT_UA.test(ua);

  // Usuário normal: busca o index.html do SPA e serve inline
  // (URL do browser permanece /produto/:slug — Vue router roda normalmente)
  if (!isBot) {
    try {
      const spaRes = await fetch(SITE_URL, { headers: { 'user-agent': 'vercel-og-proxy' } });
      const html = await spaRes.text();
      res.setHeader('Content-Type', 'text/html;charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).send(html);
    } catch {
      return res.redirect(302, `${SITE_URL}/`);
    }
  }

  // Bot: busca dados do produto e retorna HTML com OG tags
  const [cfgRows, productRows] = await Promise.all([
    supaGet('site_config?key=eq.global&select=value&limit=1').catch(() => []),
    slug
      ? supaGet(`products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&deleted_at=is.null&select=name,description,cover_image_url,slug&limit=1`).catch(() => [])
      : Promise.resolve([]),
  ]);

  const cfg: any = (cfgRows as any[])?.[0]?.value ?? {};
  const product: any = (productRows as any[])?.[0] ?? null;

  const storeName: string = cfg.storeName ?? 'Site Pedagógico';
  const defaultImage: string = cfg.logoUrl ?? cfg.bannerImageUrl ?? '';
  const defaultDesc: string = cfg.seoDescription ?? 'Atividades pedagógicas digitais em PDF para professores e educadores.';
  const defaultTitle: string = cfg.seoTitle ?? storeName;

  const title = product ? `${product.name} | ${storeName}` : defaultTitle;
  const desc = String(product?.description ?? defaultDesc).slice(0, 160);
  const image: string = product?.cover_image_url ?? defaultImage;
  const url = slug ? `${SITE_URL}/produto/${slug}` : SITE_URL;

  res.setHeader('Content-Type', 'text/html;charset=utf-8');
  res.setHeader('Cache-Control', 'public,max-age=300,s-maxage=300');
  res.status(200).send(buildOgHtml({ title, desc, image, url, storeName }));
}
