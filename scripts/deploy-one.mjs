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
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
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
const deployment = await functions.createDeployment(FN, tarFile, true, 'src/main.js', '')
console.log(`  ✓ deployed ${FN} (deployment: ${deployment.$id})`)
try { rmSync(tarPath) } catch {}
console.log('done')
