/**
 * backfill-profiles.mjs — cria um documento em `profiles` para toda conta de
 * auth que ainda não tem (ex.: usuários que entraram pelo Google, cujo OAuth só
 * cria a conta de auth). Sem isso eles não aparecem no admin (que lista de
 * profiles). Idempotente: usa o $id = userId, então rodar de novo só pula.
 *
 * node backfill-profiles.mjs            # aplica
 * node backfill-profiles.mjs --dry      # só mostra quem falta, não cria
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Users, Databases, Query } from 'node-appwrite'

const { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } = process.env
const DB = 'pedago-db'
const DRY = process.argv.includes('--dry')

const aw = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID).setKey(APPWRITE_API_KEY)
const users = new Users(aw)
const db = new Databases(aw)

// 1) todos os userIds que já têm profile
const haveProfile = new Set()
let pOffset = 0
while (true) {
  const r = await db.listDocuments(DB, 'profiles', [Query.limit(100), Query.offset(pOffset)])
  r.documents.forEach(p => haveProfile.add(p.userId))
  if (r.documents.length < 100) break
  pOffset += 100
}
console.log(`Profiles existentes: ${haveProfile.size}`)

// 2) varre todas as contas de auth
let created = 0, skipped = 0, failed = 0, total = 0
let offset = 0
while (true) {
  const r = await users.list([Query.limit(100), Query.offset(offset)])
  if (!r.users.length) break
  for (const u of r.users) {
    total++
    if (haveProfile.has(u.$id)) { skipped++; continue }
    const name = u.name || u.email?.split('@')[0] || 'Usuário'
    console.log(`${DRY ? '[dry] ' : ''}+ ${u.email || u.$id} (criado ${u.$createdAt})`)
    if (DRY) { created++; continue }
    try {
      await db.createDocument(DB, 'profiles', u.$id, {
        userId: u.$id,
        name,
        email: u.email ?? '',
        phone: u.phone ?? '',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: u.$createdAt,
        updatedAt: new Date().toISOString(),
      })
      created++
    } catch (e) {
      if (e.code === 409) { skipped++ } else { failed++; console.error(`  ✗ ${u.email}: ${e.message}`) }
    }
  }
  if (r.users.length < 100) break
  offset += 100
}

console.log(`\nContas de auth: ${total}`)
console.log(`${DRY ? 'Faltando (seriam criados)' : 'Criados'}: ${created} | Já tinham: ${skipped} | Falhas: ${failed}`)
