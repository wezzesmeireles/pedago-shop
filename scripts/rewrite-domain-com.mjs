// Reescreve URLs de imagem no banco do domínio antigo (vencido) pro novo.
// FROM sitepedagogico.com.br -> TO www.sitepedagogico.com
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })
import { Client, Databases, Query } from 'node-appwrite'

const FROM = 'sitepedagogico.com.br'
const TO = 'www.sitepedagogico.com'
const DB = 'pedago-db'
const APPLY = process.argv.includes('--apply') // sem isso, só simula

const c = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)
const db = new Databases(c)

const rw = (v) => (typeof v === 'string' && v.includes(FROM) ? v.split(FROM).join(TO) : v)

async function listAll(col) {
  const out = []; let cursor = null
  while (true) {
    const q = [Query.limit(100)]
    if (cursor) q.push(Query.cursorAfter(cursor))
    const r = await db.listDocuments(DB, col, q)
    out.push(...r.documents)
    if (r.documents.length < 100) break
    cursor = r.documents[r.documents.length - 1].$id
  }
  return out
}

// Reescreve campos string simples de uma coleção
async function rewriteCollection(col, fields) {
  let changed = 0
  const docs = await listAll(col)
  for (const d of docs) {
    const upd = {}
    for (const f of fields) {
      if (typeof d[f] === 'string' && d[f].includes(FROM)) upd[f] = rw(d[f])
    }
    if (Object.keys(upd).length) {
      changed++
      if (APPLY) await db.updateDocument(DB, col, d.$id, upd)
    }
  }
  console.log(`${col}: ${changed}/${docs.length} docs com ${FROM}`)
}

async function main() {
  console.log(APPLY ? '=== APLICANDO ===' : '=== SIMULAÇÃO (use --apply pra gravar) ===')
  await rewriteCollection('products', ['coverImageUrl'])
  await rewriteCollection('categories', ['imageUrl', 'coverImageUrl'])
  await rewriteCollection('order_items', ['coverImageUrl'])

  // site_config: value é um JSON gigante; troca tudo na string
  const cfg = await db.getDocument(DB, 'site_config', 'global')
  if (cfg.value.includes(FROM)) {
    const n = (cfg.value.match(new RegExp(FROM.replace('.', '\\.'), 'g')) || []).length
    console.log(`site_config(global): ${n} ocorrências de ${FROM}`)
    if (APPLY) await db.updateDocument(DB, 'site_config', 'global', { value: cfg.value.split(FROM).join(TO) })
  } else {
    console.log('site_config(global): sem ocorrências')
  }
  console.log('done')
}
main().catch(e => { console.error('ERR', e.message); process.exit(1) })
