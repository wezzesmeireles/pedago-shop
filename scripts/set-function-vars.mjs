import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Functions } from 'node-appwrite'

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1'
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1'
const API_KEY = required('APPWRITE_API_KEY')

function required(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required in scripts/.env.migration`)
  return value
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY)
const functions = new Functions(client)

const COMMON_VARS = {
  APPWRITE_ENDPOINT: ENDPOINT,
  APPWRITE_API_KEY: API_KEY,
  APPWRITE_DATABASE_ID: 'pedago-db',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://www.sitepedagogico.com',
}

const MP_VARS = {
  MERCADO_PAGO_ACCESS_TOKEN: required('MERCADO_PAGO_ACCESS_TOKEN'),
  MERCADO_PAGO_WEBHOOK_SECRET: required('MERCADO_PAGO_WEBHOOK_SECRET'),
}

const FUNCTION_VARS = {
  'register-user': { ...COMMON_VARS },
  'create-order': { ...COMMON_VARS, ...MP_VARS },
  'mp-webhook': { ...COMMON_VARS, ...MP_VARS },
  'download': { ...COMMON_VARS },
  'admin-users': { ...COMMON_VARS },
  'create-admin': { ...COMMON_VARS, CREATE_ADMIN_SECRET: required('CREATE_ADMIN_SECRET') },
  'recent-purchases': { ...COMMON_VARS },
  'reconcile-orders': { ...COMMON_VARS, ...MP_VARS },
}

async function setVars(fnId, vars) {
  const existing = {}
  try {
    const list = await functions.listVariables(fnId)
    for (const variable of list.variables) existing[variable.key] = variable.$id
  } catch {}

  for (const [key, value] of Object.entries(vars)) {
    try {
      if (existing[key]) await functions.updateVariable(fnId, existing[key], key, value)
      else await functions.createVariable(fnId, key, value)
      process.stdout.write(existing[key] ? 'u' : '.')
    } catch {
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
  console.log('\nVariáveis configuradas.')
}

main().catch((error) => { console.error('Fatal:', error.message); process.exit(1) })
