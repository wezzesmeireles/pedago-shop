/**
 * provision-appwrite.mjs
 *
 * Idempotent script that creates the entire Appwrite project structure:
 *   - Database: pedago-db
 *   - 8 collections with attributes and indexes
 *   - Storage bucket: product-files
 *
 * Usage:
 *   cp .env.migration.example .env.migration
 *   # fill in .env.migration
 *   node provision-appwrite.mjs
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Load .env.migration ──────────────────────────────────────────────────────
const envPath = path.join(__dirname, '.env.migration');
if (fs.existsSync(envPath)) {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: envPath });
} else {
  console.warn('⚠  .env.migration not found — relying on process.env');
}

// ── Appwrite SDK ─────────────────────────────────────────────────────────────
import {
  Client,
  Databases,
  Storage,
  ID,
  Permission,
  Role,
  IndexType,
} from 'node-appwrite';

// ── Config ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.APPWRITE_ENDPOINT   ?? 'http://appwrite-q2wgfrs7htkwuue2632gat0k.wsgestao.digital/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID ?? '6a1af05e0030b967a508';
const API_KEY    = process.env.APPWRITE_API_KEY;
const DB_ID      = 'pedago-db';

if (!API_KEY) {
  console.error('✗  APPWRITE_API_KEY is required. Set it in scripts/.env.migration');
  process.exit(1);
}

// ── Client ───────────────────────────────────────────────────────────────────
const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db      = new Databases(client);
const storage = new Storage(client);

// ── Helpers ──────────────────────────────────────────────────────────────────

function ok(msg)  { console.log(`  ✓ ${msg}`); }
function skip(msg){ console.log(`  ~ ${msg} (already exists)`); }
function err(msg) { console.error(`  ✗ ${msg}`); }

/** Run fn, swallow 409 Conflict as "already exists". Re-throws everything else. */
async function idempotent(label, fn) {
  try {
    const result = await fn();
    ok(label);
    return result;
  } catch (e) {
    if (e?.code === 409) {
      skip(label);
      return null;
    }
    err(`${label} — ${e?.message ?? e}`);
    throw e;
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForAttributes(db, dbId, collectionId, expectedCount, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const attrs = await db.listAttributes(dbId, collectionId)
    const ready = attrs.attributes.filter(a => a.status === 'available').length
    if (ready >= expectedCount) return
    await new Promise(r => setTimeout(r, 1000))
  }
  console.warn(`  ⚠ Timed out waiting for attributes on ${collectionId} — proceeding anyway`)
}

// ── Database ─────────────────────────────────────────────────────────────────

async function ensureDatabase() {
  console.log('\n📦 Database');
  await idempotent(`database "${DB_ID}"`, () =>
    db.create(DB_ID, 'Pedago Shop')
  );
}

// ── Generic attribute helpers ─────────────────────────────────────────────────

async function addString(col, key, size, required = false, defaultVal = null, array = false) {
  await idempotent(`  attr ${col}.${key} String(${size})`, () =>
    db.createStringAttribute(DB_ID, col, key, size, required, defaultVal ?? undefined, array)
  );
}

async function addInteger(col, key, required = false, min = null, max = null, defaultVal = null, array = false) {
  await idempotent(`  attr ${col}.${key} Integer`, () =>
    db.createIntegerAttribute(DB_ID, col, key, required, min ?? undefined, max ?? undefined, defaultVal ?? undefined, array)
  );
}

async function addFloat(col, key, required = false, min = null, max = null, defaultVal = null) {
  await idempotent(`  attr ${col}.${key} Float`, () =>
    db.createFloatAttribute(DB_ID, col, key, required, min ?? undefined, max ?? undefined, defaultVal ?? undefined)
  );
}

async function addBoolean(col, key, required = false, defaultVal = null, array = false) {
  await idempotent(`  attr ${col}.${key} Boolean`, () =>
    db.createBooleanAttribute(DB_ID, col, key, required, defaultVal ?? undefined, array)
  );
}

async function addDatetime(col, key, required = false, defaultVal = null) {
  await idempotent(`  attr ${col}.${key} Datetime`, () =>
    db.createDatetimeAttribute(DB_ID, col, key, required, defaultVal ?? undefined)
  );
}

async function addEnum(col, key, elements, required = false, defaultVal = null, array = false) {
  await idempotent(`  attr ${col}.${key} Enum`, () =>
    db.createEnumAttribute(DB_ID, col, key, elements, required, defaultVal ?? undefined, array)
  );
}

async function addIndex(col, indexId, type, attrs, orders = []) {
  await idempotent(`  index ${col}.${indexId}`, () =>
    db.createIndex(DB_ID, col, indexId, type, attrs, orders)
  );
}

// ── Collections ───────────────────────────────────────────────────────────────

async function createProfiles() {
  const COL = 'profiles';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Profiles', [
      Permission.read(Role.any()),
      Permission.create(Role.users()),
    ])
  );

  await addString(COL,  'userId',    36,  true);
  await addString(COL,  'name',      255, false);
  await addString(COL,  'email',     255, false);
  await addString(COL,  'phone',     50,  false);
  await addEnum(COL,    'role',      ['CUSTOMER', 'ADMIN'], true);
  await addString(COL,  'avatarUrl', 512, false);
  await addBoolean(COL, 'isActive',  false);
  await addDatetime(COL,'createdAt', false);
  await addDatetime(COL,'updatedAt', false);

  await waitForAttributes(db, DB_ID, COL, 9);
  // No custom indexes beyond the default $id
}

