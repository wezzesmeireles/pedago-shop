/**
 * Sincroniza userId nos documentos quando o ID do Appwrite Auth
 * é diferente do ID migrado do Supabase (acontece com usuários OAuth).
 * Busca todos os profiles, compara com Auth, e atualiza orders/tokens.
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Users, Databases, Query, Permission, Role } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const users = new Users(client)
const db = new Databases(client)
const DB = 'pedago-db'

async function fetchAll(col, queries = []) {
  const all = []
  let offset = 0
  while (true) {
    const res = await db.listDocuments(DB, col, [...queries, Query.limit(100), Query.offset(offset)])
    all.push(...res.documents)
    if (res.documents.length < 100) break
    offset += 100
  }
  return all
}

async function fetchAllUsers() {
  const all = []
  let offset = 0
  while (true) {
    const res = await users.list([], undefined, 100, offset)
    all.push(...res.users)
    if (res.users.length < 100) break
    offset += 100
  }
  return all
}

async function main() {
  console.log('Buscando usuários do Appwrite Auth...')
  const authUsers = await fetchAllUsers()
  console.log(`  ${authUsers.length} usuários no Auth`)

  // Build email → authId map
  const emailToAuthId = {}
  for (const u of authUsers) {
    if (u.email) emailToAuthId[u.email.toLowerCase()] = u.$id
  }

  console.log('\nBuscando profiles do banco...')
  const profiles = await fetchAll('profiles')
  console.log(`  ${profiles.length} profiles`)

  // Find profiles where userId doesn't match Auth ID
  let mismatch = 0
  const oldToNew = {} // oldUserId → newAuthId

  for (const p of profiles) {
    const correctId = emailToAuthId[p.email?.toLowerCase()]
    if (correctId && correctId !== p.userId) {
      oldToNew[p.userId] = correctId
      mismatch++

      // Update the profile userId
      try {
        await db.updateDocument(DB, 'profiles', p.$id, {
          userId: correctId,
          updatedAt: new Date().toISOString(),
        }, [
          Permission.read(Role.any()),
          Permission.update(Role.label('admin')),
          Permission.read(Role.user(correctId)),
          Permission.update(Role.user(correctId)),
        ])
        process.stdout.write('p')
      } catch(e) { process.stdout.write('P') }
    }
  }
  console.log(`\n\n  ${mismatch} profiles com userId desatualizado corrigidos`)

  if (mismatch === 0) {
    console.log('\n✅ Todos os IDs já estão sincronizados!')
    return
  }

  // Update orders with old userId → new userId
  console.log('\nAtualizando orders...')
  const orders = await fetchAll('orders')
  let ordersFixed = 0
  for (const o of orders) {
    const newId = oldToNew[o.userId]
    if (!newId) continue
    try {
      await db.updateDocument(DB, 'orders', o.$id, { userId: newId }, [
        Permission.read(Role.label('admin')),
        Permission.update(Role.label('admin')),
        Permission.read(Role.user(newId)),
        Permission.update(Role.user(newId)),
      ])
      process.stdout.write('.')
      ordersFixed++
    } catch { process.stdout.write('x') }
  }
  console.log(`\n  ${ordersFixed} orders atualizadas`)

  // Update download_tokens permissions with new userId
  console.log('\nAtualizando download_tokens...')
  // Build new orderId → userId map
  const allOrders = await fetchAll('orders')
  const orderUserMap = Object.fromEntries(allOrders.map(o => [o.$id, o.userId]))

  const tokens = await fetchAll('download_tokens')
  let tokensFixed = 0
  for (const t of tokens) {
    const uid = orderUserMap[t.orderId]
    if (!uid) continue
    // Only update if this token belongs to a user whose ID changed
    if (!Object.values(oldToNew).includes(uid)) continue
    try {
      await db.updateDocument(DB, 'download_tokens', t.$id, {}, [
        Permission.read(Role.label('admin')),
        Permission.update(Role.label('admin')),
        Permission.read(Role.user(uid)),
        Permission.update(Role.user(uid)),
      ])
      process.stdout.write('.')
      tokensFixed++
    } catch { process.stdout.write('x') }
  }
  console.log(`\n  ${tokensFixed} tokens atualizados`)

  console.log('\n✅ Sincronização completa!')
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
