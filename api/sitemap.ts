// Sitemap dinâmico: home, catálogo e todos os produtos ativos (lidos do Appwrite
// pelo proxy, bucket/collection com leitura pública). Servido em /sitemap.xml.
const SITE = 'https://www.sitepedagogico.com';
const APPWRITE = process.env.APPWRITE_ENDPOINT ?? 'https://appwrite.wsgestao.digital/v1';
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;

function appwriteHeaders() {
  return { 'X-Appwrite-Project': PROJECT, ...(API_KEY ? { 'X-Appwrite-Key': API_KEY } : {}) };
}

async function fetchProducts(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  const out: Array<{ slug: string; updatedAt?: string }> = [];
  let offset = 0;
  for (let page = 0; page < 30; page++) {
    const queries = [
      JSON.stringify({ method: 'equal', attribute: 'isActive', values: [true] }),
      JSON.stringify({ method: 'isNull', attribute: 'deletedAt' }),
      JSON.stringify({ method: 'select', values: ['slug', 'updatedAt'] }),
      JSON.stringify({ method: 'limit', values: [100] }),
      JSON.stringify({ method: 'offset', values: [offset] }),
    ];
    const qs = queries.map((q) => 'queries[]=' + encodeURIComponent(q)).join('&');
    const res = await fetch(`${APPWRITE}/databases/${DB}/collections/products/documents?${qs}`, {
      headers: appwriteHeaders(),
    });
    if (!res.ok) break;
    const data: any = await res.json();
    const docs: any[] = data.documents || [];
    for (const d of docs) if (d.slug) out.push({ slug: d.slug, updatedAt: d.updatedAt });
    if (docs.length < 100) break;
    offset += 100;
  }
  return out;
}

async function fetchCategories(): Promise<Array<{ slug: string; updatedAt?: string }>> {
  const queries = [
    JSON.stringify({ method: 'equal', attribute: 'isActive', values: [true] }),
    JSON.stringify({ method: 'select', values: ['slug', 'updatedAt'] }),
    JSON.stringify({ method: 'limit', values: [100] }),
  ];
  const qs = queries.map((q) => 'queries[]=' + encodeURIComponent(q)).join('&');
  const res = await fetch(`${APPWRITE}/databases/${DB}/collections/categories/documents?${qs}`, {
    headers: appwriteHeaders(),
  });
  if (!res.ok) return [];
  const data: any = await res.json();
  return (data.documents || [])
    .filter((category: any) => category.slug)
    .map((category: any) => ({ slug: category.slug, updatedAt: category.updatedAt }));
}

function urlTag(loc: string, priority: string, lastmod?: string) {
  return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${String(lastmod).slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;
}

export default async function handler(_req: any, res: any) {
  let products: Array<{ slug: string; updatedAt?: string }> = [];
  let categories: Array<{ slug: string; updatedAt?: string }> = [];
  try {
    [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
  } catch { /* sitemap básico mesmo se uma fonte falhar */ }

  const urls = [
    urlTag(`${SITE}/`, '1.0'),
    urlTag(`${SITE}/catalogo`, '0.9'),
    urlTag(`${SITE}/quem-somos`, '0.6'),
    urlTag(`${SITE}/contato`, '0.5'),
    urlTag(`${SITE}/politica-privacidade`, '0.3'),
    ...categories.map((category) =>
      urlTag(`${SITE}/catalogo?categoria=${encodeURIComponent(category.slug)}`, '0.8', category.updatedAt),
    ),
    ...products.map((p) => urlTag(`${SITE}/produto/${p.slug}`, '0.7', p.updatedAt)),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') +
    `\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(xml);
}
