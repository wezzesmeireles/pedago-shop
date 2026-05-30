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
  return name
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .slice(0, 36)
}

// ── Download a URL into a Buffer ──────────────────────────────────────────────
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    const request = (targetUrl) => {
      client.get(targetUrl, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return request(res.headers.location)
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${targetUrl}`))
        }
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    }

    request(url)
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Listing files in Supabase storage bucket "product-files"…')

  const { data: files, error } = await supabase.storage
    .from('product-files')
    .list('', { limit: 1000 })

  if (error) {
    console.error('✗ Failed to list files:', error.message)
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
      await storage.createFile(
        'product-files',
        fileId,
        InputFile.fromBuffer(buffer, file.name),
      )

      const sizeKB = (buffer.length / 1024).toFixed(1)
      console.log(`✓ ${file.name} (${sizeKB}KB)`)
      migrated++
    } catch (err) {
      console.error(`✗ ${file.name}: ${err.message}`)
      errors++
    }
  }

  console.log(`\nStorage migration complete. Total: ${migrated} files migrated, ${errors} errors.`)
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
