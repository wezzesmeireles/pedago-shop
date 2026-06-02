/**
 * Incremental "catch-up" sync: Supabase -> Appwrite for the DYNAMIC data that
 * keeps growing on the still-live Supabase (auth users, profiles, orders,
 * order_items, download_tokens).
 *
 * SAFE BY DESIGN — create-only:
 *   - only inserts rows whose id does NOT already exist in Appwrite
 *   - never updates/overwrites existing Appwrite docs (preserves admin edits,
 *     migrated image URLs, and natively-created Appwrite orders)
 *   - does NOT touch products / categories / site_config
 *
 * Idempotent: re-running only adds what's new.
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Users, Databases, Query } from 'node-appwrite'

const REF = 'hdldxgbvkjcoesmfoglm'
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const appwrite = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
const users = new Users(appwrite)
const db = new Databases(appwrite)
const DB = 'pedago-db'

const num = v => v == null ? null : parseFloat(v)
const int = v => v == null ? null : parseInt(v, 10)
const bool = v => v == null ? null : (v === true || v === 'true' || v === 't')

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!r.ok) throw new Error(`SQL ${r.status}: ${await r.text()}`)
  return r.json()
}

async function fetchAll(table) {
  const all = []; let off = 0; const ps = 1000
  while (true) {
    const rows = await sql(`SELECT * FROM public.${table} ORDER BY id ASC LIMIT ${ps} OFFSET ${off}`)
    if (!Array.isArray(rows) || rows.length === 0) break
    all.push(...rows); if (rows.length < ps) break; off += ps
  }
  return all
}

async function existingDocIds(collectionId) {
  const ids = new Set(); let cursor = null
  while (true) {
    const q = [Query.limit(500), Query.select(['$id'])]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const r = await db.listDocuments(DB, collectionId, q)
    for (const d of r.documents) ids.add(d.$id)
    if (r.documents.length < 500) break
    cursor = r.documents[r.documents.length - 1].$id
  }
  return ids
}

async function existingUserIds() {
  const ids = new Set(); let cursor = null
  while (true) {
    const q = [Query.limit(500)]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const r = await users.list(q)
    for (const u of r.users) ids.add(u.$id)
    if (r.users.length < 500) break
    cursor = r.users[r.users.length - 1].$id
  }
  return ids
}

// create-only with small concurrency
async function createMissing(label, rows, existing, idOf, create) {
  const todo = rows.filter(r => !existing.has(idOf(r)))
  console.log(`\n${label}: ${rows.length} in Supabase, ${existing.size} already in Appwrite -> creating ${todo.length}`)
  let ok = 0, err = 0
  const C = 10
  for (let i = 0; i < todo.length; i += C) {
    await Promise.all(todo.slice(i, i + C).map(async r => {
      try { await create(r); ok++; process.stdout.write('.') }
      catch (e) {
        if (e.code === 409) { ok++; process.stdout.write('o') }
        else { err++; console.error(`\n  ✗ ${label}/${idOf(r)}: ${e.message}`) }
      }
    }))
  }
  console.log(`\n  ✓ ${label}: +${ok} created, ${err} errors`)
  return { ok, err }
}

// ── AUTH USERS (special: needs password hash + identities) ────────────────────
async function syncUsers() {
  const supaUsers = []
  let off = 0; const ps = 1000
  while (true) {
    const rows = await sql(`
      SELECT u.id, u.email, u.phone, u.encrypted_password,
             u.raw_user_meta_data AS user_metadata,
             COALESCE(json_agg(json_build_object('provider', i.provider))
               FILTER (WHERE i.provider IS NOT NULL), '[]'::json) AS identities
      FROM auth.users u LEFT JOIN auth.identities i ON i.user_id = u.id
      GROUP BY u.id, u.email, u.phone, u.encrypted_password, u.raw_user_meta_data
      ORDER BY u.created_at ASC LIMIT ${ps} OFFSET ${off}`)
    if (!Array.isArray(rows) || rows.length === 0) break
    supaUsers.push(...rows); if (rows.length < ps) break; off += ps
  }
  const existing = await existingUserIds()
  const todo = supaUsers.filter(u => !existing.has(u.id))
  console.log(`\nauth users: ${supaUsers.length} in Supabase, ${existing.size} in Appwrite -> creating ${todo.length}`)
  let ok = 0, err = 0
  for (const u of todo) {
    const name = u.user_metadata?.name || u.email?.split('@')[0] || 'User'
    const hasGoogle = Array.isArray(u.identities) && u.identities.some(i => i.provider === 'google')
    try {
      if (!hasGoogle && u.encrypted_password && u.encrypted_password.startsWith('$2')) {
        await users.createBcryptUser(u.id, u.email, u.encrypted_password, name)
      } else {
        await users.create(u.id, u.email, u.phone || undefined, undefined, name)
      }
      ok++; process.stdout.write('.')
    } catch (e) {
      if (e.code === 409) { ok++; process.stdout.write('o') }
      else { err++; console.error(`\n  ✗ user ${u.email}: ${e.message}`) }
    }
  }
  console.log(`\n  ✓ auth users: +${ok}, ${err} errors`)
}

async function main() {
  console.log('=== Incremental sync (create-only) — Supabase -> Appwrite ===')

  // 1) auth users first (profiles/orders reference them)
  await syncUsers()

  // 2) profiles
  const profiles = await fetchAll('profiles')
  await createMissing('profiles', profiles, await existingDocIds('profiles'), p => p.id, p =>
    db.createDocument(DB, 'profiles', p.id, {
      userId: p.id, name: p.name ?? '', email: p.email ?? '', phone: p.phone ?? '',
      role: p.role ?? 'CUSTOMER', avatarUrl: p.avatar_url ?? '', isActive: bool(p.is_active) ?? true,
      createdAt: p.created_at, updatedAt: p.updated_at,
    }))

  // 3) orders
  const orders = await fetchAll('orders')
  await createMissing('orders', orders, await existingDocIds('orders'), o => o.id, o => {
    const metadata = o.metadata && typeof o.metadata === 'object' ? JSON.stringify(o.metadata) : o.metadata ?? null
    return db.createDocument(DB, 'orders', o.id, {
      orderNumber: o.order_number, userId: o.user_id, customerName: o.customer_name ?? '',
      customerEmail: o.customer_email ?? '',
      status: ['AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'REFUNDED'].includes(o.status) ? o.status : 'CANCELLED',
      totalAmount: num(o.total_amount) ?? 0, paymentMethod: o.payment_method ?? null,
      mpPaymentId: o.mp_payment_id ?? null, mpPreferenceId: o.mp_preference_id ?? null,
      mpStatus: o.mp_status ?? null, paidAt: o.paid_at ?? null, expiresAt: o.expires_at ?? null,
      metadata, createdAt: o.created_at, updatedAt: o.updated_at,
    })
  })

  // 4) order_items
  const items = await fetchAll('order_items')
  await createMissing('order_items', items, await existingDocIds('order_items'), i => i.id, i =>
    db.createDocument(DB, 'order_items', i.id, {
      orderId: i.order_id, productId: i.product_id, productName: i.product_name ?? '',
      unitPrice: num(i.unit_price) ?? 0, quantity: int(i.quantity) ?? 1,
      deliveryType: ['LINK', 'FILE'].includes(i.delivery_type) ? i.delivery_type : 'FILE',
      deliveryLink: i.delivery_link ?? null,
    }))

  // 5) download_tokens
  const tokens = await fetchAll('download_tokens')
  await createMissing('download_tokens', tokens, await existingDocIds('download_tokens'), t => t.id, t =>
    db.createDocument(DB, 'download_tokens', t.id, {
      token: t.token, orderId: t.order_id, orderItemId: t.order_item_id,
      maxDownloads: int(t.max_downloads) ?? 5, downloadCount: int(t.download_count) ?? 0,
      lastDownloadAt: t.last_download_at ?? null, expiresAt: t.expires_at,
      revokedAt: t.revoked_at ?? null, deliveryLink: t.delivery_link ?? null,
    }))

  console.log('\n✅ Sync complete.')
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
