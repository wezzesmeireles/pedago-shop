// End-to-end test for the download fix.
//
// Reproduces, against the LIVE Appwrite (via the same-domain proxy), the exact
// browser download flow after the fix:
//   1. log a customer in           → session secret
//   2. mint a JWT                   → account.createJWT()
//   3. fetch a product file with    X-Appwrite-JWT   → expect 200 application/pdf  (the FIX)
//   4. fetch the same file with NO auth               → expect 401               (the BUG)
//   5. fetch with the session secret X-Appwrite-Session → expect 200            (old happy path)
//
// Run:  node scripts/test-download-jwt.mjs <email> <password>

const ENDPOINT = 'https://sitepedagogico.com.br/v1'
const PROJECT = '6a1bc2b1000d09c3f5f1'
const DB = 'pedago-db'
const BUCKET = 'product-files'

const [, , email, password] = process.argv
if (!email || !password) {
  console.error('Usage: node scripts/test-download-jwt.mjs <email> <password>')
  process.exit(1)
}

const h = (extra = {}) => ({ 'X-Appwrite-Project': PROJECT, ...extra })
let pass = 0, fail = 0
const ok = (cond, msg) => { console.log(`${cond ? '✅' : '❌'} ${msg}`); cond ? pass++ : fail++ }

// 1. Login
const loginRes = await fetch(`${ENDPOINT}/account/sessions/email`, {
  method: 'POST',
  headers: h({ 'content-type': 'application/json' }),
  body: JSON.stringify({ email, password }),
})
if (!loginRes.ok) {
  console.error('Login failed:', loginRes.status, await loginRes.text())
  process.exit(1)
}
const session = await loginRes.json()
const secret = session.secret
ok(!!secret, `logged in as ${email} (session ${session.$id})`)

// 2. Mint JWT
const jwtRes = await fetch(`${ENDPOINT}/account/jwts`, {
  method: 'POST',
  headers: h({ 'content-type': 'application/json', 'X-Appwrite-Session': secret }),
})
const { jwt } = await jwtRes.json()
ok(!!jwt, `minted JWT (${jwt ? jwt.slice(0, 12) + '…' : 'none'})`)

// Find a product with a fileKey (products are public-read)
const prodRes = await fetch(
  `${ENDPOINT}/databases/${DB}/collections/products/documents?queries[]=${encodeURIComponent('limit(100)')}`,
  { headers: h() },
)
const products = (await prodRes.json()).documents ?? []
const withFile = products.find((p) => p.fileKey)
if (!withFile) { console.error('No product with a fileKey found to test against.'); process.exit(1) }
const fileId = String(withFile.fileKey).replace(/\.[^.]+$/, '')
console.log(`\nTesting against file "${fileId}" (product: ${withFile.name})\n`)

const fileUrl = `${ENDPOINT}/storage/buckets/${BUCKET}/files/${fileId}/download?project=${PROJECT}`

// 3. THE FIX — download authenticated with JWT
const jwtDl = await fetch(fileUrl, { headers: h({ 'X-Appwrite-JWT': jwt }) })
const ct = jwtDl.headers.get('content-type') || ''
ok(jwtDl.status === 200, `JWT download → ${jwtDl.status} (expected 200)  content-type: ${ct}`)

// 4. THE BUG — no auth should be rejected
const noAuth = await fetch(fileUrl, { headers: h() })
ok(noAuth.status === 401, `no-auth download → ${noAuth.status} (expected 401)`)

// 5. Old happy path — session secret still works
const secretDl = await fetch(fileUrl, { headers: h({ 'X-Appwrite-Session': secret }) })
ok(secretDl.status === 200, `session-secret download → ${secretDl.status} (expected 200)`)

// Cleanup: delete the test session
await fetch(`${ENDPOINT}/account/sessions/current`, {
  method: 'DELETE', headers: h({ 'X-Appwrite-Session': secret }),
}).catch(() => {})

console.log(`\n${fail === 0 ? '🎉 ALL PASSED' : '⚠️  FAILURES'} — ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
