import { Client, Databases, ID, Messaging, Query } from 'node-appwrite'
import crypto from 'crypto'

function parseProduct(req) {
  if (req.bodyJson && typeof req.bodyJson === 'object') return req.bodyJson
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body)
  return {}
}

export default async ({ req, res, log, error }) => {
  let product
  try {
    product = parseProduct(req)
  } catch (err) {
    error(`Evento de produto inválido: ${err.message}`)
    return res.json({ ok: false, reason: 'invalid_event' }, 400)
  }

  if (!product.$id || !product.slug || !product.name) {
    log('Evento ignorado: produto sem id, slug ou nome.')
    return res.json({ ok: true, skipped: 'missing_product_fields' })
  }
  if (product.isActive === false || product.deletedAt) {
    log(`Produto ${product.$id} ignorado porque não está ativo.`)
    return res.json({ ok: true, skipped: 'inactive_product' })
  }

  const key = req.headers['x-appwrite-key'] || process.env.APPWRITE_FUNCTION_API_KEY
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(key)
  const databases = new Databases(client)
  const messaging = new Messaging(client)

  const userIds = new Set()
  let offset = 0
  while (offset < 5000) {
    const page = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      'profiles',
      [Query.equal('isActive', true), Query.limit(100), Query.offset(offset)],
    )
    for (const profile of page.documents) {
      if (profile.userId) userIds.add(profile.userId)
    }
    if (page.documents.length < 100) break
    offset += page.documents.length
  }

  const recipients = [...userIds]
  if (req.headers['x-notification-dry-run'] === 'true' || product.__dryRun === true) {
    log(`Teste seguro: ${recipients.length} usuário(s) ativo(s) seriam notificados.`)
    return res.json({ ok: true, dryRun: true, recipients: recipients.length })
  }
  if (!recipients.length) {
    log(`Produto ${product.$id}: nenhum usuário ativo para notificar.`)
    return res.json({ ok: true, recipients: 0 })
  }

  const productHash = crypto.createHash('sha256').update(product.$id).digest('hex').slice(0, 18)
  const title = 'Novidade no Site Pedagógico'
  const body = `Confira agora: ${String(product.name).slice(0, 90)}`
  const route = `/produto/${encodeURIComponent(product.slug)}`
  let batchesSent = 0

  for (let index = 0; index < recipients.length; index += 100) {
    const batch = recipients.slice(index, index + 100)
    const messageId = `product-${productHash}-${index / 100}`
    try {
      await messaging.createPush(
        messageId,
        title,
        body,
        [],
        batch,
        [],
        { route, productId: product.$id, tag: `product-${product.$id}` },
      )
      batchesSent += 1
    } catch (err) {
      if (err?.code === 409) {
        log(`Lote ${messageId} já enviado; repetição do evento ignorada.`)
        continue
      }
      throw err
    }
  }

  log(`Produto ${product.$id}: novidade enviada para ${recipients.length} usuários em ${batchesSent} lote(s).`)
  return res.json({ ok: true, recipients: recipients.length, batchesSent })
}
