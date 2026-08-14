import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.sitepedagogico.com';

async function generateSitemap() {
  console.log('Generating sitemap...');
  try {
    const response = await fetch(`${BASE_URL}/api/catalog`);
    if (!response.ok) throw new Error(`Catalog API returned ${response.status}`);

    const { products = [], categories = [] } = await response.json();
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/catalogo</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

    // Add Categories
    for (const cat of categories) {
      if (cat.isActive === false) continue;
      xml += `  <url>
    <loc>${BASE_URL}/catalogo?categoria=${encodeURIComponent(cat.slug || cat.$id)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }

    // Add Products
    for (const prod of products) {
      if (prod.isActive === false || prod.deletedAt) continue;
      const lastmod = prod.$updatedAt ? prod.$updatedAt.split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>
    <loc>${BASE_URL}/produto/${prod.slug || prod.$id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
    }
    
    xml += `</urlset>`;
    
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
    console.log(`Sitemap successfully generated at public/sitemap.xml with ${products.length} products and ${categories.length} categories.`);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();
