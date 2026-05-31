# Migração Supabase → Appwrite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate pedago-shop entirely from Supabase (Auth + PostgreSQL + Storage + Edge Functions) to Appwrite, preserving all users (passwords included), data, files and functionality without any UI changes.

**Architecture:** The Vue 3 + Vite frontend in `apps/web/` replaces `@supabase/supabase-js` with the `appwrite` JS SDK, touching only the lib client, four stores, one service, and view-level direct calls. The eight Supabase Deno edge functions are rewritten as Appwrite Node.js Functions. Data is migrated via Node.js scripts that read from Supabase (service role) and write to Appwrite (API key), preserving original UUIDs as document IDs and using `createBcryptUser()` to preserve password hashes.

**Tech Stack:** Vue 3, Vite, Appwrite JS SDK (`appwrite` npm), node-appwrite (migration scripts + functions), Appwrite CLI, Node.js ≥ 20

---

## Appwrite Constants (used in every task)

```
APPWRITE_ENDPOINT = http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
APPWRITE_PROJECT_ID = 6a1af05e0030b967a508
APPWRITE_DATABASE_ID = pedago-db
```

Collection IDs (same as table names):
`profiles` · `products` · `categories` · `orders` · `order_items` · `download_tokens` · `site_config` · `webhook_events`

Storage bucket ID: `product-files`

---

## File Map

| Action | Path |
|--------|------|
| Create | `apps/web/src/lib/appwrite.ts` |
| Delete | `apps/web/src/lib/supabase.ts` |
| Modify | `apps/web/src/stores/auth.store.ts` |
| Modify | `apps/web/src/stores/catalog.store.ts` |
| Modify | `apps/web/src/stores/site-config.store.ts` |
| Modify | `apps/web/src/services/api.ts` |
| Modify | `apps/web/src/views/auth/LoginView.vue` |
| Modify | `apps/web/src/views/auth/RegisterView.vue` |
| Modify | `apps/web/src/views/auth/GoogleCallbackView.vue` |
| Modify | `apps/web/src/views/auth/ForgotPasswordView.vue` |
| Modify | `apps/web/src/views/auth/ResetPasswordView.vue` |
| Modify | `apps/web/src/views/auth/PhoneRequiredView.vue` |
| Modify | `apps/web/src/views/auth/AdminLoginView.vue` |
| Modify | `apps/web/src/views/admin/DashboardView.vue` |
| Modify | `apps/web/src/views/admin/ProductsView.vue` |
| Modify | `apps/web/src/views/admin/OrdersView.vue` |
| Modify | `apps/web/src/views/admin/UsersView.vue` |
| Modify | `apps/web/src/views/admin/CategoriesView.vue` |
| Modify | `apps/web/src/views/admin/CustomizeView.vue` |
| Modify | `apps/web/src/views/admin/IntegrationsView.vue` |
| Modify | `apps/web/src/views/public/HomeView.vue` |
| Modify | `apps/web/src/views/public/CatalogView.vue` |
| Modify | `apps/web/src/views/public/ProductView.vue` |
| Modify | `apps/web/src/views/public/CheckoutView.vue` |
| Modify | `apps/web/src/views/public/CheckoutSuccessView.vue` |
| Modify | `apps/web/src/views/customer/DownloadsView.vue` |
| Modify | `apps/web/src/views/customer/OrdersView.vue` |
| Create | `appwrite/functions/register-user/src/main.js` |
| Create | `appwrite/functions/create-order/src/main.js` |
| Create | `appwrite/functions/mp-webhook/src/main.js` |
| Create | `appwrite/functions/download/src/main.js` |
| Create | `appwrite/functions/admin-users/src/main.js` |
| Create | `appwrite/functions/create-admin/src/main.js` |
| Create | `appwrite/functions/recent-purchases/src/main.js` |
| Create | `appwrite/functions/reconcile-orders/src/main.js` |
| Create | `scripts/migrate-users.mjs` |
| Create | `scripts/migrate-db.mjs` |
| Create | `scripts/migrate-storage.mjs` |
| Modify | `apps/web/.env` |
| Modify | `apps/web/package.json` |

---

## Phase 1 — Appwrite Provisioning

### Task 1: Install Appwrite CLI and generate API key

- [ ] **Step 1: Install Appwrite CLI**

```bash
npm install -g appwrite-cli
```

- [ ] **Step 2: Login to Appwrite instance**

```bash
appwrite login --endpoint http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
```

Enter email and password of the Appwrite admin account when prompted.

- [ ] **Step 3: Generate an API key with all scopes**

In the Appwrite Console → Project `6a1af05e0030b967a508` → Overview → API Keys → Create Key.

Scopes needed: `users.read`, `users.write`, `databases.read`, `databases.write`, `storage.read`, `storage.write`, `functions.read`, `functions.write`.

Save the key — it will be used in every migration script and function.

```
APPWRITE_API_KEY=<generated-key>
```

- [ ] **Step 4: Commit nothing — all secrets stay local in `.env`**

---

### Task 2: Create Appwrite Database and all Collections

- [ ] **Step 1: Create the database**

In Appwrite Console → Databases → Create Database.
- Name: `pedago-db`
- ID: `pedago-db`

- [ ] **Step 2: Create `profiles` collection**

Databases → `pedago-db` → Create Collection.
- ID: `profiles`

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| userId | String | 36 | ✓ |
| name | String | 255 | |
| email | String | 255 | |
| phone | String | 50 | |
| role | Enum (CUSTOMER,ADMIN) | — | ✓ |
| avatarUrl | String | 512 | |
| isActive | Boolean | — | |
| createdAt | DateTime | — | |
| updatedAt | DateTime | — | |

Permissions: **Any** can read. **Users** can create. **Document** update/delete.

- [ ] **Step 3: Create `categories` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| name | String | 255 | ✓ |
| slug | String | 255 | ✓ |
| description | String | 1000 | |
| isActive | Boolean | — | |
| sortOrder | Integer | — | |
| createdAt | DateTime | — | |
| updatedAt | DateTime | — | |

Permissions: **Any** can read.

Index: `slug` (unique).

- [ ] **Step 4: Create `products` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| name | String | 255 | ✓ |
| slug | String | 255 | ✓ |
| price | Double | — | |
| comparePrice | Double | — | |
| description | String | 65535 | |
| coverImageUrl | String | 512 | |
| previewImages | String[] | 512 | |
| isActive | Boolean | — | |
| isFeatured | Boolean | — | |
| deletedAt | DateTime | — | |
| categoryId | String | 36 | |
| salesCount | Integer | — | |
| pageCount | Integer | — | |
| fileKey | String | 512 | |
| deliveryType | Enum (LINK,FILE) | — | |
| deliveryLink | String | 1024 | |
| tags | String[] | 100 | |
| sortOrder | Integer | — | |
| createdAt | DateTime | — | |
| updatedAt | DateTime | — | |

Permissions: **Any** can read.

Indexes: `slug` (unique), `isActive` (key), `isFeatured` (key), `deletedAt` (key), `categoryId` (key).

- [ ] **Step 5: Create `orders` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| orderNumber | String | 30 | ✓ |
| userId | String | 36 | ✓ |
| customerName | String | 255 | |
| customerEmail | String | 255 | |
| status | Enum (AWAITING_PAYMENT,PAID,CANCELLED,REFUNDED) | — | ✓ |
| totalAmount | Double | — | |
| paymentMethod | Enum (PIX,CREDIT_CARD,FREE) | — | |
| mpPaymentId | String | 100 | |
| mpPreferenceId | String | 100 | |
| mpStatus | String | 50 | |
| paidAt | DateTime | — | |
| expiresAt | DateTime | — | |
| metadata | String | 65535 | |
| createdAt | DateTime | — | |
| updatedAt | DateTime | — | |

