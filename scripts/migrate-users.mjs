import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Users } from 'node-appwrite'

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env

if (!APPWRITE_API_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('✗ Missing required env vars. Check scripts/.env.migration')
  process.exit(1)
}

// Extract project ref from URL or use hardcoded
const SUPABASE_PROJECT_REF = (SUPABASE_URL || '')
  .replace('https://', '')
  .replace('.supabase.co', '')
  .trim() || 'hdldxgbvkjcoesmfoglm'

const appwrite = new Client()
  .setEndpoint(APPWRITE_ENDPOINT || 'http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1')
  .setProject(APPWRITE_PROJECT_ID || '6a1af05e0030b967a508')
  .setKey(APPWRITE_API_KEY)

const users = new Users(appwrite)

// ── Fetch all users via Management API SQL query ─────────────────────────────
async function fetchAllUsers() {
  const all = []
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
          query: `
            SELECT
              u.id,
              u.email,
              u.phone,
              u.encrypted_password,
              u.raw_user_meta_data AS user_metadata,
              COALESCE(
                json_agg(
                  json_build_object('provider', i.provider)
                ) FILTER (WHERE i.provider IS NOT NULL),
                '[]'::json
              ) AS identities
            FROM auth.users u
            LEFT JOIN auth.identities i ON i.user_id = u.id
            GROUP BY u.id, u.email, u.phone, u.encrypted_password, u.raw_user_meta_data
            ORDER BY u.created_at ASC
            LIMIT ${pageSize} OFFSET ${offset}
          `,
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Management API SQL error ${res.status}: ${body}`)
    }

    const rows = await res.json()
    if (!Array.isArray(rows) || rows.length === 0) break
    all.push(...rows)
    if (rows.length < pageSize) break
    offset += pageSize
  }

  return all
}

// ── Migrate a single user ─────────────────────────────────────────────────────
async function migrateUser(user) {
  const { id, email, phone, encrypted_password, identities, user_metadata } = user
  const name = user_metadata?.name || email?.split('@')[0] || 'User'

  const hasGoogle = Array.isArray(identities) &&
    identities.some((i) => i.provider === 'google')

  try {
    if (hasGoogle) {
      await users.create(id, email, phone || undefined, undefined, name)
    } else if (encrypted_password && encrypted_password.startsWith('$2')) {
      await users.createBcryptUser(id, email, encrypted_password, name)
    } else {
      await users.create(id, email, phone || undefined, undefined, name)
    }

    console.log(`✓ ${email}`)
    return false
  } catch (err) {
    if (err.code === 409) {
      console.log(`⏭ ${email} — already exists`)
      return false
    }
    console.error(`✗ ${email}: ${err.message}`)
    return true
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Fetching users from Supabase project ${SUPABASE_PROJECT_REF}…`)
  const allUsers = await fetchAllUsers()
  console.log(`Found ${allUsers.length} users. Migrating to Appwrite…\n`)

  let failCount = 0
  for (const user of allUsers) {
    if (await migrateUser(user)) failCount++
  }

  if (failCount > 0) {
    console.error(`\n⚠ ${failCount} user(s) failed. Check output above.`)
    process.exit(1)
  }

  console.log('\nUser migration complete.')
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
