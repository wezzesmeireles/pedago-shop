import { Client, Account, Databases, Storage, Functions } from 'appwrite'

// Always talk to the API on the SAME origin the page was opened with (www vs
// non-www vs localhost). The configured endpoint only provides the path (/v1);
// we swap its host for the current origin so a visitor on www.sitepedagogico…
// doesn't make a cross-origin call to sitepedagogico… (which Appwrite blocks
// via CORS → blank page). The Vercel/Vite proxy forwards /v1 to Appwrite.
const configuredEndpoint = (import.meta.env.VITE_APPWRITE_ENDPOINT as string) || '/v1'
const endpointPath = configuredEndpoint.replace(/^https?:\/\/[^/]+/, '') || '/v1'
const endpoint =
  typeof window !== 'undefined' ? window.location.origin + endpointPath : configuredEndpoint

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)
export const functions = new Functions(client)

export const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID as string

export const COLLECTIONS = {
  PROFILES: 'profiles',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  DOWNLOAD_TOKENS: 'download_tokens',
  SITE_CONFIG: 'site_config',
  NEWSLETTER: 'newsletter',
} as const

export const BUCKETS = {
  PRODUCT_FILES: 'product-files',
  PRODUCT_COVERS: 'product-covers',
} as const

export const appwriteEndpoint = endpoint
