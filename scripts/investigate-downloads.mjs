// Investigate why specific customers can't download — and scan everyone else.
//
// Run:  APPWRITE_API_KEY=xxxxx node scripts/investigate-downloads.mjs
// (optionally pass extra emails as args)

import { Client, Databases, Users, Storage, Query } from 'node-appwrite'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '.env.migration') })

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://sitepedagogico.com.br/v1'
const PROJECT = process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1'
const DB = process.env.APPWRITE_DATABASE_ID || 'pedago-db'
const KEY = process.env.APPWRITE_API_KEY
const BUCKET = 'product-files'

if (!KEY) { console.error('Set APPWRITE_API_KEY env var (server key with databases/users/storage read).'); process.exit(1) }

// Pass the customer emails to investigate as args:
//   APPWRITE_API_KEY=xxx node scripts/investigate-downloads.mjs a@x.com b@y.com
const TARGETS = process.argv.slice(2).map((e) => e.trim().toLowerCase())

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(KEY)
const db = new Databases(client)
const users = new Users(client)
const storage = new Storage(client)

const hasUserRead = (doc, uid) => (doc.$permissions || []).includes(`read("user:${uid}")`)

async function listAll(col, queries = []) {
  const out = []; let cursor = null
  while (true) {
    const q = [...queries, Query.limit(100)]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const r = await db.listDocuments(DB, col, q)
    out.push(...r.documents)
    if (r.documents.length < 100) break
    cursor = r.documents[r.documents.length - 1].$id
  }
  return out
}

// cache product lookups
const productCache = new Map()
async function getProduct(id) {
  if (productCache.has(id)) return productCache.get(id)
  let p = null
  try { p = await db.getDocument(DB, 'products', id) } catch {}
  productCache.set(id, p)
  return p
}
const fileExists = new Map()
async function fileOk(fileId) {
  if (fileExists.has(fileId)) return fileExists.get(fileId)
  let ok = false
  try { await storage.getFile(BUCKET, fileId); ok = true } catch {}
  fileExists.set(fileId, ok)
  return ok
}

async function investigate(email) {
  console.log('\n' + '='.repeat(70))
  console.log('👤', email)
  const found = await users.list([Query.equal('email', email), Query.limit(10)])
  if (!found.total) { console.log('   ❌ NÃO existe usuário com esse email no Appwrite.'); return }
  for (const u of found.users) {
    console.log(`   user $id=${u.$id}  name="${u.name}"  phone="${u.phone || ''}"  labels=[${u.labels||[]}]  emailVerified=${u.emailVerification}`)
    // profile (phone gate uses profile.phone too)
    let prof = null
    try { prof = await db.getDocument(DB, 'profiles', u.$id) } catch {}
    if (!prof) console.log('   ⚠️  SEM profile (pode cair no gate de telefone / não aparecer no admin)')
    else console.log(`   profile: phone="${prof.phone||''}" role=${prof.role} active=${prof.isActive}`)
    if (!u.phone && !(prof && prof.phone)) console.log('   🔴 SEM TELEFONE → o router redireciona para /auth/whatsapp ANTES dos downloads.')

    // orders (all statuses)
    const orders = await listAll('orders', [Query.equal('userId', u.$id), Query.orderDesc('$createdAt')])
    console.log(`   pedidos: ${orders.length} (${orders.map(o=>o.status).join(', ') || 'nenhum'})`)
    const paid = orders.filter(o => o.status === 'PAID')
    if (!paid.length) { console.log('   🔴 nenhum pedido PAID → nada para baixar.'); continue }

    for (const o of paid) {
      console.log(`   • Pedido ${o.orderNumber} ($id=${o.$id})  ownerRead=${hasUserRead(o,u.$id)}`)
      const items = await db.listDocuments(DB, 'order_items', [Query.equal('orderId', o.$id), Query.limit(100)])
      for (const it of items.documents) {
        const toks = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.limit(10)])
        const live = toks.documents.filter(t => !t.revokedAt && new Date(t.expiresAt) > new Date())
        const prod = await getProduct(it.productId)
        const fileKey = prod?.fileKey ? String(prod.fileKey).replace(/\.[^.]+$/, '') : null
        const storageOk = fileKey ? await fileOk(fileKey) : false
        const tokPerm = toks.documents.every(t => hasUserRead(t, u.$id))
        const flags = []
        if (!toks.total) flags.push('🔴 SEM TOKEN')
        else if (!live.length) flags.push('🔴 token revogado/expirado')
        if (!prod) flags.push('🔴 produto sumiu')
        else if (!prod.fileKey && !it.deliveryLink) flags.push('🔴 produto sem fileKey nem link')
        else if (fileKey && !storageOk) flags.push('🔴 arquivo não existe no Storage')
        if (toks.total && !tokPerm) flags.push('🟠 token sem ownerRead (não aparece p/ cliente)')
        if (!hasUserRead(it, u.$id)) flags.push('🟠 item sem ownerRead')
        console.log(`       - "${it.productName}" tokens=${toks.total}(live ${live.length}) fileKey=${fileKey||'—'} storage=${storageOk?'ok':'—'} link=${it.deliveryLink?'sim':'—'} ${flags.join(' ') || '✅'}`)
      }
    }
  }
}

// ── per-target ──
for (const email of TARGETS) {
  try { await investigate(email) } catch (e) { console.log('   erro:', e.message) }
}

// ── global scan ("os demais") ──
console.log('\n' + '#'.repeat(70))
console.log('SCAN GERAL (todos os pedidos PAID)')
const allOrders = await listAll('orders', [Query.equal('status', 'PAID')])
console.log('pedidos PAID:', allOrders.length)
let noTokens = 0, noPerm = 0, noFile = 0, checked = 0
const samplesNoFile = new Set()
for (const o of allOrders) {
  const items = await db.listDocuments(DB, 'order_items', [Query.equal('orderId', o.$id), Query.limit(100)])
  for (const it of items.documents) {
    checked++
    const toks = await db.listDocuments(DB, 'download_tokens', [Query.equal('orderItemId', it.$id), Query.limit(5)])
    const live = toks.documents.filter(t => !t.revokedAt && new Date(t.expiresAt) > new Date())
    if (!live.length) noTokens++
    if (toks.total && o.userId && !toks.documents.every(t => hasUserRead(t, o.userId))) noPerm++
    const prod = await getProduct(it.productId)
    const fileKey = prod?.fileKey ? String(prod.fileKey).replace(/\.[^.]+$/, '') : null
    if (!fileKey && !it.deliveryLink) { noFile++; if (prod) samplesNoFile.add(prod.name) }
    else if (fileKey && !(await fileOk(fileKey))) { noFile++; samplesNoFile.add((prod?.name||'?') + ' (arquivo ausente)') }
  }
}
console.log(`itens verificados: ${checked}`)
console.log(`🔴 itens sem token vivo:        ${noTokens}`)
console.log(`🟠 tokens sem ownerRead:        ${noPerm}`)
console.log(`🔴 itens sem arquivo entregável:${noFile}`)
if (samplesNoFile.size) console.log('   produtos afetados:', [...samplesNoFile].slice(0, 20).join(' | '))
console.log('\nDica: rode a ação "fix" do admin-ops (tokens/perms) ou o SupportView para reparar.')
