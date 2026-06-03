/**
 * backfill-perms.mjs — concede Permission.read(Role.user(<dono>)) a cada
 * documento de orders/order_items/download_tokens que esteja sem isso, para que
 * o cliente consiga ler os proprios pedidos/itens/tokens (Meus Pedidos, Meus
 * Downloads, tela de sucesso). O admin ja le tudo via label:admin (colecao).
 *
 * node backfill-perms.mjs --dry   # so conta
 * node backfill-perms.mjs         # aplica
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })
import { Client, Databases, Query, Permission, Role } from 'node-appwrite'

const DB = 'pedago-db'
const DRY = process.argv.includes('--dry')
const aw = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(process.env.APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY)
const db = new Databases(aw)

async function listAll(col, queries = []) {
  const out = []
  let cursor = null
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

async function parallel(items, fn, C = 15) {
  let done = 0
  for (let i = 0; i < items.length; i += C) {
    await Promise.all(items.slice(i, i + C).map(fn))
    done += Math.min(C, items.length - i)
    if (done % 300 === 0 || done === items.length) process.stdout.write(`\r  ${done}/${items.length}`)
  }
  process.stdout.write('\n')
}

// helper: o documento ja tem read(user:uid)?
function hasUserRead(doc, uid) {
  const want = `read("user:${uid}")`
  return (doc.$permissions || []).includes(want)
}

// 1) orders -> mapa orderId->userId, e atualiza perms
console.log('Carregando orders...')
const orders = await listAll('orders')
const orderUser = {}
for (const o of orders) if (o.userId) orderUser[o.$id] = o.userId
const ordersToFix = orders.filter(o => o.userId && !hasUserRead(o, o.userId))
console.log(`orders: ${orders.length} | sem read do dono: ${ordersToFix.length}`)
if (!DRY) await parallel(ordersToFix, o =>
  db.updateDocument(DB, 'orders', o.$id, {}, [Permission.read(Role.user(o.userId))]).catch(e => console.error(`\n  ✗ order ${o.$id}: ${e.message}`)))

// 2) order_items
console.log('Carregando order_items...')
const items = await listAll('order_items')
const itemsToFix = items.filter(it => orderUser[it.orderId] && !hasUserRead(it, orderUser[it.orderId]))
console.log(`order_items: ${items.length} | sem read do dono: ${itemsToFix.length}`)
if (!DRY) await parallel(itemsToFix, it =>
  db.updateDocument(DB, 'order_items', it.$id, {}, [Permission.read(Role.user(orderUser[it.orderId]))]).catch(e => console.error(`\n  ✗ item ${it.$id}: ${e.message}`)))

// 3) download_tokens
console.log('Carregando download_tokens...')
const toks = await listAll('download_tokens')
const toksToFix = toks.filter(t => orderUser[t.orderId] && !hasUserRead(t, orderUser[t.orderId]))
console.log(`download_tokens: ${toks.length} | sem read do dono: ${toksToFix.length}`)
if (!DRY) await parallel(toksToFix, t =>
  db.updateDocument(DB, 'download_tokens', t.$id, {}, [Permission.read(Role.user(orderUser[t.orderId]))]).catch(e => console.error(`\n  ✗ token ${t.$id}: ${e.message}`)))

console.log(DRY ? '\n[dry] nada alterado.' : '\nConcluido.')
