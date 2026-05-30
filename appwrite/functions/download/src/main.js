import { Client, Databases, Query } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const token = req.query?.token
  if (!token) {
    return res.json({ error: 'token is required' }, 400)
  }

  // Find the download token document
  const tokensResult = await db.listDocuments(DB, 'download_tokens', [
    Query.equal('token', token),
    Query.limit(1),
  ])
  const tokenDoc = tokensResult.documents[0]

  if (!tokenDoc) {
    return res.json({ error: 'Invalid or expired token' }, 404)
  }

  const now = new Date()

  if (tokenDoc.revokedAt) {
    return res.json({ error: 'This download has been revoked' }, 403)
  }
  if (new Date(tokenDoc.expiresAt) < now) {
    return res.json({ error: 'Download token has expired' }, 403)
  }
  if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
    return res.json({ error: 'Download limit reached' }, 403)
  }

  // Increment download counter before serving
  await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
    downloadCount: tokenDoc.downloadCount + 1,
    lastDownloadAt: now.toISOString(),
  })

  // If delivery is an external link, return it for redirect
  if (tokenDoc.deliveryLink) {
    return res.json({ type: 'link', url: tokenDoc.deliveryLink })
  }

  // Delivery is a stored file — fetch product to get fileKey
  const item = await db.getDocument(DB, 'order_items', tokenDoc.orderItemId)
  const product = await db.getDocument(DB, 'products', item.productId)

  if (!product.fileKey) {
    error(`Product ${item.productId} has no fileKey`)
    return res.json({ error: 'File not available' }, 404)
  }

  // Return file info for client-side download from Appwrite Storage
  return res.json({
    type: 'storage',
    fileId: product.fileKey,
    filename: `${product.name.replace(/[^a-zA-Z0-9\s-]/g, '').trim()}.pdf`,
  })
}
