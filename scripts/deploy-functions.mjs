import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Functions, ID } from 'node-appwrite'
import { readFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import * as tar from 'tar'

const {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  APPWRITE_API_KEY,
} = process.env

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT || 'http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1')
  .setProject(APPWRITE_PROJECT_ID || '6a1af05e0030b967a508')
  .setKey(APPWRITE_API_KEY)

const functions = new Functions(client)

const FUNCTIONS_DIR = fileURLToPath(new URL('../appwrite/functions', import.meta.url))

const FUNCTION_DEFS = [
  { id: 'register-user',    name: 'register-user',    timeout: 15,  schedule: '' },
  { id: 'create-order',     name: 'create-order',     timeout: 30,  schedule: '' },
  { id: 'mp-webhook',       name: 'mp-webhook',        timeout: 30,  schedule: '' },
  { id: 'download',         name: 'download',          timeout: 30,  schedule: '' },
  { id: 'admin-users',      name: 'admin-users',       timeout: 15,  schedule: '' },
  { id: 'create-admin',     name: 'create-admin',      timeout: 15,  schedule: '' },
  { id: 'recent-purchases', name: 'recent-purchases',  timeout: 15,  schedule: '' },
  { id: 'reconcile-orders', name: 'reconcile-orders',  timeout: 60,  schedule: '*/5 * * * *' },
]

async function ensureFunction(def) {
  try {
    await functions.get(def.id)
    console.log(`  ~ ${def.id} already exists`)
  } catch (err) {
    if (err.code === 404) {
      await functions.create(
        def.id,
        def.name,
        'node-20.0',
        [],                  // execute permissions
        [],                  // events
        def.schedule || '',  // schedule
        def.timeout,         // timeout
        true,                // enabled
        false,               // logging
        'src/main.js',       // entrypoint
      )
      console.log(`  ✓ created ${def.id}`)
    } else {
      throw err
    }
  }
}

async function deployFunction(def) {
  console.log(`\nDeploying ${def.id}...`)
  const srcDir = join(FUNCTIONS_DIR, def.id)
  const tarPath = join(FUNCTIONS_DIR, `${def.id}.tar.gz`)

  // Install dependencies before packaging
  if (existsSync(join(srcDir, 'package.json'))) {
    try {
      console.log(`  Installing dependencies...`)
      execSync('npm install --omit=dev', { cwd: srcDir, stdio: 'pipe' })
      console.log(`  ✓ npm install done`)
    } catch(e) {
      console.error(`  ✗ npm install failed: ${e.message}`)
    }
  }

  try {
    await tar.create(
      { gzip: true, file: tarPath, cwd: srcDir, portable: true },
      ['.']
    )
  } catch (e) {
    console.error(`  ✗ tar failed: ${e.message}`)
    return
  }

  const tarBuffer = readFileSync(tarPath)
  const tarFile = new File([tarBuffer], `${def.id}.tar.gz`, { type: 'application/gzip' })

  try {
    const deployment = await functions.createDeployment(
      def.id,
      tarFile,
      true,         // activate
      'src/main.js',
      '',
    )
    console.log(`  ✓ deployed ${def.id} (deployment: ${deployment.$id})`)
  } catch (err) {
    console.error(`  ✗ deploy failed for ${def.id}: ${err.message}`)
  }

  // cleanup tar
  try { rmSync(tarPath) } catch {}
}

async function main() {
  console.log('=== Creating functions ===')
  for (const def of FUNCTION_DEFS) {
    await ensureFunction(def)
  }

  console.log('\n=== Deploying code ===')
  for (const def of FUNCTION_DEFS) {
    await deployFunction(def)
  }

  console.log('\n✅ Done.')
}

main().catch(err => {
  console.error('Fatal:', err.message)
  process.exit(1)
})
