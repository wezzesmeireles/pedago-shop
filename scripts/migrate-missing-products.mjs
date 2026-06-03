import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Databases, Storage, ID, Permission, Role, Query } from 'node-appwrite'

const SUPA_URL = process.env.SUPABASE_URL || 'https://hdldxgbvkjcoesmfoglm.supabase.co'
// Storage needs the PROJECT key (sb_secret_…), NOT the sbp_ management token.
const STORAGE_KEY = process.env.SUPABASE_SECRET_KEY
const REF = 'hdldxgbvkjcoesmfoglm'
const PROJ = process.env.APPWRITE_PROJECT_ID
const COVER_BASE = `https://sitepedagogico.com.br/v1/storage/buckets/product-covers/files`
const aw = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(PROJ).setKey(process.env.APPWRITE_API_KEY)
const db = new Databases(aw)
const st = new Storage(aw)
const DB = 'pedago-db'

const num = v => v == null ? null : parseFloat(v)
const int = v => v == null ? null : parseInt(v, 10)
const bool = v => v == null ? null : (v === true || v === 'true' || v === 't')
const arr = v => Array.isArray(v) ? v : (v ? JSON.parse(v) : [])

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

// existing Appwrite product ids
const awIds = new Set()
let cursor = null
while (true) {
  const q = [Query.limit(100), Query.select(['$id'])]
  if (cursor) q.push(Query.cursorAfter(cursor))
  const r = await db.listDocuments(DB, 'products', q)
  r.documents.forEach(p => awIds.add(p.$id))
  if (r.documents.length < 100) break
  cursor = r.documents[r.documents.length - 1].$id
}

const all = await sql('SELECT * FROM public.products WHERE deleted_at IS NULL')
const missing = all.filter(p => !awIds.has(p.id))
console.log(`Produtos a migrar: ${missing.length}`)

for (const p of missing) {
  console.log(`\n→ ${p.name}`)

  // 1) PDF
  if (p.file_key) {
    const pdfId = String(p.file_key).replace(/\.[^.]+$/, '')
    try {
      await st.getFile('product-files', pdfId)
      console.log('  PDF já existe')
    } catch {
      const r = await fetch(`${SUPA_URL}/storage/v1/object/product-files/${encodeURIComponent(p.file_key)}`,
        { headers: { apikey: STORAGE_KEY, Authorization: 'Bearer ' + STORAGE_KEY } })
      if (!r.ok) { console.log('  ✗ download PDF:', r.status) }
      else {
        const buf = Buffer.from(await r.arrayBuffer())
        await st.createFile('product-files', pdfId, new File([buf], p.file_key, { type: 'application/pdf' }))
        console.log(`  ✓ PDF enviado (${Math.round(buf.length / 1024)}KB) id=${pdfId}`)
      }
    }
  }

  // 2) Cover
  let coverUrl = p.cover_image_url || ''
  if (/supabase/i.test(coverUrl)) {
    try {
      const res = await fetch(coverUrl)
      if (!res.ok) throw new Error('HTTP ' + res.status)
      const buf = Buffer.from(await res.arrayBuffer())
      const coverId = ID.unique()
      await st.createFile('product-covers', coverId, new File([buf], coverId + '.img', { type: res.headers.get('content-type') || 'image/webp' }), [Permission.read(Role.any())])
      coverUrl = `${COVER_BASE}/${coverId}/view?project=${PROJ}`
      console.log(`  ✓ capa enviada (${Math.round(buf.length / 1024)}KB)`)
    } catch (e) { console.log('  ✗ capa:', e.message) }
  }

  // 3) Product document
  await db.createDocument(DB, 'products', p.id, {
    name: p.name, slug: p.slug, price: num(p.price) ?? 0,
    comparePrice: p.compare_price != null ? num(p.compare_price) : null,
    description: p.description ?? '', coverImageUrl: coverUrl,
    previewImages: arr(p.preview_images), isActive: bool(p.is_active) ?? false,
    isFeatured: bool(p.is_featured) ?? false, deletedAt: p.deleted_at ?? null,
    categoryId: p.category_id ?? null, salesCount: int(p.sales_count) ?? 0,
    pageCount: p.page_count != null ? int(p.page_count) : null, fileKey: p.file_key ?? null,
    deliveryType: ['LINK', 'FILE'].includes(p.delivery_type) ? p.delivery_type : 'FILE',
    deliveryLink: p.delivery_link ?? null, tags: arr(p.tags),
    sortOrder: int(p.sort_order) ?? 0, createdAt: p.created_at, updatedAt: p.updated_at,
  }).then(() => console.log('  ✓ produto criado')).catch(e => console.log('  ✗ produto:', e.message))
}
console.log('\n✅ Concluído.')