async function createCategories() {
  const COL = 'categories';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Categories', [
      Permission.read(Role.any()),
    ])
  );

  await addString(COL,  'name',        255,  true);
  await addString(COL,  'slug',        255,  true);
  await addString(COL,  'description', 1000, false);
  await addBoolean(COL, 'isActive',    false);
  await addInteger(COL, 'sortOrder',   false);
  await addDatetime(COL,'createdAt',   false);
  await addDatetime(COL,'updatedAt',   false);

  await waitForAttributes(db, DB_ID, COL, 7);
  await addIndex(COL, 'slug_unique', IndexType.Unique, ['slug']);
}

async function createProducts() {
  const COL = 'products';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Products', [
      Permission.read(Role.any()),
    ])
  );

  await addString(COL,  'name',           255,   true);
  await addString(COL,  'slug',           255,   true);
  await addFloat(COL,   'price',          false);
  await addFloat(COL,   'comparePrice',   false);
  await addString(COL,  'description',    65535, false);
  await addString(COL,  'coverImageUrl',  512,   false);
  // array attribute for previewImages
  await idempotent(`  attr ${COL}.previewImages String[](512)`, () =>
    db.createStringAttribute(DB_ID, COL, 'previewImages', 512, false, undefined, true)
  );
  await addBoolean(COL, 'isActive',       false);
  await addBoolean(COL, 'isFeatured',     false);
  await addDatetime(COL,'deletedAt',      false);
  await addString(COL,  'categoryId',     36,    false);
  await addInteger(COL, 'salesCount',     false);
  await addInteger(COL, 'pageCount',      false);
  await addString(COL,  'fileKey',        512,   false);
  await addEnum(COL,    'deliveryType',   ['LINK', 'FILE'], false);
  await addString(COL,  'deliveryLink',   1024,  false);
  // array attribute for tags
  await idempotent(`  attr ${COL}.tags String[](100)`, () =>
    db.createStringAttribute(DB_ID, COL, 'tags', 100, false, undefined, true)
  );
  await addInteger(COL, 'sortOrder',      false);
  await addDatetime(COL,'createdAt',      false);
  await addDatetime(COL,'updatedAt',      false);

  await waitForAttributes(db, DB_ID, COL, 19);
  await addIndex(COL, 'slug_unique',    IndexType.Unique, ['slug']);
  await addIndex(COL, 'isActive_key',   IndexType.Key,    ['isActive']);
  await addIndex(COL, 'isFeatured_key', IndexType.Key,    ['isFeatured']);
  await addIndex(COL, 'categoryId_key', IndexType.Key,    ['categoryId']);
}

async function createOrders() {
  const COL = 'orders';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Orders', [])
  );

  await addString(COL,  'orderNumber',     30,    true);
  await addString(COL,  'userId',          36,    true);
  await addString(COL,  'customerName',    255,   false);
  await addString(COL,  'customerEmail',   255,   false);
  await addEnum(COL,    'status',          ['AWAITING_PAYMENT', 'PAID', 'CANCELLED', 'REFUNDED'], true);
  await addFloat(COL,   'totalAmount',     false);
  await addEnum(COL,    'paymentMethod',   ['PIX', 'CREDIT_CARD', 'FREE'], false);
  await addString(COL,  'mpPaymentId',     100,   false);
  await addString(COL,  'mpPreferenceId',  100,   false);
  await addString(COL,  'mpStatus',        50,    false);
  await addDatetime(COL,'paidAt',          false);
  await addDatetime(COL,'expiresAt',       false);
  await addString(COL,  'metadata',        65535, false);
  await addDatetime(COL,'createdAt',       false);
  await addDatetime(COL,'updatedAt',       false);

  await waitForAttributes(db, DB_ID, COL, 15);
  await addIndex(COL, 'userId_key',         IndexType.Key,    ['userId']);
  await addIndex(COL, 'status_key',         IndexType.Key,    ['status']);
  await addIndex(COL, 'orderNumber_unique', IndexType.Unique, ['orderNumber']);
  await addIndex(COL, 'mpPaymentId_key',    IndexType.Key,    ['mpPaymentId']);
}

