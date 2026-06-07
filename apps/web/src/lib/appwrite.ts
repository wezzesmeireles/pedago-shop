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

const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string

// Download a file from a `Role.users()` Storage bucket from the browser.
//
// Authenticating a raw fetch to Storage was the source of "download works for me
// but fails for some customers": the old code read the session SECRET out of the
// localStorage `cookieFallback`, which is empty whenever the SDK keeps the
// session in a real cookie, or when localStorage is blocked (private mode, some
// school tablets). We now mint a short-lived JWT instead — `account.createJWT()`
// uses whatever auth the SDK already has working (cookie OR fallback), so if the
// user could load this page they can download. The cookieFallback secret stays
// only as a last-ditch fallback. The request is same-origin (the /v1 proxy), so
// the custom auth header triggers no CORS preflight.
export async function fetchProductFile(fileId: string): Promise<Blob> {
  const headers: Record<string, string> = { 'X-Appwrite-Project': projectId }

  try {
    const { jwt } = await account.createJWT()
    if (jwt) headers['X-Appwrite-JWT'] = jwt
  } catch { /* fall through to the cookieFallback secret */ }

  if (!headers['X-Appwrite-JWT']) {
    try {
      const fb = JSON.parse(localStorage.getItem('cookieFallback') || '{}')
      const secret = fb[`a_session_${projectId}`] || ''
      if (secret) headers['X-Appwrite-Session'] = secret
    } catch { /* ignore */ }
  }

  const url = `${endpoint}/storage/buckets/${BUCKETS.PRODUCT_FILES}/files/${fileId}/download?project=${encodeURIComponent(projectId)}`
  const res = await fetch(url, { credentials: 'include', headers })
  if (!res.ok) throw new Error(`Storage fetch failed: ${res.status}`)
  return res.blob()
}

// Trigger a browser "Save as" for a Blob.
export function saveBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}
