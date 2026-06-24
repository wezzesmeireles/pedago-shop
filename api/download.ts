// api/download.ts
// Rota de download que retorna o PDF diretamente com Content-Disposition: attachment.
// Funciona em qualquer navegador, inclusive Instagram/Facebook (in-app webview),
// porque o download é nativo do HTTP, não via blob+JS.

const APPWRITE = 'https://appwrite.wsgestao.digital/v1';
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1';
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db';
const API_KEY = process.env.APPWRITE_API_KEY;
const BUCKET = 'product-files';

function buildQueries(queries: any[]) {
  return queries.map((q) => 'queries[]=' + encodeURIComponent(JSON.stringify(q))).join('&');
}

function authHeaders() {
  return { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY, 'Content-Type': 'application/json' };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end();

  const token = req.query?.token;
  if (!token) return res.status(400).send('Token não informado');

  try {
    // 1 — Find token document
    const qs = buildQueries([
      { method: 'equal', attribute: 'token', values: [token] },
      { method: 'limit', values: [1] },
    ]);
    const tokRes = await fetch(`${APPWRITE}/databases/${DB}/collections/download_tokens/documents?${qs}`, {
      headers: authHeaders(),
    });
    if (!tokRes.ok) return res.status(502).send('Erro ao validar token');
    const tokData = await tokRes.json();
    const tokenDoc = tokData.documents?.[0];
    if (!tokenDoc) return res.status(404).send('Token inválido');

    // 2 — Validate
    const now = new Date();
    if (tokenDoc.revokedAt) return res.status(403).send('Token revogado');
    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < now) return res.status(410).send('Token expirado');

    // 3 — Increment download count (best-effort)
    fetch(`${APPWRITE}/databases/${DB}/collections/download_tokens/documents/${tokenDoc.$id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ downloadCount: (tokenDoc.downloadCount ?? 0) + 1, lastDownloadAt: now.toISOString() }),
    }).catch(() => {});

    // 4 — Link delivery: redirect
    if (tokenDoc.deliveryLink) {
      res.writeHead(302, { Location: tokenDoc.deliveryLink });
      return res.end();
    }

    // 5 — File delivery: resolve product → fileKey
    let productId = tokenDoc.productId;
    if (!productId) {
      const itemRes = await fetch(`${APPWRITE}/databases/${DB}/collections/order_items/documents/${tokenDoc.orderItemId}`, { headers: authHeaders() });
      if (!itemRes.ok) return res.status(502).send('Erro ao buscar item');
      const itemDoc = await itemRes.json();
      productId = itemDoc.productId;
    }
    if (!productId) return res.status(404).send('Produto não encontrado');

    const prodRes = await fetch(`${APPWRITE}/databases/${DB}/collections/products/documents/${productId}`, { headers: authHeaders() });
    if (!prodRes.ok) return res.status(502).send('Erro ao buscar produto');
    const prodDoc = await prodRes.json();

    const fileKey = prodDoc.fileKey;
    if (!fileKey) return res.status(404).send('Nenhum arquivo para este produto');

    const fileId = String(fileKey).replace(/\.[^.]+$/, '');

    // 6 — Fetch file from Storage via server API key
    const storageRes = await fetch(
      `${APPWRITE}/storage/buckets/${BUCKET}/files/${fileId}/download?project=${encodeURIComponent(PROJECT)}`,
      { headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY } },
    );
    if (!storageRes.ok) return res.status(502).send('Erro ao ler arquivo');

    // 7 — Stream binary to client
    const buffer = Buffer.from(await storageRes.arrayBuffer());
    const safeName = (prodDoc.name || 'arquivo')
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'arquivo';
    const filename = `${safeName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).end(buffer);
  } catch (err: any) {
    console.error('[api/download]', err);
    if (!res.headersSent) res.status(500).send('Erro interno. Tente novamente.');
  }
}
