import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:5173'
mkdirSync('./screenshots', { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await ctx.newPage()

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push(err.message))

async function shot(name) {
  await page.screenshot({ path: `./screenshots/${name}.png` })
  console.log('  📸', name)
}

// 1. Home
console.log('1. Home page...')
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 20000 })
console.log('  Title:', await page.title())
await shot('01-home')

// 2. Catalog
console.log('2. Catalog...')
await page.goto(BASE + '/catalogo', { waitUntil: 'networkidle', timeout: 20000 })
const cards = await page.locator('article, [class*="card"], [class*="product"]').count()
console.log('  Cards visible:', cards)
await shot('02-catalog')

// 3. Login
console.log('3. Login...')
await page.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 10000 })
await shot('03-login')

// 4. Admin login
console.log('4. Admin login...')
await page.goto(BASE + '/admin/login', { waitUntil: 'networkidle', timeout: 10000 })
await shot('04-admin-login')

await browser.close()
console.log('\nConsole errors:', errors.length === 0 ? 'none' : errors.slice(0,5).join('\n'))
