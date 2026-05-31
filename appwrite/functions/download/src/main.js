import { Client, Databases, Query } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const token = req.query?.token
  if (!token) return res.json({ error: 'token required' }, 400)

  const tokensResult = await db.listDocuments(DB, 'download_tokens', [
    Query.equal('token', token),
    Query.limit(1),
  ])
  const tokenDoc = tokensResult.documents[0]
  if (!tokenDoc) return res.json({ error: 'Token inválido' }, 404)

  const now = new Date()
  if (tokenDoc.revokedAt) return res.json({ error: 'Token revogado' }, 403)
  if (new Date(tokenDoc.expiresAt) < now) return res.json({ error: 'Token expirado' }, 403)
  if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
    return res.json({ error: 'Limite de downloads atingido' }, 403)
  }

  // Link delivery — return URL, client opens it
  if (tokenDoc.deliveryLink) {
    await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
      downloadCount: tokenDoc.downloadCount + 1,
      lastDownloadAt: now.toISOString(),
    })
    return res.json({ type: 'link', redirectUrl: tokenDoc.deliveryLink })
  }

  // File delivery — resolve the product's fileKey, return it for client-side fetch
  let item, product
  try {
    item = await db.getDocument(DB, 'order_items', tokenDoc.orderItemId)
    product = await db.getDocument(DB, 'products', item.productId)
  } catch (err) {
    error('download: failed to resolve product — ' + err.message)
    return res.json({ error: 'Produto não encontrado' }, 404)
  }

  if (!product.fileKey) return res.json({ error: 'Nenhum arquivo disponível para este produto' }, 404)

  // Increment after all validation passes
  await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
    downloadCount: tokenDoc.downloadCount + 1,
    lastDownloadAt: now.toISOString(),
  })

  // Sanitize filename
  const safeName = (product.name || 'arquivo').replace(/[^\w\sÀ-ÿ.-]/g, '').trim() || 'arquivo'

  return res.json({
    type: 'file',
    fileId: product.fileKey,
    filename: `${safeName}.pdf`,
  })
}
