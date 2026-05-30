import { Client, Account, Databases, Storage, Functions } from 'appwrite'

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
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
} as const

export const BUCKETS = {
  PRODUCT_FILES: 'product-files',
} as const
