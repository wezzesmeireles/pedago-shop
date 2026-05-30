import { config } from 'dotenv'
config({ path: new URL('.env.migration', import.meta.url).pathname })

import https from 'https'
import http from 'http'
import { Client, Storage, InputFile } from 'node-appwrite'
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

const storage = new Storage(appwrite)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Sanitize filename → Appwrite-safe file ID (max 36 chars) ─────────────────
function sanitizeFileId(name) {
  // Remove extension, replace non-alphanumeric with hyphens, collapse multiple hyphens
  const base = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
  // Ensure starts with a letter or digit
  const safe = /^[a-zA-Z0-9]/.test(base) ? base : 'f-' + base
  // Truncate to 36 chars
  return safe.slice(0, 36) || 'file'
}

// ── Download a URL into a Buffer ──────────────────────────────────────────────
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const makeRequest = (targetUrl) => {
      const lib = targetUrl.startsWith('https') ? https : http
      lib.get(targetUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          makeRequest(res.headers.location)
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`))
          return
        }
        const chunks = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    }
    makeRequest(url)
  })
}

// ── List all files in Supabase storage bucket (paginated) ────────────────────
async function listAllFiles() {
  const allFiles = []
  const pageSize = 100
  let offset = 0
  while (true) {
    const { data, error } = await supabase.storage.from('product-files').list('', { limit: pageSize, offset })
    if (error) throw new Error(`Storage list error: ${error.message}`)
    if (!data?.length) break
    allFiles.push(...data)
    if (data.length < pageSize) break
    offset += pageSize
  }
  return allFiles
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
    // Get a signed URL valid for 1 hour
    const { data: signed, error: signErr } = await supabase.storage
      .from('product-files')
      .createSignedUrl(file.name, 3600)

    if (signErr || !signed?.signedUrl) {
      console.error(`✗ ${file.name}: failed to get signed URL — ${signErr?.message ?? 'no URL'}`)
      errors++
      continue
    }

    try {
      // Download file content
      const buffer = await downloadBuffer(signed.signedUrl)

      // Build Appwrite file ID from filename
      const fileId = sanitizeFileId(file.name)

      // Upload to Appwrite
      const inputFile = InputFile.fromBuffer(buffer, file.name)
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
