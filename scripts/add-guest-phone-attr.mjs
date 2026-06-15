/**
 * Adiciona o atributo `guestPhone` e seu índice na coleção `orders` do Appwrite.
 * Executar uma única vez: node scripts/add-guest-phone-attr.mjs
 * Requer: scripts/.env.migration com APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY
 */
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
config({ path: fileURLToPath(new URL('.env.migration', import.meta.url)) })

import { Client, Databases } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const DB = process.env.APPWRITE_DATABASE_ID || 'pedago-db'
const COLLECTION = 'orders'

async function run() {
  // 1. Criar atributo string guestPhone (tamanho 20, opcional)
  console.log('Criando atributo guestPhone...')
  try {
    await db.createStringAttribute(DB, COLLECTION, 'guestPhone', 20, false, null, false)
    console.log('  ✓ Atributo criado')
  } catch (err) {
    if (err.code === 409) {
      console.log('  ⚠ Atributo já existe, pulando')
    } else {
      throw err
    }
  }

  // Appwrite processa atributos de forma assíncrona — aguardar antes de criar o índice
  console.log('Aguardando processamento do atributo (10s)...')
  await new Promise(r => setTimeout(r, 10000))

  // 2. Criar índice para queries rápidas
  console.log('Criando índice guestPhone...')
  try {
    await db.createIndex(DB, COLLECTION, 'guestPhone_idx', 'key', ['guestPhone'], ['ASC'])
    console.log('  ✓ Índice criado')
  } catch (err) {
    if (err.code === 409) {
      console.log('  ⚠ Índice já existe, pulando')
    } else {
      throw err
    }
  }

  console.log('\n✅ Pronto! guestPhone está disponível na coleção orders.')
}

run().catch(err => {
  console.error('Erro:', err.message)
  process.exit(1)
})
