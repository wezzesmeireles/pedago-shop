// anon key é pública — já está no bundle JS do frontend
const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://hdldxgbvkjcoesmfoglm.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? 'sb_publishable_W64H0XMozN-8ll1QaaNPyw_JC7SkAhF';
const SITE_URL = 'https://www.sitepedagogico.com';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';

const BOT_UA = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|googlebot|bingbot|slackbot|telegrambot|vkshare|ia_archiver|applebot/i;

// WhatsApp/Facebook NÃO renderizam WebP no preview. As capas são WebP, então
// servimos a og:image como JPEG pelo endpoint de preview do Appwrite (público,
// bucket product-covers = read any). Extrai o fileId tanto de URLs antigas do
// Supabase (.../product-covers/{id}.webp) quanto do Appwrite (.../files/{id}/view).
function toOgImage(coverUrl: string): string {
  if (!coverUrl) return `${SITE_URL}/og-default.jpg`;
  const m = coverUrl.match(/product-covers\/(?:files\/)?([^/?.]+)/);
  if (!m) return coverUrl;
  return `${SITE_URL}/v1/storage/buckets/product-covers/files/${m[1]}/preview?output=jpg&width=1200&quality=85&project=${PROJECT_ID}`;
}

async function supaGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
  });
  return res.ok ? (res.json() as Promise<any[]>) : [];
}

async function fetchCatalog() {
  const response = await fetch(`${SITE_URL}/api/catalog`, {
    headers: { Accept: 'application/json', 'user-agent': 'site-pedagogico-seo' },
  });
  if (!response.ok) return { products: [], categories: [] };
  return response.json() as Promise<{ products: any[]; categories: any[] }>;
}

function categorySeoSlug(value: unknown) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function esc(s: string) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function buildOgTags(o: { title: string; desc: string; image: string; url: string; storeName: string; jsonLd?: unknown }) {
  const jsonLd = o.jsonLd
    ? `<script type="application/ld+json">${JSON.stringify(o.jsonLd).replace(/</g, '\\u003c')}</script>`
    : '';
  return `
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:image" content="${esc(o.image)}">
<meta property="og:url" content="${esc(o.url)}">
<link rel="canonical" href="${esc(o.url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(o.storeName)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.desc)}">
<meta name="twitter:image" content="${esc(o.image)}">
${jsonLd}
`;
}

export default async function handler(req: any, res: any) {
  const ua = String(req.headers['user-agent'] ?? '');
  const slug = String(req.query.slug ?? '').replace(/[^a-z0-9-]/gi, '');
  const categorySlug = categorySeoSlug(req.query.category);
  const isBot = BOT_UA.test(ua);

  // Busca o index.html real para usá-lo como base
  // Isso evita loops infinitos se um navegador in-app (como o do WhatsApp) cair no regex de bot.
  let baseHtml = '';
  try {
    const spaRes = await fetch(`${SITE_URL}/index.html`, { headers: { 'user-agent': 'vercel-og-proxy' } });
    baseHtml = await spaRes.text();
  } catch {
    return res.redirect(302, `${SITE_URL}/`);
  }

  // Usuário normal: retorna o index.html original diretamente (rápido)
  if (!isBot) {
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(baseHtml);
  }

  // Bot: busca dados do produto e injeta as tags no head do index.html
  const [cfgRows, productRows, catalog] = await Promise.all([
    supaGet('site_config?key=eq.global&select=value&limit=1').catch(() => []),
    slug
      ? supaGet(`products?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&deleted_at=is.null&select=name,description,cover_image_url,slug&limit=1`).catch(() => [])
      : Promise.resolve([]),
    categorySlug ? fetchCatalog().catch(() => ({ products: [], categories: [] })) : Promise.resolve({ products: [], categories: [] }),
  ]);

  const cfg: any = (cfgRows as any[])?.[0]?.value ?? {};
  const product: any = (productRows as any[])?.[0] ?? null;
  const category: any = catalog.categories.find(
    (item: any) => categorySeoSlug(item.slug) === categorySlug,
  );
  const categoryProducts: any[] = category
    ? catalog.products.filter((item: any) => item.categoryId === category.$id)
    : [];

  const storeName: string = cfg.storeName ?? 'Site Pedagógico';
  const defaultImage: string = cfg.logoUrl ?? cfg.bannerImageUrl ?? '';
  const defaultDesc: string = cfg.seoDescription ?? 'Atividades pedagógicas digitais em PDF para professores e educadores.';
  const defaultTitle: string = cfg.seoTitle ?? storeName;

  const title = category
    ? `${category.name} — Atividades Pedagógicas em PDF | ${storeName}`
    : (product ? `${product.name} | ${storeName}` : defaultTitle);
  const rawDesc = product?.description?.trim();
  const desc = String(
    category
      ? `Atividades pedagógicas de ${category.name} em PDF, prontas para imprimir. Encontre ${categoryProducts.length} materiais com acesso digital.`
      : (rawDesc || (product ? `Baixe "${product.name}" em PDF. Entrega digital — receba imediatamente após o pagamento.` : defaultDesc)),
  ).slice(0, 160);
  const image: string = toOgImage(
    categoryProducts[0]?.coverImageUrl ?? product?.cover_image_url ?? defaultImage,
  );
  const url = category
    ? `${SITE_URL}/atividades/${categorySlug}`
    : (slug ? `${SITE_URL}/produto/${slug}` : SITE_URL);

  const jsonLd = category ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: title,
        description: desc,
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: categoryProducts.length,
          itemListElement: categoryProducts.slice(0, 50).map((item: any, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${SITE_URL}/produto/${encodeURIComponent(item.slug)}`,
            item: {
              '@type': 'Product',
              name: item.name,
              image: item.coverImageUrl || undefined,
              offers: {
                '@type': 'Offer',
                priceCurrency: 'BRL',
                price: Number(item.price || 0).toFixed(2),
                availability: 'https://schema.org/InStock',
                url: `${SITE_URL}/produto/${encodeURIComponent(item.slug)}`,
              },
            },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Atividades', item: `${SITE_URL}/catalogo` },
          { '@type': 'ListItem', position: 3, name: category.name, item: url },
        ],
      },
    ],
  } : undefined;

  const ogTags = buildOgTags({ title, desc, image, url, storeName, jsonLd });

  // Remove as tags antigas e injeta as novas antes de </head>
  let injectedHtml = baseHtml
    .replace(/<title>.*?<\/title>/i, '')
    .replace(/<meta[^>]*name="description"[^>]*>/i, '')
    .replace(/<meta[^>]*property="og:[^>]*>/gi, '')
    .replace(/<meta[^>]*name="twitter:[^>]*>/gi, '')
    .replace('</head>', ogTags + '</head>');

  res.setHeader('Content-Type', 'text/html;charset=utf-8');
  res.setHeader('Cache-Control', 'public,max-age=300,s-maxage=300');
  res.status(200).send(injectedHtml);
}
