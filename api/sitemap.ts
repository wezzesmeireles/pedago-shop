import { listDocuments, query } from '../server/appwrite';

// Fonte única do sitemap de produção. As URLs de categoria são páginas reais,
// rastreáveis e canônicas; os filtros antigos por query continuam funcionando,
// mas deixam de competir com elas no Google.
const SITE = 'https://www.sitepedagogico.com';

type CatalogDocument = {
  slug?: string;
  updatedAt?: string;
  $updatedAt?: string;
};

function cleanSlug(value: unknown) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function urlTag(loc: string, priority: string, lastmod?: string) {
  return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${String(lastmod).slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;
}

export default async function handler(_req: any, res: any) {
  let products: CatalogDocument[] = [];
  let categories: CatalogDocument[] = [];

  try {
    const [productResult, categoryResult]: any[] = await Promise.all([
      listDocuments('products', [
        query('equal', 'isActive', [true]),
        query('isNull', 'deletedAt'),
        query('limit', undefined, [500]),
      ]),
      listDocuments('categories', [
        query('equal', 'isActive', [true]),
        query('limit', undefined, [200]),
      ]),
    ]);
    products = productResult.documents ?? [];
    categories = categoryResult.documents ?? [];
  } catch (error) {
    console.error('[sitemap]', error);
  }

  const categoryUrls = [...new Set(categories.map((category) => cleanSlug(category.slug)).filter(Boolean))];
  const urls = [
    urlTag(`${SITE}/`, '1.0'),
    urlTag(`${SITE}/catalogo`, '0.9'),
    ...categoryUrls.map((slug) => urlTag(`${SITE}/atividades/${encodeURIComponent(slug)}`, '0.8')),
    ...products
      .filter((product) => product.slug)
      .map((product) => urlTag(
        `${SITE}/produto/${encodeURIComponent(String(product.slug))}`,
        '0.7',
        product.updatedAt || product.$updatedAt,
      )),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join('\n') +
    `\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
