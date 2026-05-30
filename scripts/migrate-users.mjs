import { config } from 'dotenv'
config({ path: new URL('.env.migration', import.meta.url).pathname })

import { Client, Users } from 'node-appwrite'
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

const users = new Users(appwrite)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Fetch all Supabase users (paginated) ─────────────────────────────────────
async function fetchAllUsers() {
  const all = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(`Failed to list users: ${error.message}`)

    const batch = data?.users ?? []
    if (batch.length === 0) break
    all.push(...batch)
    if (batch.length < perPage) break
    page++
  }

  return all
}

// ── Migrate a single user ─────────────────────────────────────────────────────
async function migrateUser(user) {
  const { id, email, phone, encrypted_password, identities, user_metadata } = user
  const name = user_metadata?.name || email.split('@')[0]

  const hasGoogle = Array.isArray(identities) &&
    identities.some((i) => i.provider === 'google')

  try {
    if (hasGoogle) {
      // OAuth user — no password
      await users.create(id, email, phone || undefined, undefined, name)
    } else if (encrypted_password && encrypted_password.startsWith('$2')) {
      // Bcrypt hash — preserve it
      await users.createBcryptUser(id, email, encrypted_password, name)
    } else {
      // No password (magic link / other)
      await users.create(id, email, phone || undefined, undefined, name)
    }

    console.log(`✓ ${email}`)
  } catch (err) {
    if (err.code === 409) {
      console.log(`⏭ ${email} — already exists`)
    } else {
      console.error(`✗ ${email}: ${err.message}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching users from Supabase…')
  const allUsers = await fetchAllUsers()
  console.log(`Found ${allUsers.length} users. Migrating to Appwrite…\n`)

  for (const user of allUsers) {
    await migrateUser(user)
  }

  console.log('\nUser migration complete.')
}

main().catch((err) => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