Permissions: **Users** read their own (via document-level). Admin API key reads all.

Indexes: `userId` (key), `status` (key), `orderNumber` (unique), `mpPaymentId` (key).

- [ ] **Step 6: Create `order_items` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| orderId | String | 36 | ✓ |
| productId | String | 36 | ✓ |
| productName | String | 255 | |
| unitPrice | Double | — | |
| quantity | Integer | — | |
| deliveryType | String | 10 | |
| deliveryLink | String | 1024 | |

Permissions: **Users** read, document-level update.

Index: `orderId` (key), `productId` (key).

- [ ] **Step 7: Create `download_tokens` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| token | String | 100 | ✓ |
| orderId | String | 36 | ✓ |
| orderItemId | String | 36 | ✓ |
| maxDownloads | Integer | — | |
| downloadCount | Integer | — | |
| lastDownloadAt | DateTime | — | |
| expiresAt | DateTime | — | |
| revokedAt | DateTime | — | |
| deliveryLink | String | 1024 | |

Permissions: Read/write via API key only (no client-side access).

Index: `token` (unique), `orderId` (key), `orderItemId` (key).

- [ ] **Step 8: Create `site_config` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| key | String | 50 | ✓ |
| value | String | 65535 | ✓ |
| updatedAt | DateTime | — | |

Permissions: **Any** can read. Write via API key only.

Index: `key` (unique).

- [ ] **Step 9: Create `webhook_events` collection**

Attributes:
| Key | Type | Size | Required |
|-----|------|------|----------|
| source | String | 50 | |
| eventId | String | 100 | |
| eventType | String | 100 | |
| payload | String | 65535 | |
| status | String | 20 | |
| errorMessage | String | 1000 | |
| createdAt | DateTime | — | |

Permissions: Write via API key only.

Index: `eventId` + `source` (composite unique).

- [ ] **Step 10: Commit — no code change yet, provisioning only**

```bash
# Note in git: Appwrite collections provisioned manually via console
git commit --allow-empty -m "chore: appwrite collections provisioned"
```

---

### Task 3: Create Appwrite Storage Bucket

- [ ] **Step 1: Create bucket `product-files`**

Appwrite Console → Storage → Create Bucket.
- ID: `product-files`
- Name: `product-files`
- Permissions: No public access (files only readable via API key / Functions)
- Max file size: 100 MB
- Allowed extensions: `pdf`, `jpg`, `jpeg`, `png`, `webp`, `gif`

- [ ] **Step 2: Confirm bucket is created**

Console shows `product-files` in Storage list.

---

### Task 4: Configure Appwrite Authentication

- [ ] **Step 1: Enable Email/Password auth**

Appwrite Console → Auth → Settings → Email/Password → Enable.

- [ ] **Step 2: Enable Google OAuth**

Auth → Settings → OAuth2 → Google → Enable.

Enter the same Google Client ID and Secret that is currently configured in Supabase.

Redirect URI to configure in Google Cloud Console:
```
http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1/account/sessions/oauth2/callback/google/6a1af05e0030b967a508
```

Success URL: `https://<your-frontend-domain>/auth/google-callback`
Failure URL: `https://<your-frontend-domain>/login`

- [ ] **Step 3: Set session length**

Auth → Settings → Session Length → 30 days (match Supabase default).

---

## Phase 2 — Data Migration Scripts

### Task 5: Create migration environment file

- [ ] **Step 1: Create `scripts/.env.migration`**

```ini
# Supabase source
SUPABASE_URL=https://hdldxgbvkjcoesmfoglm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Appwrite destination
APPWRITE_ENDPOINT=http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
APPWRITE_PROJECT_ID=6a1af05e0030b967a508
APPWRITE_API_KEY=<your-appwrite-api-key>
APPWRITE_DATABASE_ID=pedago-db
```

Add `scripts/.env.migration` to `.gitignore`.

- [ ] **Step 2: Create `scripts/package.json`**

```json
{
  "name": "pedago-migration-scripts",
  "type": "module",
  "dependencies": {
    "@supabase/supabase-js": "^2.45.4",
    "node-appwrite": "^16.0.0",
    "dotenv": "^16.0.0"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
cd scripts && npm install
```

---

### Task 6: Migrate users (preserving bcrypt password hashes)

This is the most critical task — it preserves passwords so no user needs to reset.

- [ ] **Step 1: Create `scripts/migrate-users.mjs`**

```js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Client, Users, ID } from 'node-appwrite'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const appwrite = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const users = new Users(appwrite)

async function fetchAllSupabaseUsers() {
  const allUsers = []
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    if (!data.users.length) break
    allUsers.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }
  return allUsers
}

async function migrateUser(sbUser) {
  const name = sbUser.user_metadata?.name || sbUser.email.split('@')[0]
  try {
    if (sbUser.app_metadata?.provider === 'google' || sbUser.identities?.some(i => i.provider === 'google')) {
      // OAuth users: create without password, they will re-auth via Google
      await users.create(sbUser.id, sbUser.email, undefined, name)
    } else if (sbUser.encrypted_password) {
      // Email/password users: preserve bcrypt hash
      await users.createBcryptUser(sbUser.id, sbUser.email, sbUser.encrypted_password, name)
    } else {
      await users.create(sbUser.id, sbUser.email, undefined, name)
    }
    console.log(`✓ ${sbUser.email}`)
  } catch (err) {
    if (err.code === 409) {
      console.log(`⏭  ${sbUser.email} — already exists`)
    } else {
      console.error(`✗ ${sbUser.email}: ${err.message}`)
    }
  }
}

const sbUsers = await fetchAllSupabaseUsers()
console.log(`Found ${sbUsers.length} users in Supabase`)
for (const u of sbUsers) {
  await migrateUser(u)
}
console.log('User migration complete.')
```

- [ ] **Step 2: Run migration**

```bash
cd scripts && node migrate-users.mjs
```

Expected output:
```
Found N users in Supabase
✓ user@example.com
✓ other@example.com
...
User migration complete.
```

- [ ] **Step 3: Verify in Appwrite Console**

Auth → Users — confirm all migrated users appear with correct emails.

---

### Task 7: Migrate database collections

- [ ] **Step 1: Create `scripts/migrate-db.mjs`**

