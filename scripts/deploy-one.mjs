import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Functions } from 'node-appwrite'
import { readFileSync, rmSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'
import * as tar from 'tar'

const FN = process.argv[2] || 'admin-users'
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID || '6a1bc2b1000d09c3f5f1')
  .setKey(process.env.APPWRITE_API_KEY)
const functions = new Functions(client)
const FUNCTIONS_DIR = fileURLToPath(new URL('../appwrite/functions', import.meta.url))

const srcDir = join(FUNCTIONS_DIR, FN)
const tarPath = join(FUNCTIONS_DIR, `${FN}.tar.gz`)

console.log(`Deploying ONLY: ${FN}`)
if (existsSync(join(srcDir, 'package.json'))) {
  console.log('  npm install --omit=dev ...')
  execSync('npm install --omit=dev', { cwd: srcDir, stdio: 'pipe' })
}
await tar.create({ gzip: true, file: tarPath, cwd: srcDir, portable: true }, ['.'])
const tarFile = new File([readFileSync(tarPath)], `${FN}.tar.gz`, { type: 'application/gzip' })
const deployment = await functions.createDeployment(FN, tarFile, true, 'src/main.js', 'npm install')
console.log(`  ✓ uploaded ${FN} (deployment: ${deployment.$id}). Building...`)
try { rmSync(tarPath) } catch {}

let d = deployment
for (let i = 0; i < 45; i++) {
  await new Promise(r => setTimeout(r, 2000))
  d = await functions.getDeployment(FN, deployment.$id)
  if (d.status === 'ready' || d.status === 'failed') {
    break
  }
  process.stdout.write('.')
}
console.log(`\nDeployment status: ${d.status}`)
if (d.buildLogs) console.log('Build logs:\n', d.buildLogs)
if (d.buildErrors) console.error('Build errors:\n', d.buildErrors)
if (d.status !== 'ready') {
  throw new Error(`Deployment failed with status ${d.status}`)
}
await functions.updateFunctionDeployment(FN, deployment.$id)
console.log(`  ✓ activated deployment ${deployment.$id} for ${FN}`)
