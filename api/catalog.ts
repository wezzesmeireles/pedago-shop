import { listDocuments, publicProduct, query } from '../server/appwrite';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const [products, categories]: any[] = await Promise.all([
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

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
    return res.json({
      products: (products.documents ?? []).map(publicProduct),
      categories: categories.documents ?? [],
    });
  } catch (error) {
    console.error('[catalog]', error);
    return res.status(500).json({ error: 'Não foi possível carregar o catálogo.' });
  }
}