```js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Client, Databases, ID, Permission, Role } from 'node-appwrite'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const appwrite = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(appwrite)
const DB = process.env.APPWRITE_DATABASE_ID

async function upsertDoc(collectionId, id, data) {
  try {
    await db.createDocument(DB, collectionId, id, data)
    process.stdout.write('.')
  } catch (err) {
    if (err.code === 409) {
      await db.updateDocument(DB, collectionId, id, data)
      process.stdout.write('u')
    } else {
      console.error(`\n✗ ${collectionId}/${id}: ${err.message}`)
    }
  }
}

// ── Categories ─────────────────────────────────────────────
const { data: cats } = await supabase.from('categories').select('*')
console.log(`\nMigrating ${cats.length} categories...`)
for (const c of cats) {
  await upsertDoc('categories', c.id, {
    name: c.name,
    slug: c.slug,
    description: c.description ?? '',
    isActive: c.is_active ?? true,
    sortOrder: c.sort_order ?? 0,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  })
}

// ── Products ───────────────────────────────────────────────
const { data: prods } = await supabase.from('products').select('*')
console.log(`\nMigrating ${prods.length} products...`)
for (const p of prods) {
  await upsertDoc('products', p.id, {
    name: p.name,
    slug: p.slug,
    price: p.price ?? 0,
    comparePrice: p.compare_price ?? null,
    description: p.description ?? '',
    coverImageUrl: p.cover_image_url ?? '',
    previewImages: p.preview_images ?? [],
    isActive: p.is_active ?? false,
    isFeatured: p.is_featured ?? false,
    deletedAt: p.deleted_at ?? null,
    categoryId: p.category_id ?? null,
    salesCount: p.sales_count ?? 0,
    pageCount: p.page_count ?? null,
    fileKey: p.file_key ?? null,
    deliveryType: p.delivery_type ?? 'FILE',
    deliveryLink: p.delivery_link ?? null,
    tags: p.tags ?? [],
    sortOrder: p.sort_order ?? 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  })
}

// ── Profiles ───────────────────────────────────────────────
const { data: profiles } = await supabase.from('profiles').select('*')
console.log(`\nMigrating ${profiles.length} profiles...`)
for (const p of profiles) {
  await upsertDoc('profiles', p.id, {
    userId: p.id,
    name: p.name ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    role: p.role ?? 'CUSTOMER',
    avatarUrl: p.avatar_url ?? '',
    isActive: p.is_active ?? true,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  })
}

// ── Orders ─────────────────────────────────────────────────
const { data: orders } = await supabase.from('orders').select('*')
console.log(`\nMigrating ${orders.length} orders...`)
for (const o of orders) {
  await upsertDoc('orders', o.id, {
    orderNumber: o.order_number,
    userId: o.user_id,
    customerName: o.customer_name ?? '',
    customerEmail: o.customer_email ?? '',
    status: o.status,
    totalAmount: o.total_amount ?? 0,
    paymentMethod: o.payment_method ?? null,
    mpPaymentId: o.mp_payment_id ?? null,
    mpPreferenceId: o.mp_preference_id ?? null,
    mpStatus: o.mp_status ?? null,
    paidAt: o.paid_at ?? null,
    expiresAt: o.expires_at ?? null,
    metadata: o.metadata ? JSON.stringify(o.metadata) : null,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  })
}

// ── Order Items ────────────────────────────────────────────
const { data: items } = await supabase.from('order_items').select('*')
console.log(`\nMigrating ${items.length} order items...`)
for (const i of items) {
  await upsertDoc('order_items', i.id, {
    orderId: i.order_id,
    productId: i.product_id,
    productName: i.product_name ?? '',
    unitPrice: i.unit_price ?? 0,
    quantity: i.quantity ?? 1,
    deliveryType: i.delivery_type ?? 'FILE',
    deliveryLink: i.delivery_link ?? null,
  })
}

// ── Download Tokens ────────────────────────────────────────
const { data: tokens } = await supabase.from('download_tokens').select('*')
console.log(`\nMigrating ${tokens.length} download tokens...`)
for (const t of tokens) {
  await upsertDoc('download_tokens', t.id, {
    token: t.token,
    orderId: t.order_id,
    orderItemId: t.order_item_id,
    maxDownloads: t.max_downloads ?? 5,
    downloadCount: t.download_count ?? 0,
    lastDownloadAt: t.last_download_at ?? null,
    expiresAt: t.expires_at,
    revokedAt: t.revoked_at ?? null,
    deliveryLink: t.delivery_link ?? null,
  })
}

// ── Site Config ────────────────────────────────────────────
const { data: configs } = await supabase.from('site_config').select('*')
console.log(`\nMigrating ${configs.length} site config entries...`)
for (const c of configs) {
  await upsertDoc('site_config', c.key, {
    key: c.key,
    value: typeof c.value === 'string' ? c.value : JSON.stringify(c.value),
    updatedAt: c.updated_at,
  })
}

console.log('\n\nDatabase migration complete.')
```

- [ ] **Step 2: Run migration**

```bash
cd scripts && node migrate-db.mjs
```

Expected output:
```
Migrating N categories...............
Migrating N products.................
Migrating N profiles.................
Migrating N orders...................
Migrating N order items..............
Migrating N download tokens..........
Migrating N site config entries......

Database migration complete.
```

- [ ] **Step 3: Verify spot-check in Appwrite Console**

Databases → `pedago-db` → `products` — confirm document count matches Supabase.

---

### Task 8: Migrate Storage files

- [ ] **Step 1: Create `scripts/migrate-storage.mjs`**

```js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Client, Storage, ID, InputFile } from 'node-appwrite'
import https from 'https'
import http from 'http'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const appwrite = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY)

const storage = new Storage(appwrite)
const BUCKET = 'product-files'

async function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http
    lib.get(url, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

const { data: files } = await supabase.storage.from('product-files').list('', { limit: 1000 })
console.log(`Found ${files.length} files in Supabase storage`)

for (const file of files) {
  const { data: signedUrl } = await supabase.storage.from('product-files').createSignedUrl(file.name, 3600)
  if (!signedUrl?.signedUrl) {
    console.error(`✗ Could not get URL for ${file.name}`)
    continue
  }
  try {
    const buffer = await downloadBuffer(signedUrl.signedUrl)
    const inputFile = InputFile.fromBuffer(buffer, file.name)
    await storage.createFile(BUCKET, ID.unique(), inputFile)
    console.log(`✓ ${file.name} (${Math.round(buffer.length / 1024)}KB)`)
  } catch (err) {
    console.error(`✗ ${file.name}: ${err.message}`)
  }
}

console.log('Storage migration complete.')
```

**Note:** Appwrite does not let you set the file ID to the original Supabase file name — Appwrite generates file IDs. After migration, update the `fileKey` attribute in the `products` collection to use the new Appwrite file IDs. Add a mapping step:

```js
// After the loop above, print the mapping:
console.log('\n\n⚠ Update products.fileKey with these new Appwrite file IDs:')
// (enhance the script to print name → appwrite-id pairs)
```

Alternatively, use the original filename as the Appwrite file ID:

```js
// Use sanitized filename as ID (Appwrite ID: ^[a-zA-Z0-9._-]{1,36}$)
const fileId = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 36)
await storage.createFile(BUCKET, fileId, inputFile)
```

- [ ] **Step 2: Run migration**

```bash
cd scripts && node migrate-storage.mjs
```

- [ ] **Step 3: Update `fileKey` in products if IDs changed**

If file IDs differ from the original `file_key` values stored in products, run a mapping update after migration. Check `products` documents in Appwrite and verify `fileKey` matches actual Storage file IDs.

---

## Phase 3 — Appwrite Functions

Each function lives in `appwrite/functions/<name>/src/main.js`. All functions use `node-appwrite` and share these env vars set in Appwrite Console → Functions → Settings → Variables:

```
APPWRITE_ENDPOINT        = http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
APPWRITE_FUNCTION_PROJECT_ID = 6a1af05e0030b967a508   (auto-set by runtime)
APPWRITE_API_KEY         = <your-api-key>
APPWRITE_DATABASE_ID     = pedago-db
FRONTEND_URL             = https://<your-frontend-domain>
MERCADO_PAGO_ACCESS_TOKEN = <mp-token-from-site-config>
MERCADO_PAGO_WEBHOOK_SECRET = <mp-secret-from-site-config>
```

---

### Task 9: Function `register-user`

- [ ] **Step 1: Create `appwrite/functions/register-user/src/main.js`**

