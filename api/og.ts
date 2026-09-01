const SITE_URL = 'https://www.sitepedagogico.com';
const APPWRITE_URL = process.env.APPWRITE_ENDPOINT ?? 'https://appwrite.wsgestao.digital/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;

function appwriteHeaders() {
  return {
    'X-Appwrite-Project': PROJECT_ID,
    ...(API_KEY ? { 'X-Appwrite-Key': API_KEY } : {}),
    Accept: 'application/json',
  };
}

const BOT_UA = /facebookexternalhit|whatsapp|twitterbot|linkedinbot|googlebot|google-inspectiontool|googleother|storebot-google|adsbot-google|bingbot|slackbot|telegrambot|vkshare|ia_archiver|applebot/i;

function toOgImage(coverUrl: string): string {
  if (!coverUrl) return `${SITE_URL}/site-pedagogico-logo.png`;
  const match = coverUrl.match(/product-covers\/(?:files\/)?([^/?.]+)/);
  if (!match) return coverUrl;
  return `${SITE_URL}/v1/storage/buckets/product-covers/files/${match[1]}/preview?output=jpg&width=1200&quality=85&project=${PROJECT_ID}`;
}

function query(method: string, attribute?: string, values?: unknown[]) {
  const payload: Record<string, unknown> = { method };
  if (attribute) payload.attribute = attribute;
  if (values) payload.values = values;
  return JSON.stringify(payload);
}

async function appwriteList(collection: string, queries: string[]) {
  const params = queries.map((item) => `queries[]=${encodeURIComponent(item)}`).join('&');
  const response = await fetch(
    `${APPWRITE_URL}/databases/${DATABASE_ID}/collections/${collection}/documents?${params}`,
    { headers: appwriteHeaders() },
  );
  if (!response.ok) return [];
  const data: any = await response.json();
  return data.documents ?? [];
}

async function fetchSiteConfig() {
  const response = await fetch(
    `${APPWRITE_URL}/databases/${DATABASE_ID}/collections/site_config/documents/global`,
    { headers: appwriteHeaders() },
  );
  if (!response.ok) return {};
  const document: any = await response.json();
  try {
    return typeof document.value === 'string' ? JSON.parse(document.value) : (document.value ?? {});
  } catch {
    return {};
  }
}

async function fetchProduct(slug: string) {
  const rows = await appwriteList('products', [
    query('equal', 'slug', [slug]),
    query('equal', 'isActive', [true]),
    query('isNull', 'deletedAt'),
    query('limit', undefined, [1]),
  ]);
  return rows[0] ?? null;
}

async function fetchCategory(slug: string) {
  const rows = await appwriteList('categories', [
    query('equal', 'slug', [slug]),
    query('equal', 'isActive', [true]),
    query('limit', undefined, [1]),
  ]);
  return rows[0] ?? null;
}

function escapeHtml(value: string) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function buildHeadTags(options: {
  title: string;
  description: string;
  image: string;
  url: string;
  storeName: string;
  type?: 'website' | 'product';
  price?: string;
  schemas: unknown[];
}) {
  const productTags = options.price
    ? `<meta property="product:price:amount" content="${escapeHtml(options.price)}">
<meta property="product:price:currency" content="BRL">`
    : '';

  return `
<title>${escapeHtml(options.title)}</title>
<meta name="description" content="${escapeHtml(options.description)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${escapeHtml(options.url)}">
<meta property="og:title" content="${escapeHtml(options.title)}">
<meta property="og:description" content="${escapeHtml(options.description)}">
<meta property="og:image" content="${escapeHtml(options.image)}">
<meta property="og:url" content="${escapeHtml(options.url)}">
<meta property="og:type" content="${options.type ?? 'website'}">
<meta property="og:site_name" content="${escapeHtml(options.storeName)}">
${productTags}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(options.title)}">
<meta name="twitter:description" content="${escapeHtml(options.description)}">
<meta name="twitter:image" content="${escapeHtml(options.image)}">
${options.schemas.map((schema) => `<script type="application/ld+json">${jsonLd(schema)}</script>`).join('\n')}
`;
}

