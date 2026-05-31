import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Functions } from 'node-appwrite'

const ENDPOINT   = process.env.APPWRITE_ENDPOINT  || 'https://appwrite.wsgestao.digital/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1'
const API_KEY    = process.env.APPWRITE_API_KEY

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const functions = new Functions(client)

const COMMON_VARS = {
  APPWRITE_ENDPOINT:    ENDPOINT,
  APPWRITE_API_KEY:     API_KEY,
  APPWRITE_DATABASE_ID: 'pedago-db',
  FRONTEND_URL:         'http://localhost:5173',
}

const MP_VARS = {
  MERCADO_PAGO_ACCESS_TOKEN:    'APP_USR-9003469083293410-040913-aa181936a4262e6fd0cae4aba4fd2e76-819445316',
  MERCADO_PAGO_WEBHOOK_SECRET:  'a38cd97b549842390932dc498ee28fbbddde92fc19d5a99c6c0099e7d18238e6',
}

const FUNCTION_VARS = {
  'register-user':    { ...COMMON_VARS },
  'create-order':     { ...COMMON_VARS, ...MP_VARS },
  'mp-webhook':       { ...COMMON_VARS, ...MP_VARS },
  'download':         { ...COMMON_VARS },
  'admin-users':      { ...COMMON_VARS },
  'create-admin':     { ...COMMON_VARS },
  'recent-purchases': { ...COMMON_VARS },
  'reconcile-orders': { ...COMMON_VARS, ...MP_VARS },
}

async function setVars(fnId, vars) {
  // List existing vars to avoid duplicates
  let existing = {}
  try {
    const list = await functions.listVariables(fnId)
    for (const v of list.variables) {
      existing[v.key] = v.$id
    }
  } catch {}

  for (const [key, value] of Object.entries(vars)) {
    try {
      if (existing[key]) {
        await functions.updateVariable(fnId, existing[key], key, value)
        process.stdout.write('u')
      } else {
        await functions.createVariable(fnId, key, value)
        process.stdout.write('.')
      }
    } catch (e) {
      process.stdout.write('x')
    }
  }
}

async function main() {
  console.log('Configurando variáveis das funções...\n')
  for (const [fnId, vars] of Object.entries(FUNCTION_VARS)) {
    process.stdout.write(`  ${fnId.padEnd(20)} `)
    await setVars(fnId, vars)
    console.log()
  }
  console.log('\n✅ Variáveis configuradas!')
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