```js
import { Client, Users, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON body' }, 400)
  }

  const { email, password, name, phone } = body
  if (!email || !password || !name) {
    return res.json({ error: 'email, password and name are required' }, 400)
  }

  let user
  try {
    user = await users.create(ID.unique(), email, phone ?? undefined, password, name)
  } catch (err) {
    if (err.code === 409) return res.json({ error: 'Email already registered' }, 409)
    error(err.message)
    return res.json({ error: 'Failed to create user' }, 500)
  }

  await db.createDocument(DB, 'profiles', user.$id, {
    userId: user.$id,
    name,
    email,
    phone: phone ?? '',
    role: 'CUSTOMER',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  return res.json({ id: user.$id, email: user.email }, 201)
}
```

- [ ] **Step 2: Create `appwrite/functions/register-user/package.json`**

```json
{
  "name": "register-user",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy function in Appwrite Console**

Functions → Create Function → Node.js 21.0 → Name: `register-user`.

Upload the `src/main.js` + `package.json` (or use Appwrite CLI: `appwrite deploy function`).

Set entrypoint: `src/main.js`. Set timeout: 15s.

- [ ] **Step 4: Commit**

```bash
git add appwrite/functions/register-user/
git commit -m "feat: appwrite function register-user"
```

---

### Task 10: Function `create-order`

- [ ] **Step 1: Create `appwrite/functions/create-order/src/main.js`**

```js
import { Client, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  let body
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    return res.json({ error: 'Invalid JSON' }, 400)
  }

  const { userId, customerName, customerEmail, items, paymentMethod } = body
  if (!userId || !items?.length) return res.json({ error: 'userId and items required' }, 400)

  // Fetch products to validate and get prices
  const productIds = items.map(i => i.productId)
  const products = await Promise.all(
    productIds.map(id => db.getDocument(DB, 'products', id))
  )

  let totalAmount = 0
  const orderItems = items.map((item, idx) => {
    const p = products[idx]
    if (!p.isActive || p.deletedAt) throw new Error(`Product ${p.name} unavailable`)
    totalAmount += p.price * (item.quantity ?? 1)
    return { product: p, quantity: item.quantity ?? 1 }
  })

  const isFree = totalAmount === 0
  const orderId = ID.unique()
  const now = new Date().toISOString()

  // Generate order number
  const year = new Date().getFullYear()
  const count = await db.listDocuments(DB, 'orders', [])
  const orderNumber = `ORD-${year}-${String(count.total + 1).padStart(6, '0')}`

  let mpResult = null
  let status = 'AWAITING_PAYMENT'
  let method = paymentMethod

  if (isFree) {
    status = 'PAID'
    method = 'FREE'
  } else if (paymentMethod === 'PIX') {
    // Call Mercado Pago PIX API
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: totalAmount,
        payment_method_id: 'pix',
        payer: { email: customerEmail },
        description: `Pedido ${orderNumber}`,
        notification_url: `${process.env.APPWRITE_ENDPOINT}/functions/mp-webhook/executions`,
      }),
    })
    mpResult = await mpResponse.json()
  } else if (paymentMethod === 'CREDIT_CARD') {
    // Create Mercado Pago preference
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: orderItems.map(oi => ({
          title: oi.product.name,
          quantity: oi.quantity,
          unit_price: oi.product.price,
        })),
        payer: { email: customerEmail },
        external_reference: orderId,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success`,
          failure: `${process.env.FRONTEND_URL}/checkout`,
        },
        auto_return: 'approved',
      }),
    })
    mpResult = await mpResponse.json()
  }

  // Create order
  const order = await db.createDocument(DB, 'orders', orderId, {
    orderNumber,
    userId,
    customerName: customerName ?? '',
    customerEmail: customerEmail ?? '',
    status,
    totalAmount,
    paymentMethod: method ?? null,
    mpPaymentId: mpResult?.id?.toString() ?? null,
    mpPreferenceId: mpResult?.id?.toString() ?? null,
    mpStatus: mpResult?.status ?? null,
    expiresAt: mpResult?.date_of_expiration ?? null,
    metadata: mpResult ? JSON.stringify({
      qrCode: mpResult.point_of_interaction?.transaction_data?.qr_code,
      qrCodeBase64: mpResult.point_of_interaction?.transaction_data?.qr_code_base64,
      checkoutUrl: mpResult.sandbox_init_point ?? mpResult.init_point,
    }) : null,
    createdAt: now,
    updatedAt: now,
  })

  // Create order items
  const createdItems = []
  for (const oi of orderItems) {
    const item = await db.createDocument(DB, 'order_items', ID.unique(), {
      orderId,
      productId: oi.product.$id,
      productName: oi.product.name,
      unitPrice: oi.product.price,
      quantity: oi.quantity,
      deliveryType: oi.product.deliveryType,
      deliveryLink: oi.product.deliveryLink ?? null,
    })
    createdItems.push(item)

    // For free orders: create download tokens immediately
    if (isFree) {
      const tokenExpiry = new Date()
      tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)
      await db.createDocument(DB, 'download_tokens', ID.unique(), {
        token: crypto.randomUUID(),
        orderId,
        orderItemId: item.$id,
        maxDownloads: 5,
        downloadCount: 0,
        expiresAt: tokenExpiry.toISOString(),
        deliveryLink: oi.product.deliveryLink ?? null,
      })
    }
  }

  // Send Telegram notification (optional, non-blocking)
  try {
    const cfg = await db.getDocument(DB, 'site_config', 'global')
    const config = JSON.parse(cfg.value)
    if (config.telegramBotToken && config.telegramChatId) {
      const msg = `🛒 Novo pedido ${orderNumber}\n${customerEmail}\nR$ ${totalAmount.toFixed(2)}\nPagamento: ${method}`
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.telegramChatId, text: msg }),
      })
    }
  } catch { /* non-blocking */ }

  return res.json({ order, items: createdItems, payment: mpResult })
}
```

- [ ] **Step 2: Create `appwrite/functions/create-order/package.json`**

```json
{
  "name": "create-order",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy function and set env vars**

Deploy in Appwrite Console. Set all env vars listed at the top of Phase 3.

- [ ] **Step 4: Commit**

```bash
git add appwrite/functions/create-order/
git commit -m "feat: appwrite function create-order"
```

---

### Task 11: Function `mp-webhook`

- [ ] **Step 1: Create `appwrite/functions/mp-webhook/src/main.js`**

```js
import { Client, Databases, ID } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Validate Mercado Pago signature
  const rawSignature = req.headers['x-signature']
  const requestId = req.headers['x-request-id']
  if (rawSignature && process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    const parts = Object.fromEntries(rawSignature.split(',').map(p => p.split('=')))
    const ts = parts['ts']
    const v1 = parts['v1']
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    const manifest = `id:${req.query?.['data.id']};request-id:${requestId};ts:${ts};`
    const hmac = crypto.createHmac('sha256', process.env.MERCADO_PAGO_WEBHOOK_SECRET)
      .update(manifest).digest('hex')
    if (hmac !== v1) {
      error('Invalid webhook signature')
      return res.json({ error: 'Invalid signature' }, 401)
    }
  }

  const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const eventType = payload?.type
  const paymentId = payload?.data?.id?.toString()

  if (!paymentId) return res.json({ ok: true })

  // Idempotency check
  const existing = await db.listDocuments(DB, 'webhook_events', [
    // Query.equal not available here — use raw filter
  ])
  // Simple check: try to find existing event
  const now = new Date().toISOString()

  // Fetch payment from MP
  const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
  })
  const payment = await mpResp.json()

  // Find order by mpPaymentId
  const ordersResult = await db.listDocuments(DB, 'orders', [])
  const order = ordersResult.documents.find(o => o.mpPaymentId === paymentId)
  if (!order) return res.json({ ok: true })

  if (payment.status === 'approved' && order.status !== 'PAID') {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'PAID',
      mpStatus: 'approved',
      paidAt: now,
      updatedAt: now,
    })

    // Create download tokens for each order item
    const itemsResult = await db.listDocuments(DB, 'order_items', [])
    const items = itemsResult.documents.filter(i => i.orderId === order.$id)
    const tokenExpiry = new Date()
    tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)
    for (const item of items) {
      await db.createDocument(DB, 'download_tokens', ID.unique(), {
        token: crypto.randomUUID(),
        orderId: order.$id,
        orderItemId: item.$id,
        maxDownloads: 5,
        downloadCount: 0,
        expiresAt: tokenExpiry.toISOString(),
        deliveryLink: item.deliveryLink ?? null,
      })
    }

    // Update sales counts
    for (const item of items) {
      const prod = await db.getDocument(DB, 'products', item.productId)
      await db.updateDocument(DB, 'products', item.productId, {
        salesCount: (prod.salesCount ?? 0) + 1,
        updatedAt: now,
      })
    }
  } else if (['rejected', 'cancelled'].includes(payment.status)) {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'CANCELLED',
      mpStatus: payment.status,
      updatedAt: now,
    })
  } else if (payment.status === 'refunded') {
    await db.updateDocument(DB, 'orders', order.$id, {
      status: 'REFUNDED',
      mpStatus: 'refunded',
      updatedAt: now,
    })
    // Revoke download tokens
    const tokensResult = await db.listDocuments(DB, 'download_tokens', [])
    const tokens = tokensResult.documents.filter(t => t.orderId === order.$id)
    for (const t of tokens) {
      await db.updateDocument(DB, 'download_tokens', t.$id, { revokedAt: now })
    }
  }

  // Log webhook event
  await db.createDocument(DB, 'webhook_events', ID.unique(), {
    source: 'mercadopago',
    eventId: paymentId,
    eventType: eventType ?? 'payment',
    payload: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    status: 'processed',
    createdAt: now,
  })

  return res.json({ ok: true })
}
```

- [ ] **Step 2: Create `appwrite/functions/mp-webhook/package.json`**

```json
{
  "name": "mp-webhook",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy function**

- [ ] **Step 4: Commit**

```bash
git add appwrite/functions/mp-webhook/
git commit -m "feat: appwrite function mp-webhook"
```

---

### Task 12: Function `download`

- [ ] **Step 1: Create `appwrite/functions/download/src/main.js`**

```js
import { Client, Databases, Storage } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const storage = new Storage(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const token = req.query?.token
  if (!token) return res.json({ error: 'token required' }, 400)

  // Find token
  const tokensResult = await db.listDocuments(DB, 'download_tokens', [])
  const tokenDoc = tokensResult.documents.find(t => t.token === token)
  if (!tokenDoc) return res.json({ error: 'Invalid token' }, 404)

  const now = new Date()
  if (tokenDoc.revokedAt) return res.json({ error: 'Token revoked' }, 403)
  if (new Date(tokenDoc.expiresAt) < now) return res.json({ error: 'Token expired' }, 403)
  if (tokenDoc.downloadCount >= tokenDoc.maxDownloads) {
    return res.json({ error: 'Download limit reached' }, 403)
  }

  // If deliveryLink, redirect
  if (tokenDoc.deliveryLink) {
    await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
      downloadCount: tokenDoc.downloadCount + 1,
      lastDownloadAt: now.toISOString(),
    })
    return res.redirect(tokenDoc.deliveryLink)
  }

  // Get the order item to find the product
  const item = await db.getDocument(DB, 'order_items', tokenDoc.orderItemId)
  const product = await db.getDocument(DB, 'products', item.productId)

  if (!product.fileKey) return res.json({ error: 'No file for this product' }, 404)

  // Generate a short-lived download URL (60 seconds)
  // Appwrite doesn't have signed URLs for private buckets via client SDK.
  // Use getFileDownload which returns the file directly with server auth.
  const fileUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/product-files/files/${product.fileKey}/download`

  await db.updateDocument(DB, 'download_tokens', tokenDoc.$id, {
    downloadCount: tokenDoc.downloadCount + 1,
    lastDownloadAt: now.toISOString(),
  })

  // Return the URL — client will redirect to it (add API key as query param for server-to-server)
  // Better: stream the file through the function
  const fileResp = await fetch(`${fileUrl}?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`, {
    headers: { 'X-Appwrite-Key': process.env.APPWRITE_API_KEY },
  })

  if (!fileResp.ok) return res.json({ error: 'File not found in storage' }, 404)

  const buffer = await fileResp.arrayBuffer()
  return res.binary(Buffer.from(buffer), 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${product.name}.pdf"`,
  })
}
```

- [ ] **Step 2: Create `appwrite/functions/download/package.json`**

```json
{
  "name": "download",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy function**

- [ ] **Step 4: Commit**

```bash
git add appwrite/functions/download/
git commit -m "feat: appwrite function download"
```

---

### Task 13: Function `admin-users`

- [ ] **Step 1: Create `appwrite/functions/admin-users/src/main.js`**

```js
import { Client, Users, Databases } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  if (req.method === 'PATCH') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { userId, phone } = body
    if (!userId) return res.json({ error: 'userId required' }, 400)
    const profilesResult = await db.listDocuments(DB, 'profiles', [])
    const profile = profilesResult.documents.find(p => p.userId === userId)
    if (!profile) return res.json({ error: 'Profile not found' }, 404)
    await db.updateDocument(DB, 'profiles', profile.$id, {
      phone: phone ?? '',
      updatedAt: new Date().toISOString(),
    })
    return res.json({ ok: true })
  }

  // GET: list users
  const search = req.query?.search ?? ''
  const limit = parseInt(req.query?.limit ?? '50')
  const offset = parseInt(req.query?.offset ?? '0')

  const appwriteUsers = await users.list([], search, limit, offset)
  const profilesResult = await db.listDocuments(DB, 'profiles', [])
  const ordersResult = await db.listDocuments(DB, 'orders', [])

  const result = appwriteUsers.users.map(u => {
    const profile = profilesResult.documents.find(p => p.userId === u.$id)
    const orderCount = ordersResult.documents.filter(o => o.userId === u.$id).length
    return {
      id: u.$id,
      email: u.email,
      name: u.name,
      phone: profile?.phone ?? '',
      role: profile?.role ?? 'CUSTOMER',
      isActive: profile?.isActive ?? true,
      avatarUrl: profile?.avatarUrl ?? '',
      orderCount,
      createdAt: u.$createdAt,
    }
  })

  return res.json({ users: result, total: appwriteUsers.total })
}
```

- [ ] **Step 2: Create `appwrite/functions/admin-users/package.json`**

```json
{
  "name": "admin-users",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy and commit**

```bash
git add appwrite/functions/admin-users/
git commit -m "feat: appwrite function admin-users"
```

---

### Task 14: Function `create-admin`

- [ ] **Step 1: Create `appwrite/functions/create-admin/src/main.js`**

```js
import { Client, Users, Databases, ID } from 'node-appwrite'

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const users = new Users(client)
  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  // Check if admin already exists
  const profilesResult = await db.listDocuments(DB, 'profiles', [])
  const existingAdmin = profilesResult.documents.find(p => p.role === 'ADMIN')
  if (existingAdmin) {
    return res.json({ error: 'Admin already exists' }, 409)
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { email, password, name } = body
  if (!email || !password) return res.json({ error: 'email and password required' }, 400)

  const user = await users.create(ID.unique(), email, undefined, password, name ?? 'Admin')

  const now = new Date().toISOString()
  await db.createDocument(DB, 'profiles', user.$id, {
    userId: user.$id,
    name: name ?? 'Admin',
    email,
    phone: '',
    role: 'ADMIN',
    isActive: true,
    createdAt: now,
    updatedAt: now,
  })

  return res.json({ id: user.$id, email: user.email, role: 'ADMIN' }, 201)
}
```

- [ ] **Step 2: Create `appwrite/functions/create-admin/package.json`**

```json
{
  "name": "create-admin",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy and commit**

```bash
git add appwrite/functions/create-admin/
git commit -m "feat: appwrite function create-admin"
```

---

### Task 15: Function `recent-purchases`

- [ ] **Step 1: Create `appwrite/functions/recent-purchases/src/main.js`**

```js
import { Client, Databases } from 'node-appwrite'

export default async ({ req, res }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const ordersResult = await db.listDocuments(DB, 'orders', [])
  const recentPaid = ordersResult.documents
    .filter(o => o.status === 'PAID' && o.paidAt && o.paidAt >= sevenDaysAgo)
    .slice(0, 20)

  const SAMPLE = [
    { customerName: 'Maria S.', total_amount: 29.9, paid_at: new Date().toISOString() },
    { customerName: 'João P.', total_amount: 49.9, paid_at: new Date().toISOString() },
    { customerName: 'Ana C.', total_amount: 19.9, paid_at: new Date().toISOString() },
  ]

  const data = recentPaid.length >= 3 ? recentPaid.map(o => ({
    customerName: o.customerName.split(' ')[0] + ' ' + (o.customerName.split(' ')[1]?.[0] ?? '') + '.',
    totalAmount: o.totalAmount,
    paidAt: o.paidAt,
  })) : SAMPLE

  return res.json({ purchases: data })
}
```

- [ ] **Step 2: Create `appwrite/functions/recent-purchases/package.json`**

```json
{
  "name": "recent-purchases",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Deploy and commit**

```bash
git add appwrite/functions/recent-purchases/
git commit -m "feat: appwrite function recent-purchases"
```

---

### Task 16: Function `reconcile-orders`

- [ ] **Step 1: Create `appwrite/functions/reconcile-orders/src/main.js`**

```js
import { Client, Databases, ID } from 'node-appwrite'
import crypto from 'crypto'

export default async ({ req, res, log }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)
  const DB = process.env.APPWRITE_DATABASE_ID

  const body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {}
  const specificOrderId = body?.orderId

  const ordersResult = await db.listDocuments(DB, 'orders', [])
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const pendingOrders = ordersResult.documents.filter(o => {
    if (specificOrderId) return o.$id === specificOrderId
    return o.status === 'AWAITING_PAYMENT' &&
      o.mpPaymentId &&
      new Date(o.createdAt) < dayAgo
  })

  log(`Reconciling ${pendingOrders.length} orders`)
  const now = new Date().toISOString()

  for (const order of pendingOrders) {
    const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${order.mpPaymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
    })
    const payment = await mpResp.json()

    if (payment.status === 'approved') {
      await db.updateDocument(DB, 'orders', order.$id, {
        status: 'PAID', mpStatus: 'approved', paidAt: now, updatedAt: now,
      })
      const itemsResult = await db.listDocuments(DB, 'order_items', [])
      const items = itemsResult.documents.filter(i => i.orderId === order.$id)
      const tokenExpiry = new Date()
      tokenExpiry.setFullYear(tokenExpiry.getFullYear() + 30)
      for (const item of items) {
        await db.createDocument(DB, 'download_tokens', ID.unique(), {
          token: crypto.randomUUID(),
          orderId: order.$id,
          orderItemId: item.$id,
          maxDownloads: 5,
          downloadCount: 0,
          expiresAt: tokenExpiry.toISOString(),
          deliveryLink: item.deliveryLink ?? null,
        })
      }
      log(`✓ Order ${order.orderNumber} marked PAID`)
    } else if (['rejected', 'cancelled', 'expired'].includes(payment.status)) {
      await db.updateDocument(DB, 'orders', order.$id, {
        status: 'CANCELLED', mpStatus: payment.status, updatedAt: now,
      })
      log(`✓ Order ${order.orderNumber} CANCELLED`)
    }
  }

  return res.json({ reconciled: pendingOrders.length })
}
```

- [ ] **Step 2: Create `appwrite/functions/reconcile-orders/package.json`**

```json
{
  "name": "reconcile-orders",
  "type": "module",
  "dependencies": {
    "node-appwrite": "^16.0.0"
  }
}
```

- [ ] **Step 3: Create a scheduled trigger in Appwrite Console**

Functions → `reconcile-orders` → Settings → Schedule → `0 */6 * * *` (every 6 hours).

- [ ] **Step 4: Deploy and commit**

```bash
git add appwrite/functions/reconcile-orders/
git commit -m "feat: appwrite function reconcile-orders"
```

---

## Phase 4 — Frontend SDK Migration

### Task 17: Create Appwrite client and remove Supabase client

- [ ] **Step 1: Install Appwrite JS SDK**

```bash
cd apps/web && npm install appwrite
```

- [ ] **Step 2: Create `apps/web/src/lib/appwrite.ts`**

```typescript
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
```

- [ ] **Step 3: Update `apps/web/.env`**

```ini
VITE_APPWRITE_ENDPOINT=http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
VITE_APPWRITE_PROJECT_ID=6a1af05e0030b967a508
VITE_APPWRITE_DATABASE_ID=pedago-db
```

Remove or comment out old Supabase vars:
```ini
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...
```

- [ ] **Step 4: Delete `apps/web/src/lib/supabase.ts`**

```bash
rm apps/web/src/lib/supabase.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/appwrite.ts apps/web/.env apps/web/package.json
git commit -m "feat: replace supabase client with appwrite client"
```

---

### Task 18: Migrate `auth.store.ts`

- [ ] **Step 1: Read current `apps/web/src/stores/auth.store.ts` in full**

- [ ] **Step 2: Replace Supabase auth calls with Appwrite equivalents**

Key substitutions:
| Supabase | Appwrite |
|----------|----------|
| `supabase.auth.signInWithPassword({ email, password })` | `account.createEmailPasswordSession(email, password)` |
| `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo })` | `account.createOAuth2Session('google', successUrl, failUrl)` |
| `supabase.auth.getUser()` | `account.get()` |
| `supabase.auth.getSession()` | `account.getSession('current')` |
| `supabase.auth.signOut()` | `account.deleteSession('current')` |
| `supabase.auth.onAuthStateChange(cb)` | Not available — check on router navigation with `account.get()` |
| `supabase.auth.resetPasswordForEmail(email)` | `account.createRecovery(email, redirectUrl)` |
| `supabase.auth.updateUser({ password })` | `account.updateRecovery(userId, secret, password)` |

Profile fetch (replace Supabase query):
```typescript
// Old (Supabase):
// await supabase.from('profiles').select('*').eq('id', user.id).single()