function injectHead(baseHtml: string, tags: string) {
  return baseHtml
    .replace(/<title>.*?<\/title>/i, '')
    .replace(/<meta[^>]*name="description"[^>]*>/gi, '')
    .replace(/<meta[^>]*name="robots"[^>]*>/gi, '')
    .replace(/<meta[^>]*property="og:[^>]*>/gi, '')
    .replace(/<meta[^>]*property="product:[^>]*>/gi, '')
    .replace(/<meta[^>]*name="twitter:[^>]*>/gi, '')
    .replace(/<link[^>]*rel="canonical"[^>]*>/gi, '')
    .replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `${tags}</head>`);
}

export default async function handler(req: any, res: any) {
  const userAgent = String(req.headers['user-agent'] ?? '');
  const slug = String(req.query.slug ?? '').replace(/[^a-z0-9-]/gi, '');
  const isCatalog = String(req.query.catalog ?? '') === '1';
  const categorySlug = String(req.query.categoria ?? '').slice(0, 120);
  const isBot = BOT_UA.test(userAgent);

  let baseHtml = '';
  try {
    const spaResponse = await fetch(`${SITE_URL}/index.html`, {
      headers: { 'user-agent': 'vercel-seo-proxy' },
    });
    baseHtml = await spaResponse.text();
  } catch {
    return res.redirect(302, SITE_URL);
  }

  if (!isBot) {
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(baseHtml);
  }

  const [config, product, category] = await Promise.all([
    fetchSiteConfig().catch(() => ({})),
    slug ? fetchProduct(slug).catch(() => null) : Promise.resolve(null),
    isCatalog && categorySlug ? fetchCategory(categorySlug).catch(() => null) : Promise.resolve(null),
  ]);

  if (slug && !product) {
    res.setHeader('Content-Type', 'text/html;charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.status(404).send(baseHtml);
  }

  const storeName = String(config.storeName || 'Site Pedagógico');
  const defaultImage = toOgImage(String(config.logoUrl || config.bannerImageUrl || ''));
  const homeTitle = 'Atividades Pedagógicas em PDF para Imprimir | Site Pedagógico';
  const homeDescription = 'Atividades pedagógicas lúdicas e prontas para imprimir em PDF para educação infantil e anos iniciais. Compra segura e download imediato.';

  let title = homeTitle;
  let description = homeDescription;
  let image = defaultImage;
  let url = SITE_URL;
  let type: 'website' | 'product' = 'website';
  let price: string | undefined;
  const schemas: unknown[] = [];

  if (product) {
    title = `${product.name} em PDF | Site Pedagógico`;
    description = String(
      product.description?.trim() ||
      `Baixe ${product.name} em PDF, pronto para imprimir. Material pedagógico com acesso imediato após a compra.`,
    ).replace(/\s+/g, ' ').slice(0, 158);
    image = toOgImage(String(product.coverImageUrl || ''));
    url = `${SITE_URL}/produto/${product.slug}`;
    type = 'product';
    price = Number(product.price).toFixed(2);

    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description,
      image: [image],
      sku: product.$id,
      category: 'Material pedagógico digital',
      brand: { '@type': 'Brand', name: storeName },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'BRL',
        price,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
      },
    });
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Catálogo', item: `${SITE_URL}/catalogo` },
        { '@type': 'ListItem', position: 3, name: product.name, item: url },
      ],
    });
  } else if (isCatalog) {
    const categoryName = String(category?.name || '').trim();
    title = categoryName
      ? `${categoryName}: Atividades Pedagógicas em PDF | Site Pedagógico`
      : 'Catálogo de Atividades Pedagógicas em PDF | Site Pedagógico';
    description = categoryName
      ? `Atividades pedagógicas de ${categoryName} em PDF, prontas para imprimir. Materiais lúdicos com download imediato.`
      : 'Encontre atividades pedagógicas em PDF para educação infantil e anos iniciais, prontas para imprimir e usar em sala de aula.';
    url = categoryName
      ? `${SITE_URL}/catalogo?categoria=${encodeURIComponent(category.slug)}`
      : `${SITE_URL}/catalogo`;
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url,
      isPartOf: { '@type': 'WebSite', name: storeName, url: SITE_URL },
    });
  } else {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: storeName,
      url: SITE_URL,
      logo: defaultImage,
      sameAs: [config.socialLinks?.instagram, config.socialLinks?.tiktok].filter(Boolean),
    });
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: storeName,
      url: SITE_URL,
      description: homeDescription,
    });
  }

  const tags = buildHeadTags({ title, description, image, url, storeName, type, price, schemas });
  const html = injectHead(baseHtml, tags);

  res.setHeader('Content-Type', 'text/html;charset=utf-8');
  res.setHeader('Cache-Control', 'public,max-age=300,s-maxage=300');
  return res.status(200).send(html);
}
