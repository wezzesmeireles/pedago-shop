/**
 * link-guest-orders.mjs — vincula pedidos de Compra Rápida a contas registradas.
 *
 * Problema: usuários que compraram como guest (guestPhone) e depois criaram conta
 * podem não ver seus downloads se o reconcile automático falhou (race condition,
 * índice ausente, etc.). Este script faz a vinculação retroativamente.
 *
 * Uso:
 *   node scripts/link-guest-orders.mjs --dry    # só mostra o que faria
 *   node scripts/link-guest-orders.mjs          # aplica as mudanças
 *
 * Requer: scripts/.env.migration com APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Databases, Query, Permission, Role } from 'node-appwrite'

const DRY = process.argv.includes('--dry')
const DB = process.env.APPWRITE_DATABASE_ID || 'pedago-db'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)

async function listAll(collection, queries = []) {
  const all = []
  let offset = 0
  while (true) {
    const r = await db.listDocuments(DB, collection, [...queries, Query.limit(100), Query.offset(offset)])
    all.push(...r.documents)
    if (r.documents.length < 100) break
    offset += 100
  }
  return all
}

async function run() {
  console.log(`\n🔍 Buscando perfis com telefone...`)
  const profiles = await listAll('profiles', [Query.isNotNull('phone')])
  const withPhone = profiles.filter(p => p.phone && String(p.phone).replace(/\D/g, '').length >= 10)
  console.log(`  ${withPhone.length} perfis com telefone encontrados`)

  let totalLinked = 0
  let totalSkipped = 0
  let totalErrors = 0

  for (const profile of withPhone) {
    const phone = String(profile.phone).replace(/\D/g, '')
    const userId = profile.userId

    // Find orders with guestPhone = phone AND userId != this user (not yet linked)
    let orphanOrders
    try {
      const r = await db.listDocuments(DB, 'orders', [
        Query.equal('guestPhone', phone),
        Query.notEqual('userId', userId),
        Query.limit(50),
      ])
      orphanOrders = r.documents
    } catch (err) {
      // Index might be missing — warn and continue
      console.warn(`  ⚠ Query por guestPhone falhou para ${profile.email || userId}: ${err.message}`)
      console.warn('  → Execute primeiro: node scripts/add-guest-phone-attr.mjs')
      totalErrors++
      continue
    }

    if (!orphanOrders.length) continue

    console.log(`\n👤 ${profile.name || profile.email || userId} (${phone})`)
    console.log(`   ${orphanOrders.length} pedido(s) não vinculado(s)`)

    for (const order of orphanOrders) {
      try {
        console.log(`   → ${order.orderNumber} (userId: ${order.userId?.slice(0, 8)}... → ${userId.slice(0, 8)}...)`)

        if (DRY) { totalLinked++; continue }

        // Link order
        await db.updateDocument(DB, 'orders', order.$id,
          { userId, guestPhone: null, updatedAt: new Date().toISOString() },
          [Permission.read(Role.user(userId))]
        )

        // Link order_items + download_tokens
        const items = await listAll('order_items', [Query.equal('orderId', order.$id)])
        for (const item of items) {
          await db.updateDocument(DB, 'order_items', item.$id, {},
            [Permission.read(Role.user(userId))]
          )
          const tokens = await listAll('download_tokens', [Query.equal('orderItemId', item.$id)])
          for (const token of tokens) {
            await db.updateDocument(DB, 'download_tokens', token.$id, {},
              [Permission.read(Role.user(userId))]
            )
          }
        }
        totalLinked++
        console.log(`   ✓ Vinculado`)
      } catch (err) {
        console.error(`   ✗ Erro: ${err.message}`)
        totalErrors++
      }
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  if (DRY) {
    console.log(`🔎 DRY RUN — nenhuma alteração feita`)
    console.log(`   Pedidos que seriam vinculados: ${totalLinked}`)
  } else {
    console.log(`✅ Concluído`)
    console.log(`   Pedidos vinculados: ${totalLinked}`)
    console.log(`   Ignorados (já ok): ${totalSkipped}`)
    console.log(`   Erros: ${totalErrors}`)
  }
  if (totalErrors > 0 && totalLinked === 0) {
    console.log(`\n⚠️  Todos falharam. Verifique se o índice guestPhone existe:`)
    console.log(`   node scripts/add-guest-phone-attr.mjs`)
  }
}

run().catch(err => {
  console.error('Erro fatal:', err.message)
  process.exit(1)
})
