/**
 * Migration script: Supabase → self-hosted PostgreSQL
 *
 * Usage:
 *   export SUPABASE_URL=https://xxx.supabase.co
 *   export SUPABASE_SERVICE_KEY=<service_role_key>
 *   export NEW_DATABASE_URL=postgresql://pedago:pedago_dev@localhost:5432/pedago
 *   pnpm tsx scripts/migrate-from-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const DATABASE_URL = process.env.NEW_DATABASE_URL!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !DATABASE_URL) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, NEW_DATABASE_URL');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });

async function paginate<T>(
  table: string,
  select: string,
  batchSize = 1000,
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(select)
      .range(from, from + batchSize - 1);
    if (error) throw new Error(`Error fetching ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as T[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function migrateCategories() {
  console.log('→ Migrating categories...');
  const rows = await paginate<any>('categories', '*');
  for (const row of rows) {
    const data = {
      name: row.name,
      slug: row.slug,
      description: row.description ?? null,
      imageUrl: row.image_url ?? null,
      isActive: row.is_active ?? true,
      sortOrder: row.sort_order ?? 0,
      updatedAt: new Date(row.updated_at ?? row.created_at),
    };
    await prisma.category.upsert({
      where: { id: row.id },
      update: data,
      create: { id: row.id, createdAt: new Date(row.created_at), ...data },
    });
  }
  console.log(`  ✓ ${rows.length} categories`);
}

async function migrateProducts() {
  console.log('→ Migrating products...');
  const rows = await paginate<any>('products', '*');
  for (const row of rows) {
    const data = {
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      richContent: row.rich_content ?? null,
      price: row.price,
      comparePrice: row.compare_price ?? row.compare_at_price ?? null,
      coverImageUrl: row.cover_image_url ?? row.cover_url ?? '',
      previewImages: Array.isArray(row.preview_images)
        ? row.preview_images
        : row.preview_url
          ? [row.preview_url]
          : [],
      fileKey: row.file_key ?? '',
      fileSize: row.file_size ?? 0,
      pageCount: row.page_count ?? null,
      categoryId: row.category_id ?? null,
      deliveryType: row.delivery_type ?? 'pdf',
      deliveryLink: row.delivery_link ?? null,
      youtubeUrl: row.youtube_url ?? null,
      instagramUrl: row.instagram_url ?? null,
      tags: Array.isArray(row.tags) ? row.tags : [],
      isActive: row.is_active ?? true,
      isFeatured: row.is_featured ?? false,
      sortOrder: row.sort_order ?? 0,
      salesCount: row.sales_count ?? 0,
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
      updatedAt: new Date(row.updated_at ?? row.created_at),
    };
    await prisma.product.upsert({
      where: { id: row.id },
      update: data,
      create: { id: row.id, createdAt: new Date(row.created_at), ...data },
    });
  }
  console.log(`  ✓ ${rows.length} products`);
}

async function migrateUsers() {
  console.log('→ Migrating users...');

  // Fetch profiles (role, phone, avatar) from public schema
  const profiles = await paginate<any>('profiles', '*');
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  // Attempt to get Google identities via direct table query (requires service role)
  let identities: any[] | null = null;
  try {
    const result = await supabase
      .from('identities')
      .select('user_id, provider, provider_id')
      .eq('provider', 'google');
    identities = result.data;
  } catch {
    identities = null;
  }

  const googleMap = new Map<string, string>();
  if (Array.isArray(identities)) {
    for (const id of identities) {
      googleMap.set(id.user_id, id.provider_id);
    }
  }

  let page = 1;
  let total = 0;
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Error fetching users: ${error.message}`);
    if (!users || users.length === 0) break;

    for (const u of users) {
      const profile = profileMap.get(u.id);
      // Also check provider from user's identities list (returned in auth.admin.listUsers)
      const googleId = googleMap.get(u.id)
        ?? u.identities?.find((i: any) => i.provider === 'google')?.id
        ?? null;

      const rawRole = profile?.role ?? u.user_metadata?.role ?? '';
      const role = rawRole === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';

      const userData = {
        email: u.email!,
        name: profile?.full_name ?? u.user_metadata?.full_name ?? u.email!.split('@')[0],
        passwordHash: u.encrypted_password && u.encrypted_password !== ''
          ? u.encrypted_password
          : null,
        googleId,
        phone: profile?.phone ?? null,
        avatarUrl: profile?.avatar_url ?? u.user_metadata?.avatar_url ?? null,
        role,
        updatedAt: new Date(u.updated_at ?? u.created_at),
      };
      await prisma.user.upsert({
        where: { id: u.id },
        update: userData,
        create: { id: u.id, createdAt: new Date(u.created_at), ...userData },
      });
      total++;
    }

    if (users.length < 1000) break;
    page++;
  }
  console.log(`  ✓ ${total} users`);
}

async function migrateOrders() {
  console.log('→ Migrating orders...');

  const orders = await paginate<any>('orders', '*');
  for (const row of orders) {
    const orderData = {
      orderNumber: row.order_number,
      userId: row.user_id,
      status: row.status,
      totalAmount: row.total_amount,
      paymentMethod: row.payment_method ?? null,
      mpPaymentId: row.mp_payment_id ?? null,
      mpPreferenceId: row.mp_preference_id ?? null,
      mpStatus: row.mp_status ?? null,
      metadata: row.metadata ?? {},
      customerEmail: row.customer_email ?? '',
      customerName: row.customer_name ?? '',
      paidAt: row.paid_at ? new Date(row.paid_at) : null,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      updatedAt: new Date(row.updated_at ?? row.created_at),
    };
    await prisma.order.upsert({
      where: { id: row.id },
      update: orderData,
      create: { id: row.id, createdAt: new Date(row.created_at), ...orderData },
    });
  }
  console.log(`  ✓ ${orders.length} orders`);

  console.log('→ Migrating order items...');
  const items = await paginate<any>('order_items', '*');
  for (const row of items) {
    const itemData = {
      orderId: row.order_id,
      productId: row.product_id,
      productName: row.product_name ?? '',
      unitPrice: row.unit_price,
      quantity: row.quantity ?? 1,
    };
    await prisma.orderItem.upsert({
      where: { id: row.id },
      update: itemData,
      create: { id: row.id, createdAt: new Date(row.created_at ?? Date.now()), ...itemData },
    });
  }
  console.log(`  ✓ ${items.length} order items`);
}

async function migrateDownloadTokens() {
  console.log('→ Migrating download tokens...');
  const tokens = await paginate<any>('download_tokens', '*');
  for (const row of tokens) {
    const tokenData = {
      token: row.token ?? crypto.randomUUID(),
      orderId: row.order_id,
      orderItemId: row.order_item_id,
      deliveryLink: row.delivery_link ?? null,
      downloadCount: row.download_count ?? 0,
      maxDownloads: row.max_downloads ?? 99999,
      expiresAt: new Date(row.expires_at),
      revokedAt: row.is_revoked ? (row.revoked_at ? new Date(row.revoked_at) : new Date()) : null,
      lastDownloadAt: row.last_download_at ? new Date(row.last_download_at) : null,
      lastDownloadIp: row.last_download_ip ?? null,
      updatedAt: new Date(row.updated_at ?? row.created_at),
    };
    await prisma.downloadToken.upsert({
      where: { id: row.id },
      update: tokenData,
      create: { id: row.id, createdAt: new Date(row.created_at), ...tokenData },
    });
  }
  console.log(`  ✓ ${tokens.length} download tokens`);
}

async function migrateSiteConfig() {
  console.log('→ Migrating site config...');
  const { data } = await supabase.from('site_config').select('*').eq('key', 'global').single();
  if (data) {
    await prisma.siteConfig.upsert({
      where: { key: 'global' },
      update: { value: data.value },
      create: {
        id: data.id,
        key: 'global',
        value: data.value ?? {},
        updatedAt: new Date(data.updated_at ?? Date.now()),
      },
    });
    console.log('  ✓ site_config migrated');
  } else {
    console.log('  ⚠ no site_config found, skipping');
  }
}

async function main() {
  console.log('Starting Supabase → PostgreSQL migration\n');
  try {
    await migrateCategories();
    await migrateProducts();
    await migrateUsers();
    await migrateOrders();
    await migrateDownloadTokens();
    await migrateSiteConfig();
    console.log('\n✅ Migration complete!');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
