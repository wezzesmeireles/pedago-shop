import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Databases } from 'node-appwrite'

// ── Validate env ─────────────────────────────────────────────────────────────
const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

if (!APPWRITE_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✗ Missing required env vars. Check scripts/.env.migration')
  process.exit(1)
}

const SUPABASE_PROJECT_REF = 'hdldxgbvkjcoesmfoglm'

// ── Clients ───────────────────────────────────────────────────────────────────
const appwrite = new Client()
  .setEndpoint(APPWRITE_ENDPOINT || 'http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1')
  .setProject(APPWRITE_PROJECT_ID || '6a1af05e0030b967a508')
  .setKey(APPWRITE_API_KEY)

const db = new Databases(appwrite)
const DB = 'pedago-db'

// ── Error counter ─────────────────────────────────────────────────────────────
let errors = 0

// ── Upsert helper (idempotent) ────────────────────────────────────────────────
async function upsertDoc(collectionId, id, data) {
  try {
    await db.createDocument(DB, collectionId, id, data)
    process.stdout.write('.')
  } catch (err) {
    if (err.code === 409) {
      await db.updateDocument(DB, collectionId, id, data)
      process.stdout.write('u')
    } else {
      errors++
      console.error(`\n✗ ${collectionId}/${id}: ${err.message}`)
    }
  }
}

// ── Parallel chunk helper (concurrency = 10) ─────────────────────────────────
async function parallel(items, fn) {
  const CONCURRENCY = 10
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    await Promise.all(items.slice(i, i + CONCURRENCY).map(fn))
  }
}

// ── Fetch all rows via Supabase Management API SQL endpoint ───────────────────
async function fetchAll(table) {
  const allRows = []
  const pageSize = 1000
  let offset = 0

  while (true) {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `SELECT * FROM public.${table} ORDER BY id ASC LIMIT ${pageSize} OFFSET ${offset}`,
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`SQL query failed for ${table} (${res.status}): ${body}`)
    }

    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) break
    allRows.push(...rows)
    if (rows.length < pageSize) break
    offset += pageSize
  }

  return allRows
}

// Helper: SQL returns everything as strings — coerce to proper types
const num   = v => v == null ? null : parseFloat(v)
const int   = v => v == null ? null : parseInt(v, 10)
const bool  = v => v == null ? null : (v === true || v === 'true' || v === 't')
const arr   = v => Array.isArray(v) ? v : (v ? JSON.parse(v) : [])

// ── 1. categories ─────────────────────────────────────────────────────────────
async function migrateCategories() {
  const rows = await fetchAll('categories')
  console.log(`\nMigrating ${rows.length} categories...`)
  for (const c of rows) {
    await upsertDoc('categories', c.id, {
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      isActive: bool(c.is_active) ?? true,
      sortOrder: int(c.sort_order) ?? 0,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    })
  }
  console.log()
}

// ── 2. products ───────────────────────────────────────────────────────────────
async function migrateProducts() {
  const rows = await fetchAll('products')
  console.log(`\nMigrating ${rows.length} products...`)
  for (const p of rows) {
    await upsertDoc('products', p.id, {
      name: p.name,
      slug: p.slug,
      price: num(p.price) ?? 0,
      comparePrice: p.compare_price != null ? num(p.compare_price) : null,
      description: p.description ?? '',
      coverImageUrl: p.cover_image_url ?? '',
      previewImages: arr(p.preview_images),
      isActive: bool(p.is_active) ?? false,
      isFeatured: bool(p.is_featured) ?? false,
      deletedAt: p.deleted_at ?? null,
      categoryId: p.category_id ?? null,
      salesCount: int(p.sales_count) ?? 0,
      pageCount: p.page_count != null ? int(p.page_count) : null,
      fileKey: p.file_key ?? null,
      deliveryType: ['LINK', 'FILE'].includes(p.delivery_type) ? p.delivery_type : 'FILE',
      deliveryLink: p.delivery_link ?? null,
      tags: arr(p.tags),
      sortOrder: int(p.sort_order) ?? 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })
  }
  console.log()
}

