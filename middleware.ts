const BOT_UA = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|googlebot|bingbot|slackbot|telegrambot|vkshare|ia_archiver|applebot/i;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? '';
const SITE_URL = 'https://sitepedagogico.com.br';

export const config = {
  matcher: ['/', '/produto/:path*', '/catalogo', '/catalogo/:path*'],
};

async function getProduct(slug: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&deleted_at=is.null&select=name,description,cover_image_url,price,slug&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' } },
    );
    const rows: any[] = await res.json();
    return rows?.[0] ?? null;
  } catch { return null; }
}

async function getSiteConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_config?key=eq.global&select=value&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Accept: 'application/json' } },
    );
    const rows: any[] = await res.json();
    return (rows?.[0]?.value as Record<string, any>) ?? null;
  } catch { return null; }
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function html(title: string, desc: string, image: string, url: string, storeName: string) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(storeName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0;url=${esc(url)}">
</head><body>Redirecionando...</body></html>`;
}

export default async function middleware(req: Request) {
  const ua = req.headers.get('user-agent') ?? '';
  if (!BOT_UA.test(ua)) return; // usuário normal → passa direto para o SPA

  const { pathname } = new URL(req.url);
  const cfg = await getSiteConfig();

  const storeName: string = cfg?.storeName ?? 'Site Pedagógico';
  const defaultImage: string = cfg?.logoUrl ?? cfg?.bannerImageUrl ?? `${SITE_URL}/og-default.jpg`;
  const defaultDesc: string = cfg?.seoDescription ?? 'Atividades pedagógicas digitais em PDF para professores e educadores.';
  const defaultTitle: string = cfg?.seoTitle ?? storeName;

  if (pathname.startsWith('/produto/')) {
    const slug = pathname.slice('/produto/'.length).replace(/\/$/, '');
    if (slug) {
      const product = await getProduct(slug);
      if (product) {
        return new Response(
          html(
            `${product.name} | ${storeName}`,
            String(product.description ?? defaultDesc).slice(0, 160),
            product.cover_image_url || defaultImage,
            `${SITE_URL}/produto/${product.slug}`,
            storeName,
          ),
          { headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=300,s-maxage=300' } },
        );
      }
    }
  }

  return new Response(
    html(defaultTitle, defaultDesc, defaultImage, `${SITE_URL}${pathname === '/' ? '' : pathname}`, storeName),
    { headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=300,s-maxage=300' } },
  );
}
