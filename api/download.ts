// api/download.ts
// Rota de download que retorna o PDF diretamente com Content-Disposition: attachment.
// Usa streaming em vez de arrayBuffer() para evitar timeout no Vercel em PDFs grandes.

import { Readable } from 'stream'

const APPWRITE = 'https://appwrite.wsgestao.digital/v1'
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1'
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db'
const API_KEY = process.env.APPWRITE_API_KEY
const BUCKET = 'product-files'

function buildQueries(queries: any[]) {
  return queries.map((q) => 'queries[]=' + encodeURIComponent(JSON.stringify(q))).join('&')
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'X-Appwrite-Project': PROJECT }
  if (API_KEY) h['X-Appwrite-Key'] = API_KEY
  return h
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.query?.token
  if (!token) return res.status(400).send('Token não informado')

  if (!API_KEY) {
    console.error('[api/download] APPWRITE_API_KEY não configurada')
    return res.status(500).send('Configuração interna incompleta. Contate o suporte.')
  }

  try {
    // 1 — Find token document
    const qs = buildQueries([
      { method: 'equal', attribute: 'token', values: [token] },
      { method: 'limit', values: [1] },
    ])
    const tokRes = await fetch(`${APPWRITE}/databases/${DB}/collections/download_tokens/documents?${qs}`, {
      headers: authHeaders(),
    })
    if (!tokRes.ok) {
      console.error('[api/download] token lookup failed', tokRes.status, await tokRes.text())
      return res.status(502).send('Erro ao validar token')
    }
    const tokData = await tokRes.json()
    const tokenDoc = tokData.documents?.[0]
    if (!tokenDoc) return res.status(404).send('Token inválido ou expirado')

    // 2 — Validate
    const now = new Date()
    if (tokenDoc.revokedAt) return res.status(403).send('Acesso revogado')
    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < now) return res.status(410).send('Link expirado')

    // 3 — Increment download count (best-effort, non-blocking)
    fetch(`${APPWRITE}/databases/${DB}/collections/download_tokens/documents/${tokenDoc.$id}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadCount: (tokenDoc.downloadCount ?? 0) + 1, lastDownloadAt: now.toISOString() }),
    }).catch(() => {})

    // 4 — Link delivery: redirect
    if (tokenDoc.deliveryLink) {
      res.writeHead(302, { Location: tokenDoc.deliveryLink })
      return res.end()
    }

    // 5 — File delivery: resolve product → fileKey
    let productId = tokenDoc.productId
    if (!productId) {
      const itemRes = await fetch(
        `${APPWRITE}/databases/${DB}/collections/order_items/documents/${tokenDoc.orderItemId}`,
        { headers: authHeaders() },
      )
      if (!itemRes.ok) {
        console.error('[api/download] order_items lookup failed', itemRes.status)
        return res.status(502).send('Erro ao buscar item do pedido')
      }
      const itemDoc = await itemRes.json()
      productId = itemDoc.productId
    }
    if (!productId) return res.status(404).send('Produto não encontrado')

    const prodRes = await fetch(
      `${APPWRITE}/databases/${DB}/collections/products/documents/${productId}`,
      { headers: authHeaders() },
    )
    if (!prodRes.ok) {
      console.error('[api/download] products lookup failed', prodRes.status)
      return res.status(502).send('Erro ao buscar produto')
    }
    const prodDoc = await prodRes.json()

    const fileKey = prodDoc.fileKey
    if (!fileKey) {
      console.error('[api/download] product has no fileKey', productId)
      return res.status(404).send('Arquivo não encontrado para este produto. Contate o suporte.')
    }

    // Appwrite file IDs don't have extensions; strip if present
    const fileId = String(fileKey).replace(/\.[^.]+$/, '')

    // 6 — Fetch file from Appwrite Storage (stream, not buffer)
    const storageUrl = `${APPWRITE}/storage/buckets/${BUCKET}/files/${fileId}/download?project=${encodeURIComponent(PROJECT)}`
    const storageRes = await fetch(storageUrl, {
      headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY },
    })
    if (!storageRes.ok) {
      console.error('[api/download] storage fetch failed', storageRes.status, fileId)
      return res.status(502).send('Arquivo não disponível no momento. Tente novamente.')
    }

    // 7 — Stream binary to client (evita carregar tudo em RAM e timeout no Vercel)
    const safeName = (prodDoc.name || 'arquivo')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'arquivo'
    const filename = `${safeName}.pdf`

    res.setHeader('Content-Type', storageRes.headers.get('content-type') || 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    const contentLength = storageRes.headers.get('content-length')
    if (contentLength) res.setHeader('Content-Length', contentLength)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200)

    if (!storageRes.body) return res.end()
    Readable.fromWeb(storageRes.body as any).pipe(res)

  } catch (err: any) {
    console.error('[api/download]', err)
    if (!res.headersSent) res.status(500).send('Erro interno. Tente novamente em instantes.')
  }
}
