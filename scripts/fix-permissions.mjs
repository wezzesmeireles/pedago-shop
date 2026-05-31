import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Databases, Permission, Role, Query } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1')
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const DB = 'pedago-db'

// ── Step 1: Update collection-level permissions ───────────────────────────────

async function updateCollectionPermissions() {
  console.log('\n📋 Atualizando permissões das coleções...')

  const adminRead   = Permission.read(Role.label('admin'))
  const adminWrite  = Permission.update(Role.label('admin'))
  const adminDelete = Permission.delete(Role.label('admin'))
  const usersCreate = Permission.create(Role.users())
  const anyRead     = Permission.read(Role.any())

  const collections = [
    { id: 'profiles',         perms: [anyRead, usersCreate, adminWrite, adminDelete] },
    { id: 'categories',       perms: [anyRead, adminWrite, adminDelete] },
    { id: 'products',         perms: [anyRead, adminWrite, adminDelete] },
    { id: 'orders',           perms: [adminRead, adminWrite, adminDelete, usersCreate] },
    { id: 'order_items',      perms: [adminRead, adminWrite, adminDelete] },
    { id: 'download_tokens',  perms: [adminRead, adminWrite, adminDelete] },
    { id: 'site_config',      perms: [anyRead, adminWrite] },
    { id: 'webhook_events',   perms: [adminRead, adminWrite] },
  ]

  for (const col of collections) {
    try {
      await db.updateCollection(DB, col.id, col.id, col.perms, true) // documentSecurity=true
      console.log(`  ✓ ${col.id}`)
    } catch (e) {
      console.error(`  ✗ ${col.id}: ${e.message}`)
    }
  }
}

// ── Step 2: Add user permissions to existing documents ────────────────────────

async function fetchAll(collectionId, queries = []) {
  const all = []
  let offset = 0
  const limit = 100
  while (true) {
    const res = await db.listDocuments(DB, collectionId, [...queries, Query.limit(limit), Query.offset(offset)])
    all.push(...res.documents)
    if (res.documents.length < limit) break
    offset += limit
  }
  return all
}

async function fixOrders() {
  console.log('\n🛒 Corrigindo permissões de orders...')
  const orders = await fetchAll('orders')
  console.log(`  ${orders.length} orders encontradas`)
  let ok = 0, fail = 0

  for (const order of orders) {
    const uid = order.userId
    if (!uid) continue
    try {
      await db.updateDocument(DB, 'orders', order.$id, {}, [
        Permission.read(Role.label('admin')),
        Permission.update(Role.label('admin')),
        Permission.delete(Role.label('admin')),
        Permission.read(Role.user(uid)),
        Permission.update(Role.user(uid)),
      ])
      process.stdout.write('.')
      ok++
    } catch { process.stdout.write('x'); fail++ }
  }
  console.log(`\n  ✓ ${ok} ok, ✗ ${fail} erros`)
  return orders
}

async function fixOrderItems(orders) {
  console.log('\n📦 Corrigindo permissões de order_items...')
  // Build map orderId → userId
  const userMap = Object.fromEntries(orders.map(o => [o.$id, o.userId]))
  const items = await fetchAll('order_items')
  console.log(`  ${items.length} items encontrados`)
  let ok = 0, fail = 0

  for (const item of items) {
    const uid = userMap[item.orderId]
    if (!uid) { process.stdout.write('?'); continue }
    try {
      await db.updateDocument(DB, 'order_items', item.$id, {}, [
        Permission.read(Role.label('admin')),
        Permission.update(Role.label('admin')),
        Permission.read(Role.user(uid)),
      ])
      process.stdout.write('.')
      ok++
    } catch { process.stdout.write('x'); fail++ }
  }
  console.log(`\n  ✓ ${ok} ok, ✗ ${fail} erros`)
}

async function fixDownloadTokens(orders) {
  console.log('\n🔑 Corrigindo permissões de download_tokens...')
  const userMap = Object.fromEntries(orders.map(o => [o.$id, o.userId]))
  const tokens = await fetchAll('download_tokens')
  console.log(`  ${tokens.length} tokens encontrados`)
  let ok = 0, fail = 0

  for (const token of tokens) {
    const uid = userMap[token.orderId]
    if (!uid) { process.stdout.write('?'); continue }
    try {
      await db.updateDocument(DB, 'download_tokens', token.$id, {}, [
        Permission.read(Role.label('admin')),
        Permission.update(Role.label('admin')),
        Permission.read(Role.user(uid)),
        Permission.update(Role.user(uid)),
      ])
      process.stdout.write('.')
      ok++
    } catch { process.stdout.write('x'); fail++ }
  }
  console.log(`\n  ✓ ${ok} ok, ✗ ${fail} erros`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧 Corrigindo permissões do Appwrite...')
  await updateCollectionPermissions()
  const orders = await fixOrders()
  await fixOrderItems(orders)
  await fixDownloadTokens(orders)
  console.log('\n✅ Permissões corrigidas! Admin vê tudo, clientes veem apenas os próprios dados.')
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1) })
