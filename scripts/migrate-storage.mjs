import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { createClient } from '@supabase/supabase-js'
import { Client, Storage } from 'node-appwrite'

// ── Validate env ─────────────────────────────────────────────────────────────
const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

const SUPABASE_KEY = SUPABASE_SECRET_KEY || SUPABASE_SERVICE_ROLE_KEY

if (!APPWRITE_API_KEY || !SUPABASE_KEY || !SUPABASE_URL) {
  console.error('✗ Missing env vars. Check scripts/.env.migration')
  process.exit(1)
}

// ── Clients ───────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

const appwrite = new Client()
  .setEndpoint(APPWRITE_ENDPOINT || 'http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1')
  .setProject(APPWRITE_PROJECT_ID || '6a1af05e0030b967a508')
  .setKey(APPWRITE_API_KEY)

const storage = new Storage(appwrite)

// ── Sanitize filename → Appwrite-safe file ID (max 36 chars) ─────────────────
function sanitizeFileId(name) {
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  const safe = /^[a-zA-Z0-9]/.test(base) ? base : 'f-' + base
  return safe.slice(0, 36) || 'file'
}

// ── List all files via supabase-js ────────────────────────────────────────────
async function listAllFiles() {
  const allFiles = []
  const pageSize = 100
  let offset = 0

  while (true) {
    const { data, error } = await supabase.storage
      .from('product-files')
      .list('', { limit: pageSize, offset })
    if (error) throw new Error(`Storage list error: ${error.message}`)
    if (!data || data.length === 0) break
    allFiles.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }

  return allFiles
}

// ── Download file via supabase-js signed URL ──────────────────────────────────
async function downloadStorageFile(filename) {
  const { data, error } = await supabase.storage
    .from('product-files')
    .createSignedUrl(filename, 300) // 5-minute URL
  if (error) throw new Error(`Signed URL error: ${error.message}`)

  const res = await fetch(data.signedUrl)
  if (!res.ok) throw new Error(`Download failed ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Listing files in Supabase storage bucket "product-files"…')

  let files
  try {
    files = await listAllFiles()
  } catch (err) {
    console.error('✗ Failed to list files:', err.message)
    process.exit(1)
  }

  console.log(`Found ${files.length} files. Migrating to Appwrite…\n`)

  let migrated = 0
  let errors = 0

  for (const file of files) {
    if (!file.name) continue
    try {
      // Download file content from Supabase
      const buffer = await downloadStorageFile(file.name)

      // Build Appwrite file ID from filename
      const fileId = sanitizeFileId(file.name)

      // Upload to Appwrite
      const inputFile = new File([buffer], file.name)
      try {
        await storage.createFile('product-files', fileId, inputFile)
        migrated++
        console.log(`✓ ${file.name} (${Math.round(buffer.length / 1024)}KB)`)
      } catch (uploadErr) {
        if (uploadErr.code === 409) {
          console.log(`⏭  ${file.name} — already exists`)
        } else {
          errors++
          console.error(`✗ ${file.name}: ${uploadErr.message}`)
        }
      }
    } catch (err) {
      console.error(`✗ ${file.name}: ${err.message}`)
      errors++
    }
  }

  console.log(`\nStorage migration complete. Total: ${migrated} files migrated, ${errors} errors.`)
  if (errors > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