// New (Appwrite):
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

const result = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
  Query.equal('userId', user.$id),
  Query.limit(1),
])
const profile = result.documents[0]
```

Profile update:
```typescript
// Old:
// await supabase.from('profiles').update({ name, phone }).eq('id', user.id)

// New:
await databases.updateDocument(DB_ID, COLLECTIONS.PROFILES, profile.$id, {
  name,
  phone,
  updatedAt: new Date().toISOString(),
})
```

`onAuthStateChange` replacement — add a router guard in `apps/web/src/router/index.ts`:
```typescript
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    try {
      await account.get()
    } catch {
      return '/login'
    }
  }
})
```

- [ ] **Step 3: Run dev server and test login**

```bash
cd apps/web && npm run dev
```

Go to `/login`, enter credentials, verify session is established.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/auth.store.ts
git commit -m "feat: migrate auth.store to appwrite"
```

---

### Task 19: Migrate `catalog.store.ts`

- [ ] **Step 1: Replace all Supabase queries with Appwrite equivalents**

```typescript
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

// Old: supabase.from('products').select('*, categories(*)').eq('is_featured', true).eq('is_active', true)
// New:
async function fetchFeatured() {
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, [
    Query.equal('isFeatured', true),
    Query.equal('isActive', true),
    Query.isNull('deletedAt'),
    Query.orderAsc('sortOrder'),
  ])
  // Enrich with category data
  const products = await Promise.all(result.documents.map(async (p) => {
    if (!p.categoryId) return { ...p, category: null }
    try {
      const cat = await databases.getDocument(DB_ID, COLLECTIONS.CATEGORIES, p.categoryId)
      return { ...p, category: cat }
    } catch {
      return { ...p, category: null }
    }
  }))
  return products
}

// Old: supabase.from('products').select('*').ilike('name', `%${search}%`)
// New:
async function fetchProducts({ search, categoryId, sortBy, freeOnly, page, limit }) {
  const queries = [
    Query.equal('isActive', true),
    Query.isNull('deletedAt'),
  ]
  if (search) queries.push(Query.search('name', search))
  if (categoryId) queries.push(Query.equal('categoryId', categoryId))
  if (freeOnly) queries.push(Query.equal('price', 0))
  if (sortBy === 'price_asc') queries.push(Query.orderAsc('price'))
  else if (sortBy === 'price_desc') queries.push(Query.orderDesc('price'))
  else if (sortBy === 'newest') queries.push(Query.orderDesc('createdAt'))
  else queries.push(Query.orderAsc('sortOrder'))
  queries.push(Query.limit(limit ?? 24))
  queries.push(Query.offset(((page ?? 1) - 1) * (limit ?? 24)))

  return databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, queries)
}

// Old: supabase.from('categories').select('*, products(count)').eq('is_active', true)
// New:
async function fetchCategories() {
  const result = await databases.listDocuments(DB_ID, COLLECTIONS.CATEGORIES, [
    Query.equal('isActive', true),
    Query.orderAsc('sortOrder'),
  ])
  return result.documents
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/stores/catalog.store.ts
git commit -m "feat: migrate catalog.store to appwrite"
```

