import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Users, Databases, Query } from 'node-appwrite'

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
} = process.env

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1')
  .setProject(APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1')
  .setKey(APPWRITE_API_KEY)

const users = new Users(client)
const db = new Databases(client)
const DB = 'pedago-db'

async function fetchAllProfiles() {
  const all = []
  let offset = 0
  const limit = 100
  while (true) {
    const res = await db.listDocuments(DB, 'profiles', [
      Query.limit(limit),
      Query.offset(offset),
    ])
    all.push(...res.documents)
    if (res.documents.length < limit) break
    offset += limit
  }
  return all
}

async function main() {
  console.log('Buscando profiles...')
  const profiles = await fetchAllProfiles()
  console.log(`Total: ${profiles.length} profiles\n`)

  let updated = 0
  let errors = 0
  let admins = 0
  let customers = 0

  for (const profile of profiles) {
    const userId = profile.userId
    if (!userId) continue

    const label = profile.role === 'ADMIN' ? 'admin' : 'customer'
    if (profile.role === 'ADMIN') admins++
    else customers++

    try {
      // Update labels (role)
      await users.updateLabels(userId, [label])

      // Update phone if exists and not empty
      if (profile.phone && profile.phone.trim()) {
        let phone = profile.phone.trim()
        // Appwrite requires E.164 format (+5511999999999)
        if (!phone.startsWith('+')) {
          phone = phone.replace(/\D/g, '')
          if (phone.length === 11 && phone.startsWith('0')) {
            phone = '+55' + phone.slice(1)
          } else if (phone.length === 10 || phone.length === 11) {
            phone = '+55' + phone
          } else if (phone.length > 11) {
            phone = '+' + phone
          }
        }
        // Validate E.164 format before sending
        if (/^\+\d{8,15}$/.test(phone)) {
          await users.updatePhone(userId, phone)
        }
      }

      process.stdout.write('.')
      updated++
    } catch (err) {
      if (err.code !== 404) {
        process.stdout.write('x')
        errors++
      }
      // 404 = user deleted/not found, skip silently
    }
  }

  console.log(`\n\n✅ Concluído!`)
  console.log(`  Atualizados : ${updated}`)
  console.log(`  Admins      : ${admins}`)
  console.log(`  Customers   : ${customers}`)
  console.log(`  Erros       : ${errors}`)
}

main().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
