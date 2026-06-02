import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Users } from 'node-appwrite'
import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:5173'
const PROJECT = process.env.APPWRITE_PROJECT_ID
const ADMIN_ID = '587907e2-8cb1-4531-b61e-652776d2f134' // leleses8@gmail.com

mkdirSync('./screenshots', { recursive: true })

// 1. server-side: mint a login token for the admin
const srv = new Client().setEndpoint(process.env.APPWRITE_ENDPOINT).setProject(PROJECT).setKey(process.env.APPWRITE_API_KEY)
const token = await new Users(srv).createToken(ADMIN_ID)
console.log('token minted for', ADMIN_ID)

// 2. browser: iPhone 12-ish viewport
const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
})
const page = await ctx.newPage()
const errors = []
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', e => errors.push(e.message))

// land on app origin so fetch hits the /v1 proxy + localStorage is same-origin
await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 20000 })

// 3. exchange token → session, capture fallback cookie, store it
const fallback = await page.evaluate(async ({ userId, secret, project }) => {
  const res = await fetch('/v1/account/sessions/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Appwrite-Project': project,
      'X-Appwrite-Response-Format': '1.7.0',
    },
    body: JSON.stringify({ userId, secret }),
  })
  const body = await res.json()
  const hdr = res.headers.get('X-Fallback-Cookies')
  // SDK stores either the header value, or {a_session_<project>: secret}
  const value = hdr || JSON.stringify({ [`a_session_${project}`]: body.secret })
  localStorage.setItem('cookieFallback', value)
  return { status: res.status, hasHeader: !!hdr, hasSecret: !!body.secret }
}, { userId: token.userId, secret: token.secret, project: PROJECT })
console.log('session exchange:', fallback)

const pages = [
  ['admin-dashboard', '/admin/dashboard'],
  ['admin-produtos', '/admin/produtos'],
  ['admin-pedidos', '/admin/pedidos'],
  ['admin-usuarios', '/admin/usuarios'],
  ['admin-categorias', '/admin/categorias'],
  ['admin-customizar', '/admin/customizar'],
  ['admin-integracoes', '/admin/integracoes'],
  ['admin-inscritos', '/admin/inscritos'],
]

for (const [name, path] of pages) {
  try {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForTimeout(1800)
    await page.screenshot({ path: `./screenshots/m-${name}.png`, fullPage: true })
    const h1 = await page.locator('h1').first().textContent().catch(() => '?')
    console.log(`📸 m-${name}  (h1: ${(h1 || '').trim().slice(0, 30)})`)
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`)
  }
}

console.log('\nconsole errors:', errors.length ? errors.slice(0, 5).join('\n') : 'none')
await browser.close()
