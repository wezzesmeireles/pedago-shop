// Sitemap dinâmico: home, catálogo e todos os produtos ativos (lidos do Appwrite
// pelo proxy, bucket/collection com leitura pública). Servido em /sitemap.xml.
const SITE = 'https://www.sitepedagogico.com';
const APPWRITE = `${SITE}/v1`;
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';

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
      headers: { 'X-Appwrite-Project': PROJECT },
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

function urlTag(loc: string, priority: string, lastmod?: string) {
  return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${String(lastmod).slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;
}

export default async function handler(_req: any, res: any) {
  let products: Array<{ slug: string; updatedAt?: string }> = [];
  try { products = await fetchProducts(); } catch { /* sitemap básico mesmo se falhar */ }

  const urls = [
    urlTag(`${SITE}/`, '1.0'),
    urlTag(`${SITE}/catalogo`, '0.9'),
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
