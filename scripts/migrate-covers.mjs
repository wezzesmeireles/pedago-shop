/**
 * Migrate product cover images + site_config images (logo/banners) from the old
 * Supabase Storage to Appwrite `product-covers` bucket, then rewrite the URLs
 * stored in the Appwrite database so the front no longer depends on Supabase.
 *
 *   node migrate-covers.mjs --dry-run   # report only, no writes
 *   node migrate-covers.mjs             # perform migration
 *
 * Idempotent: files that already exist in the bucket are reused (409 → skip
 * upload), and docs whose URL is already on Appwrite are left untouched.
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Databases, Storage, Query, Permission, Role, ID } from 'node-appwrite'

const DRY = process.argv.includes('--dry-run')

const {
  APPWRITE_ENDPOINT = 'https://appwrite.wsgestao.digital/v1',
  APPWRITE_PROJECT_ID = '6a1bc2b1000d09c3f5f1',
  APPWRITE_API_KEY,
} = process.env

if (!APPWRITE_API_KEY) {
  console.error('✗ Missing APPWRITE_API_KEY. Check scripts/.env.migration')
  process.exit(1)
}

const DB = 'pedago-db'
const BUCKET = 'product-covers'

const appwrite = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY)

const db = new Databases(appwrite)
const storage = new Storage(appwrite)

// URL that the browser will use to fetch a public file from the bucket.
const viewUrl = (fileId) =>
  `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`

const isSupabaseUrl = (u) => typeof u === 'string' && /supabase\.co/i.test(u)

function fileIdFromUrl(url) {
  // last path segment without query, sanitized to Appwrite-safe id (<=36 chars)
  const last = decodeURIComponent(url.split('?')[0].split('/').pop() || 'cover')
  const base = last
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
  const safe = /^[a-zA-Z0-9]/.test(base) ? base : 'c-' + base
  return safe.slice(0, 36) || ID.unique()
}

// url → new Appwrite url (memoized so shared images upload once)
const cache = new Map()
let uploaded = 0
let reused = 0
let errors = 0

async function migrateUrl(url) {
  if (cache.has(url)) return cache.get(url)

  const fileId = fileIdFromUrl(url)
  const newUrl = viewUrl(fileId)

  if (DRY) {
    console.log(`   ↳ ${url.slice(0, 70)}…  →  files/${fileId}`)
    cache.set(url, newUrl)
    return newUrl
  }

  // download from Supabase (public URL)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status} for ${url}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const filename = decodeURIComponent(url.split('?')[0].split('/').pop() || `${fileId}.jpg`)

  try {
    const file = new File([buffer], filename, { type: res.headers.get('content-type') || 'image/jpeg' })
    await storage.createFile(BUCKET, fileId, file, [Permission.read(Role.any())])
    uploaded++
    console.log(`   ✓ uploaded files/${fileId} (${Math.round(buffer.length / 1024)}KB)`)
  } catch (err) {
    if (err.code === 409) {
      reused++
      console.log(`   ⏭  files/${fileId} already exists`)
    } else {
      throw err
    }
  }

  cache.set(url, newUrl)
  return newUrl
}

async function listAll(collection) {
  const out = []
  let cursor = null
  while (true) {
    const queries = [Query.limit(100)]
    if (cursor) queries.push(Query.cursorAfter(cursor))
    const r = await db.listDocuments(DB, collection, queries)
    out.push(...r.documents)
    if (r.documents.length < 100) break
    cursor = r.documents[r.documents.length - 1].$id
  }
  return out
}

async function migrateProducts() {
  const products = await listAll('products')
  const stale = products.filter((p) => isSupabaseUrl(p.coverImageUrl))
  console.log(`\nProducts: ${products.length} total, ${stale.length} on Supabase\n`)

  for (const p of stale) {
    try {
      const newUrl = await migrateUrl(p.coverImageUrl)
      if (!DRY) {
        await db.updateDocument(DB, 'products', p.$id, { coverImageUrl: newUrl })
      }
      console.log(`✓ ${p.name?.slice(0, 50) ?? p.$id}`)
    } catch (err) {
      errors++
      console.error(`✗ ${p.$id}: ${err.message}`)
    }
  }
}

async function migrateSiteConfig() {
  const rows = await listAll('site_config')
  const stale = rows.filter((c) => isSupabaseUrl(c.value))
  console.log(`\nsite_config: ${rows.length} total, ${stale.length} contain Supabase URLs\n`)

  const URL_RE = /https?:\/\/[^\s"'\\]*supabase\.co[^\s"'\\]*/gi

  for (const c of stale) {
    try {
      const urls = [...new Set(c.value.match(URL_RE) || [])]
      let value = c.value
      for (const u of urls) {
        const newUrl = await migrateUrl(u)
        value = value.split(u).join(newUrl)
      }
      if (!DRY) {
        await db.updateDocument(DB, 'site_config', c.$id, { value })
      }
      console.log(`✓ ${c.key} (${urls.length} url${urls.length > 1 ? 's' : ''})`)
    } catch (err) {
      errors++
      console.error(`✗ ${c.key}: ${err.message}`)
    }
  }
}

async function main() {
  console.log(DRY ? '── DRY RUN (no writes) ──' : '── MIGRATING ──')
  await migrateProducts()
  await migrateSiteConfig()
  console.log(
    `\nDone. uploaded=${uploaded} reused=${reused} errors=${errors}` +
      (DRY ? '  (dry-run — nothing written)' : ''),
  )
  if (errors > 0) process.exit(1)
}

main().catch((e) => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