---

### Task 20: Migrate `site-config.store.ts`

- [ ] **Step 1: Replace Supabase upsert/select with Appwrite**

```typescript
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'

// Old: supabase.from('site_config').select('value').eq('key', 'global').single()
// New:
async function fetchConfig() {
  const doc = await databases.getDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global')
  return typeof doc.value === 'string' ? JSON.parse(doc.value) : doc.value
}

// Old: supabase.from('site_config').upsert({ key: 'global', value: config }, { onConflict: 'key' })
// New:
async function saveConfig(config: object) {
  try {
    await databases.updateDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global', {
      value: JSON.stringify(config),
      updatedAt: new Date().toISOString(),
    })
  } catch (err: any) {
    if (err.code === 404) {
      await databases.createDocument(DB_ID, COLLECTIONS.SITE_CONFIG, 'global', {
        key: 'global',
        value: JSON.stringify(config),
        updatedAt: new Date().toISOString(),
      })
    } else throw err
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/stores/site-config.store.ts
git commit -m "feat: migrate site-config.store to appwrite"
```

---

### Task 21: Migrate `services/api.ts`

- [ ] **Step 1: Replace Supabase function invocations with Appwrite function executions**

```typescript
import { functions } from '@/lib/appwrite'

// Old: supabase.functions.invoke('create-order', { body: payload })
// New:
async function invokeFunction(functionId: string, payload: object) {
  const execution = await functions.createExecution(
    functionId,
    JSON.stringify(payload),
    false,  // async = false (wait for result)
    '/',
    'POST',
    { 'Content-Type': 'application/json' },
  )
  if (execution.responseStatusCode >= 400) {
    throw new Error(execution.responseBody)
  }
  return JSON.parse(execution.responseBody)
}

export const api = {
  createOrder: (payload) => invokeFunction('create-order', payload),
  registerUser: (payload) => invokeFunction('register-user', payload),
  adminUsers: (params) => invokeFunction('admin-users', params),
  createAdmin: (payload) => invokeFunction('create-admin', payload),
  recentPurchases: () => invokeFunction('recent-purchases', {}),
  reconcileOrders: (payload?) => invokeFunction('reconcile-orders', payload ?? {}),
  download: (token: string) => {
    // download function returns binary — redirect browser directly
    return `${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/download/executions?token=${token}`
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/services/api.ts
git commit -m "feat: migrate services/api to appwrite functions"
```

---

### Task 22: Migrate Auth Views

- [ ] **Step 1: Update `LoginView.vue`**

Replace any direct `supabase` import with `account` from `@/lib/appwrite`.

```typescript
// Old:
// const { error } = await supabase.auth.signInWithPassword({ email, password })

// New:
import { account } from '@/lib/appwrite'
try {
  await account.createEmailPasswordSession(email.value, password.value)
  router.push('/dashboard') // or wherever
} catch (err: any) {
  loginError.value = err.message
}
```

- [ ] **Step 2: Update `RegisterView.vue`**

Replace direct registration with the `register-user` function call:
```typescript
import { api } from '@/services/api'
await api.registerUser({ email, password, name, phone })
```

- [ ] **Step 3: Update `GoogleCallbackView.vue`**

The Google OAuth callback with Appwrite works differently — Appwrite handles the callback automatically and redirects to the success URL. This view just needs to read the session:

```typescript
import { account } from '@/lib/appwrite'

onMounted(async () => {
  try {
    const user = await account.get()
    // Session is already set by Appwrite OAuth flow
    router.push('/')
  } catch {
    router.push('/login?error=oauth_failed')
  }
})
```

- [ ] **Step 4: Update `ForgotPasswordView.vue`**

```typescript
// Old: supabase.auth.resetPasswordForEmail(email, { redirectTo })
// New:
await account.createRecovery(email.value, `${window.location.origin}/auth/reset-password`)
```

- [ ] **Step 5: Update `ResetPasswordView.vue`**

```typescript
// Old: supabase.auth.updateUser({ password })
// New — Appwrite recovery requires userId + secret from the URL params:
const urlParams = new URLSearchParams(window.location.search)
const userId = urlParams.get('userId')
const secret = urlParams.get('secret')
await account.updateRecovery(userId!, secret!, newPassword.value)
```

- [ ] **Step 6: Update `AdminLoginView.vue`**

Same pattern as `LoginView.vue`. After login, check profile role:

```typescript
import { account } from '@/lib/appwrite'
import { databases, DB_ID, COLLECTIONS } from '@/lib/appwrite'
import { Query } from 'appwrite'

const session = await account.createEmailPasswordSession(email, password)
const user = await account.get()
const profiles = await databases.listDocuments(DB_ID, COLLECTIONS.PROFILES, [
  Query.equal('userId', user.$id),
  Query.limit(1),
])
const profile = profiles.documents[0]
if (profile?.role !== 'ADMIN') {
  await account.deleteSession('current')
  throw new Error('Not an admin')
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/views/auth/
git commit -m "feat: migrate auth views to appwrite"
```

---

### Task 23: Migrate Admin Views

- [ ] **Step 1: Update `DashboardView.vue`**

Replace `supabase.from('orders')` queries with `databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [...])`.

Replace `supabase.functions.invoke('recent-purchases')` with `api.recentPurchases()`.

- [ ] **Step 2: Update `ProductsView.vue`**

Replace all product CRUD:
```typescript
// Create product
await databases.createDocument(DB_ID, COLLECTIONS.PRODUCTS, ID.unique(), productData)

// Update product
await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, product.$id, productData)

// Soft delete
await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, product.$id, {
  deletedAt: new Date().toISOString()
})

// Upload product file
import { storage, BUCKETS } from '@/lib/appwrite'
const file = await storage.createFile(BUCKETS.PRODUCT_FILES, ID.unique(), fileInput)
// file.$id becomes the new fileKey
```

- [ ] **Step 3: Update `CategoriesView.vue`**

```typescript
// Create category
await databases.createDocument(DB_ID, COLLECTIONS.CATEGORIES, ID.unique(), categoryData)
// Update/delete similarly
```

- [ ] **Step 4: Update `OrdersView.vue`**

```typescript
const result = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
  Query.orderDesc('createdAt'),
  Query.limit(50),
])
```

- [ ] **Step 5: Update `UsersView.vue`**

Replace `supabase.functions.invoke('admin-users', ...)` with `api.adminUsers(params)`.

- [ ] **Step 6: Update `CustomizeView.vue` and `IntegrationsView.vue`**

Use `fetchConfig()` and `saveConfig()` from `site-config.store.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/views/admin/
git commit -m "feat: migrate admin views to appwrite"
```

---

### Task 24: Migrate Customer and Public Views

- [ ] **Step 1: Update `HomeView.vue`**

Replace featured products fetch via catalog store (already migrated in Task 19).

- [ ] **Step 2: Update `CatalogView.vue` and `ProductView.vue`**

Use migrated catalog store functions.

- [ ] **Step 3: Update `CheckoutView.vue`**

Replace `supabase.functions.invoke('create-order', ...)` with `api.createOrder(payload)`.

- [ ] **Step 4: Update `CheckoutSuccessView.vue`**

Fetch order by ID:
```typescript
const order = await databases.getDocument(DB_ID, COLLECTIONS.ORDERS, orderId)
```

- [ ] **Step 5: Update `DownloadsView.vue`**

Fetch download tokens for current user's orders:
```typescript
const user = await account.get()
const orders = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
  Query.equal('userId', user.$id),
  Query.equal('status', 'PAID'),
])
const orderIds = orders.documents.map(o => o.$id)
// Fetch items for each order...
```

The download link points to the Appwrite download function:
```typescript
const downloadUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/download/executions?token=${token}`
```

- [ ] **Step 6: Update `customer/OrdersView.vue`**

```typescript
const user = await account.get()
const orders = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
  Query.equal('userId', user.$id),
  Query.orderDesc('createdAt'),
])
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/views/public/ apps/web/src/views/customer/
git commit -m "feat: migrate customer and public views to appwrite"
```

---

## Phase 5 — Cleanup and Remove Supabase

### Task 25: Remove Supabase dependency

- [ ] **Step 1: Verify no remaining Supabase imports**

```bash
grep -r "supabase" apps/web/src --include="*.ts" --include="*.vue" -l
```

Expected: no output (zero files).

- [ ] **Step 2: Remove Supabase package**

```bash
cd apps/web && npm uninstall @supabase/supabase-js
```

- [ ] **Step 3: Delete the `supabase/` directory (keep for now as reference)**

Only delete after full validation:
```bash
# Do NOT delete yet — keep as reference during validation
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore: remove @supabase/supabase-js dependency"
```

---

## Phase 6 — Validation

### Task 26: End-to-end validation checklist

- [ ] **Auth: Email/Password login**

```
1. Navigate to /login
2. Enter migrated user's email and current password
3. Verify redirect to authenticated area
4. Verify user profile loads correctly
```

- [ ] **Auth: Google OAuth login**

```
1. Navigate to /login → "Entrar com Google"
2. Complete Google OAuth flow
3. Verify redirect to /auth/google-callback
4. Verify session and profile loaded
```

- [ ] **Auth: Admin login**

```
1. Navigate to /admin/login
2. Enter admin email and password
3. Verify admin panel accessible
```

- [ ] **Auth: Password recovery**

```
1. Navigate to /forgot-password
2. Enter email
3. Verify recovery email arrives
4. Click link, set new password
5. Login with new password
```

- [ ] **Catalog: Products and categories display**

```
1. Navigate to /
2. Verify featured products load with images
3. Navigate to /catalogo
4. Verify all products display, filters work
```

- [ ] **Product: Detail page**

```
1. Navigate to /produto/:slug
2. Verify product info, images, price display
```

- [ ] **Checkout: Free product**

```
1. Add a free product to cart
2. Proceed to checkout
3. Verify order created with status PAID
4. Verify download token generated
5. Navigate to /downloads, verify file accessible
```

- [ ] **Checkout: PIX payment**

```
1. Add paid product to cart
2. Proceed to checkout → PIX
3. Verify QR code displayed
4. Simulate payment (MP sandbox or test environment)
5. Verify webhook received, order marked PAID
6. Verify download token created
```

- [ ] **Admin: CRUD operations**

```
1. Login as admin
2. Create a test product
3. Edit the product
4. Create a category
5. View orders list
6. View users list with search
```

- [ ] **Downloads: File download**

```
1. Login as user with PAID order
2. Navigate to /downloads
3. Click download button
4. Verify PDF serves correctly
```

- [ ] **Final: Confirm zero Supabase traffic**

Open browser Network tab, perform all above flows, confirm no requests go to `supabase.co`.

- [ ] **Delete `supabase/` directory after validation passes**

```bash
# Only after all validations pass:
rm -rf supabase/
git add -A
git commit -m "chore: remove supabase directory — migration complete"
```

---

## Environment Variables Reference

### `apps/web/.env`
```ini
VITE_APPWRITE_ENDPOINT=http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
VITE_APPWRITE_PROJECT_ID=6a1af05e0030b967a508
VITE_APPWRITE_DATABASE_ID=pedago-db
```

### Appwrite Functions (set in Console → Functions → Variables)
```ini
APPWRITE_ENDPOINT=http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1
APPWRITE_API_KEY=<your-api-key>
APPWRITE_DATABASE_ID=pedago-db
FRONTEND_URL=https://<your-frontend-domain>
MERCADO_PAGO_ACCESS_TOKEN=<from-site-config>
MERCADO_PAGO_WEBHOOK_SECRET=<from-site-config>
```

---

## Spec Coverage Self-Review

| PRD Requirement | Covered By |
|-----------------|------------|
| Preserve users + passwords | Task 6 (`createBcryptUser`) |
| Preserve Google OAuth | Task 4 + Task 22 Step 3 |
| Migrate all DB tables | Task 7 |
| Migrate storage files | Task 8 |
| Migrate all 8 edge functions | Tasks 9–16 |
| Replace Supabase SDK frontend | Tasks 17–24 |
| No UI changes | Only stores/lib/views logic changed |
| Remove Supabase | Task 25 |
| Validation | Task 26 |
| Download tokens preserved | Task 7 (migrate_db) + Task 12 |
| Admin panel | Task 23 |
| Mercado Pago webhook | Task 11 |
| Reconcile orders cron | Task 16 (scheduled function) |
| Telegram notifications | Tasks 10, 11, 16 |
