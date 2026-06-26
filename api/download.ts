import { Readable } from 'stream'

const APPWRITE = 'https://appwrite.wsgestao.digital/v1'
const PROJECT = process.env.VITE_APPWRITE_PROJECT_ID ?? '6a1bc2b1000d09c3f5f1'
const DB = process.env.VITE_APPWRITE_DATABASE_ID ?? 'pedago-db'
const API_KEY = process.env.APPWRITE_API_KEY
const BUCKET = 'product-files'

function buildQueries(queries: any[]) {
  return queries.map((q) => 'queries[]=' + encodeURIComponent(JSON.stringify(q))).join('&')
}

function appwriteHeaders(): Record<string, string> {
  if (!API_KEY) return { 'X-Appwrite-Project': PROJECT }
  return { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = req.query?.token
  if (!token) return res.status(400).send('Token não informado.')

  // Bloqueia imediatamente se a chave de API não estiver configurada
  if (!API_KEY) {
    console.error('[download] APPWRITE_API_KEY não configurada no Vercel')
    return res.status(500).send('Servidor sem chave de API (APPWRITE_API_KEY). Configure em Vercel → Settings → Env Vars.')
  }

  try {
    // ── 1. Buscar token ───────────────────────────────────────────────────────
    const qs = buildQueries([
      { method: 'equal', attribute: 'token', values: [token] },
      { method: 'limit', values: [1] },
    ])
    const tokRes = await fetch(
      `${APPWRITE}/databases/${DB}/collections/download_tokens/documents?${qs}`,
      { headers: appwriteHeaders() },
    )
    if (!tokRes.ok) {
      const body = await tokRes.text()
      console.error('[download] token lookup failed', tokRes.status, body.slice(0, 300))
      return res.status(500).send(`Erro ao validar token (HTTP ${tokRes.status}). Tente novamente ou contate o suporte.`)
    }
    const tokData = await tokRes.json()
    const tokenDoc = tokData.documents?.[0]
    if (!tokenDoc) return res.status(404).send('Link inválido ou não encontrado. Verifique se o link está correto.')

    // ── 2. Validar ────────────────────────────────────────────────────────────
    const now = new Date()
    if (tokenDoc.revokedAt) return res.status(403).send('Este link foi revogado.')
    if (tokenDoc.expiresAt && new Date(tokenDoc.expiresAt) < now) {
      return res.status(410).send('Este link expirou. Acesse Meus Downloads para obter um novo.')
    }

    // ── 3. Incrementar contador (best-effort, não bloqueia) ───────────────────
    fetch(`${APPWRITE}/databases/${DB}/collections/download_tokens/documents/${tokenDoc.$id}`, {
      method: 'PATCH',
      headers: { ...appwriteHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        downloadCount: (tokenDoc.downloadCount ?? 0) + 1,
        lastDownloadAt: now.toISOString(),
      }),
    }).catch(() => {})

    // ── 4. Delivery por link externo ──────────────────────────────────────────
    if (tokenDoc.deliveryLink) {
      res.writeHead(302, { Location: tokenDoc.deliveryLink })
      return res.end()
    }

    // ── 5. Delivery por arquivo: resolver productId ───────────────────────────
    // Tokens criados por reconcile-orders/mp-webhook têm orderItemId mas não productId.
    // Tokens criados por send-product (admin) têm productId mas orderItemId vazio.
    let productId: string | null = tokenDoc.productId || null

    if (!productId && tokenDoc.orderItemId) {
      const itemRes = await fetch(
        `${APPWRITE}/databases/${DB}/collections/order_items/documents/${tokenDoc.orderItemId}`,
        { headers: appwriteHeaders() },
      )
      if (!itemRes.ok) {
        const body = await itemRes.text()
        console.error('[download] order_items lookup failed', itemRes.status, body.slice(0, 300), { orderItemId: tokenDoc.orderItemId })
        return res.status(500).send(`Erro ao buscar item do pedido (HTTP ${itemRes.status}). Contate o suporte.`)
      }
      const itemDoc = await itemRes.json()
      productId = itemDoc.productId ?? null
    }

    if (!productId) {
      console.error('[download] productId não encontrado no token nem no order_item', { tokenId: tokenDoc.$id, orderItemId: tokenDoc.orderItemId })
      return res.status(404).send('Produto não vinculado a este token. Contate o suporte.')
    }

    // ── 6. Buscar produto → fileKey ───────────────────────────────────────────
    const prodRes = await fetch(
      `${APPWRITE}/databases/${DB}/collections/products/documents/${productId}`,
      { headers: appwriteHeaders() },
    )
    if (!prodRes.ok) {
      const body = await prodRes.text()
      console.error('[download] product lookup failed', prodRes.status, body.slice(0, 300), { productId })
      return res.status(500).send(`Produto não encontrado no banco (HTTP ${prodRes.status}). Contate o suporte.`)
    }
    const prodDoc = await prodRes.json()

    const fileKey: string | null = prodDoc.fileKey ?? null
    const productName: string = prodDoc.name ?? 'arquivo'

    if (!fileKey) {
      console.error('[download] product has no fileKey', { productId, name: productName })
      return res.status(404).send(`O produto "${productName}" não possui arquivo configurado. Contate o suporte.`)
    }

    // ── 7. Buscar arquivo do Storage (stream) ─────────────────────────────────
    // Appwrite armazena sem extensão — remover se presente
    const fileId = String(fileKey).replace(/\.[^.]+$/, '')
    const storageUrl = `${APPWRITE}/storage/buckets/${BUCKET}/files/${fileId}/download?project=${encodeURIComponent(PROJECT)}`

    const storageRes = await fetch(storageUrl, {
      headers: { 'X-Appwrite-Project': PROJECT, 'X-Appwrite-Key': API_KEY },
    })
    if (!storageRes.ok) {
      const body = await storageRes.text()
      console.error('[download] storage fetch failed', storageRes.status, body.slice(0, 300), { fileId, BUCKET })
      return res.status(502).send(`Arquivo não disponível no servidor (HTTP ${storageRes.status}). Tente novamente ou contate o suporte.`)
    }

    // ── 8. Stream binário → cliente ───────────────────────────────────────────
    const safeName = productName
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9._-]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'arquivo'

    res.setHeader('Content-Type', storageRes.headers.get('content-type') || 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`)
    const cl = storageRes.headers.get('content-length')
    if (cl) res.setHeader('Content-Length', cl)
    res.setHeader('Cache-Control', 'no-store')
    res.status(200)

    if (!storageRes.body) return res.end()
    Readable.fromWeb(storageRes.body as any).pipe(res)

  } catch (err: any) {
    console.error('[api/download] erro inesperado:', err?.message, err?.stack?.slice(0, 500))
    if (!res.headersSent) res.status(500).send(`Erro interno: ${err?.message ?? 'desconhecido'}. Tente novamente.`)
  }
}