async function createOrderItems() {
  const COL = 'order_items';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Order Items', [])
  );

  await addString(COL,  'orderId',      36,   true);
  await addString(COL,  'productId',    36,   true);
  await addString(COL,  'productName',  255,  false);
  await addFloat(COL,   'unitPrice',    false);
  await addInteger(COL, 'quantity',     false);
  await addEnum(COL,    'deliveryType', ['LINK', 'FILE'], false);
  await addString(COL,  'deliveryLink', 1024, false);

  await waitForAttributes(db, DB_ID, COL, 7);
  await addIndex(COL, 'orderId_key',   IndexType.Key, ['orderId']);
  await addIndex(COL, 'productId_key', IndexType.Key, ['productId']);
}

async function createDownloadTokens() {
  const COL = 'download_tokens';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Download Tokens', [])
  );

  await addString(COL,  'token',          100,  true);
  await addString(COL,  'orderId',        36,   true);
  await addString(COL,  'orderItemId',    36,   true);
  await addInteger(COL, 'maxDownloads',   false);
  await addInteger(COL, 'downloadCount',  false);
  await addDatetime(COL,'lastDownloadAt', false);
  await addDatetime(COL,'expiresAt',      false);
  await addDatetime(COL,'revokedAt',      false);
  await addString(COL,  'deliveryLink',   1024, false);

  await waitForAttributes(db, DB_ID, COL, 9);
  await addIndex(COL, 'token_unique',      IndexType.Unique, ['token']);
  await addIndex(COL, 'orderId_key',       IndexType.Key,    ['orderId']);
  await addIndex(COL, 'orderItemId_key',   IndexType.Key,    ['orderItemId']);
}

async function createSiteConfig() {
  const COL = 'site_config';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Site Config', [
      Permission.read(Role.any()),
    ])
  );

  await addString(COL,  'key',       50,    true);
  await addString(COL,  'value',     65535, true);
  await addDatetime(COL,'updatedAt', false);

  await waitForAttributes(db, DB_ID, COL, 3);
  await addIndex(COL, 'key_unique', IndexType.Unique, ['key']);
}

async function createWebhookEvents() {
  const COL = 'webhook_events';
  console.log(`\n🗂  Collection: ${COL}`);

  await idempotent(`collection "${COL}"`, () =>
    db.createCollection(DB_ID, COL, 'Webhook Events')
  );

  await addString(COL,  'source',       50,    false);
  await addString(COL,  'eventId',      100,   false);
  await addString(COL,  'eventType',    100,   false);
  await addString(COL,  'payload',      65535, false);
  await addString(COL,  'status',       20,    false);
  await addString(COL,  'errorMessage', 1000,  false);
  await addDatetime(COL,'createdAt',    false);

  await waitForAttributes(db, DB_ID, COL, 7);
  await addIndex(COL, 'eventId_key', IndexType.Key, ['eventId']);
}

// ── Storage ───────────────────────────────────────────────────────────────────

async function createStorageBucket() {
  console.log('\n🪣  Storage bucket');
  await idempotent('bucket "product-files" (private)', () =>
    storage.createBucket(
      'product-files',
      'product-files',
      [], // no public permissions — private bucket
      false, // fileSecurity
      true,  // enabled
    )
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Appwrite Provisioning — Pedago Shop');
  console.log(`  Endpoint  : ${ENDPOINT}`);
  console.log(`  Project   : ${PROJECT_ID}`);
  console.log(`  Database  : ${DB_ID}`);
  console.log('═══════════════════════════════════════════════════════');

  await ensureDatabase();

  await createProfiles();
  await createCategories();
  await createProducts();
  await createOrders();
  await createOrderItems();
  await createDownloadTokens();
  await createSiteConfig();
  await createWebhookEvents();

  await createStorageBucket();

  console.log('\n✅  Provisioning complete.\n');
}

main().catch((e) => {
  console.error('\n❌  Fatal error:', e?.message ?? e);
  process.exit(1);
});
