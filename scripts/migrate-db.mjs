import { config } from 'dotenv'
config({ path: new URL('.env.migration', import.meta.url).pathname })

import { Client, Databases } from 'node-appwrite'
import { createClient } from '@supabase/supabase-js'

// ── Validate env ─────────────────────────────────────────────────────────────
const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

if (!APPWRITE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✗ Missing required env vars. Check scripts/.env.migration')
  process.exit(1)
}

// ── Clients ───────────────────────────────────────────────────────────────────
const appwrite = new Client()
  .setEndpoint(APPWRITE_ENDPOINT || 'http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1')
  .setProject(APPWRITE_PROJECT_ID || '6a1af05e0030b967a508')
  .setKey(APPWRITE_API_KEY)

const db = new Databases(appwrite)
const DB = 'pedago-db'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

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
      console.error(`\n✗ ${collectionId}/${id}: ${err.message}`)
    }
  }
}

// ── Fetch all rows from a Supabase table ─────────────────────────────────────
async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data ?? []
}

// ── 1. categories ─────────────────────────────────────────────────────────────
async function migrateCategories() {
  const rows = await fetchAll('categories')
  console.log(`\nMigrating ${rows.length} categories...`)
  for (const c of rows) {
    await upsertDoc('categories', c.id, {
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      isActive: c.is_active ?? true,
      sortOrder: c.sort_order ?? 0,
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
      price: p.price ?? 0,
      comparePrice: p.compare_price ?? null,
      description: p.description ?? '',
      coverImageUrl: p.cover_image_url ?? '',
      previewImages: p.preview_images ?? [],
      isActive: p.is_active ?? false,
      isFeatured: p.is_featured ?? false,
      deletedAt: p.deleted_at ?? null,
      categoryId: p.category_id ?? null,
      salesCount: p.sales_count ?? 0,
      pageCount: p.page_count ?? null,
      fileKey: p.file_key ?? null,
      deliveryType: p.delivery_type ?? 'FILE',
      deliveryLink: p.delivery_link ?? null,
      tags: p.tags ?? [],
      sortOrder: p.sort_order ?? 0,
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
  for (const p of rows) {
    await upsertDoc('profiles', p.id, {
      userId: p.id,
      name: p.name ?? '',
      email: p.email ?? '',
      phone: p.phone ?? '',
      role: p.role ?? 'CUSTOMER',
      avatarUrl: p.avatar_url ?? '',
      isActive: p.is_active ?? true,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })
  }
  console.log()
}

// ── 4. orders ─────────────────────────────────────────────────────────────────
async function migrateOrders() {
  const rows = await fetchAll('orders')
  console.log(`\nMigrating ${rows.length} orders...`)
  for (const o of rows) {
    const metadata =
      o.metadata && typeof o.metadata === 'object'
        ? JSON.stringify(o.metadata)
        : o.metadata ?? null

    await upsertDoc('orders', o.id, {
      orderNumber: o.order_number,
      userId: o.user_id,
      customerName: o.customer_name ?? '',
      customerEmail: o.customer_email ?? '',
      status: o.status,
      totalAmount: o.total_amount ?? 0,
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
  }
  console.log()
}

// ── 5. order_items ────────────────────────────────────────────────────────────
async function migrateOrderItems() {
  const rows = await fetchAll('order_items')
  console.log(`\nMigrating ${rows.length} order_items...`)
  for (const i of rows) {
    await upsertDoc('order_items', i.id, {
      orderId: i.order_id,
      productId: i.product_id,
      productName: i.product_name ?? '',
      unitPrice: i.unit_price ?? 0,
      quantity: i.quantity ?? 1,
      deliveryType: i.delivery_type ?? 'FILE',
      deliveryLink: i.delivery_link ?? null,
    })
  }
  console.log()
}

// ── 6. download_tokens ────────────────────────────────────────────────────────
async function migrateDownloadTokens() {
  const rows = await fetchAll('download_tokens')
  console.log(`\nMigrating ${rows.length} download_tokens...`)
  for (const t of rows) {
    await upsertDoc('download_tokens', t.id, {
      token: t.token,
      orderId: t.order_id,
      orderItemId: t.order_item_id,
      maxDownloads: t.max_downloads ?? 5,
      downloadCount: t.download_count ?? 0,
      lastDownloadAt: t.last_download_at ?? null,
      expiresAt: t.expires_at,
      revokedAt: t.revoked_at ?? null,
      deliveryLink: t.delivery_link ?? null,
    })
  }
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
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