// ── 3. profiles ───────────────────────────────────────────────────────────────
async function migrateProfiles() {
  const rows = await fetchAll('profiles')
  console.log(`\nMigrating ${rows.length} profiles...`)
  await parallel(rows, p => upsertDoc('profiles', p.id, {
    userId: p.id,
    name: p.name ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    role: p.role ?? 'CUSTOMER',
    avatarUrl: p.avatar_url ?? '',
    isActive: bool(p.is_active) ?? true,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }))
  console.log()
}

// ── 4. orders ─────────────────────────────────────────────────────────────────
async function migrateOrders() {
  const rows = await fetchAll('orders')
  console.log(`\nMigrating ${rows.length} orders...`)
  await parallel(rows, o => {
    const metadata = o.metadata && typeof o.metadata === 'object'
      ? JSON.stringify(o.metadata) : o.metadata ?? null
    return upsertDoc('orders', o.id, {
      orderNumber: o.order_number,
      userId: o.user_id,
      customerName: o.customer_name ?? '',
      customerEmail: o.customer_email ?? '',
      status: ['AWAITING_PAYMENT','PAID','CANCELLED','REFUNDED'].includes(o.status) ? o.status : 'CANCELLED',
      totalAmount: num(o.total_amount) ?? 0,
      paymentMethod: o.payment_method ?? null,
      mpPaymentId: o.mp_payment_id ?? null,
      mpPreferenceId: o.mp_preference_id ?? null,
      mpStatus: o.mp_status ?? null,
      paidAt: o.paid_at ?? null,
      expiresAt: o.expires_at ?? null,
      metadata,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    })
  })
  console.log()
}

// ── 5. order_items ────────────────────────────────────────────────────────────
async function migrateOrderItems() {
  const rows = await fetchAll('order_items')
  console.log(`\nMigrating ${rows.length} order_items...`)
  await parallel(rows, i => upsertDoc('order_items', i.id, {
    orderId: i.order_id,
    productId: i.product_id,
    productName: i.product_name ?? '',
    unitPrice: num(i.unit_price) ?? 0,
    quantity: int(i.quantity) ?? 1,
    deliveryType: ['LINK', 'FILE'].includes(i.delivery_type) ? i.delivery_type : 'FILE',
    deliveryLink: i.delivery_link ?? null,
  }))
  console.log()
}

// ── 6. download_tokens ────────────────────────────────────────────────────────
async function migrateDownloadTokens() {
  const rows = await fetchAll('download_tokens')
  console.log(`\nMigrating ${rows.length} download_tokens...`)
  await parallel(rows, t => upsertDoc('download_tokens', t.id, {
    token: t.token,
    orderId: t.order_id,
    orderItemId: t.order_item_id,
    maxDownloads: int(t.max_downloads) ?? 5,
    downloadCount: int(t.download_count) ?? 0,
    lastDownloadAt: t.last_download_at ?? null,
    expiresAt: t.expires_at,
    revokedAt: t.revoked_at ?? null,
    deliveryLink: t.delivery_link ?? null,
  }))
  console.log()
}

// ── 7. site_config ────────────────────────────────────────────────────────────
async function migrateSiteConfig() {
  const rows = await fetchAll('site_config')
  console.log(`\nMigrating ${rows.length} site_config...`)
  for (const c of rows) {
    const value =
      typeof c.value !== 'string' ? JSON.stringify(c.value) : c.value

    await upsertDoc('site_config', c.key, {
      key: c.key,
      value,
      updatedAt: c.updated_at,
    })
  }
  console.log()
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  await migrateCategories()
  await migrateProducts()
  await migrateProfiles()
  await migrateOrders()
  await migrateOrderItems()
  await migrateDownloadTokens()
  await migrateSiteConfig()

  console.log('\nDatabase migration complete.')
  if (errors > 0) {
    console.error(`\n⚠ Migration completed with ${errors} errors. Check output above.`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
