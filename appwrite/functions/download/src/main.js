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
  if (!tokenDoc) return res.json({ error: 'Invalid token' }, 404)

  const now = new Date()
  if (tokenDoc.revokedAt) return res.json({ error: 'Token revoked' }, 403)
  if (new Date(tokenDoc.expiresAt) < now) return res.json({ error: 'Token expired' }, 403)
  if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
    return res.json({ error: 'Download limit reached' }, 403)
  }

  // Link delivery — increment count only after confirming redirect is valid
  if (tokenDoc.deliveryLink) {
    await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
      downloadCount: tokenDoc.downloadCount + 1,
      lastDownloadAt: now.toISOString(),
    })
    return res.redirect(tokenDoc.deliveryLink)
  }

  // File delivery — fetch file first, then increment count
  const item = await db.getDocument(DB, 'order_items', tokenDoc.orderItemId)
  const product = await db.getDocument(DB, 'products', item.productId)

  if (!product.fileKey) return res.json({ error: 'No file for this product' }, 404)

  const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/product-files/files/${product.fileKey}/download?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`
  const fileResp = await fetch(fileUrl, {
    headers: { 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
  })

  if (!fileResp.ok) return res.json({ error: 'File not found in storage' }, 404)

  // Increment only after confirming file exists and is readable
  await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
    downloadCount: tokenDoc.downloadCount + 1,
    lastDownloadAt: now.toISOString(),
  })

  const buffer = await fileResp.arrayBuffer()
  return res.binary(Buffer.from(buffer), 200, {
    'Content-Type': fileResp.headers.get('content-type') || 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${product.name}.pdf"`,
  })
}
