/**
 * Storage migration: Supabase Storage → MinIO
 *
 * Copies every file from Supabase buckets to the corresponding MinIO buckets.
 * Uses streaming (no full file in memory) to handle large PDFs.
 *
 * Usage:
 *   export SUPABASE_URL=https://xxx.supabase.co
 *   export SUPABASE_SERVICE_KEY=<service_role_key>
 *   export MINIO_ENDPOINT=localhost          # or your MinIO host
 *   export MINIO_PORT=9000
 *   export MINIO_ACCESS_KEY=minioadmin
 *   export MINIO_SECRET_KEY=minioadmin123
 *   export MINIO_USE_SSL=false
 *   pnpm tsx scripts/migrate-storage.ts
 *
 * Bucket mapping (Supabase bucket → MinIO bucket):
 *   product-covers   → product-covers
 *   product-previews → product-previews
 *   product-files    → product-files
 *   avatars          → product-covers   (avatars go into covers bucket)
 *   <anything else>  → product-covers   (safe fallback)
 */

import { createClient } from '@supabase/supabase-js';
import * as Minio from 'minio';
import * as https from 'https';
import * as http from 'http';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT ?? '9000', 10);
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin123';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const minio = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// Supabase bucket name → MinIO bucket name
const BUCKET_MAP: Record<string, string> = {
  'product-covers': 'product-covers',
  'product-previews': 'product-previews',
  'product-files': 'product-files',
  'avatars': 'product-covers',
};

function minioBucketFor(supabaseBucket: string): string {
  return BUCKET_MAP[supabaseBucket] ?? 'product-covers';
}

async function ensureBucket(bucket: string) {
  const exists = await minio.bucketExists(bucket);
  if (!exists) {
    await minio.makeBucket(bucket, 'us-east-1');
    console.log(`  created bucket: ${bucket}`);
  }
}

async function streamFromUrl(url: string): Promise<NodeJS.ReadableStream> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      } else {
        resolve(res);
      }
    }).on('error', reject);
  });
}

async function listAllFiles(bucket: string): Promise<Array<{ name: string; size: number }>> {
  const files: Array<{ name: string; size: number }> = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list('', {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list ${bucket}: ${error.message}`);
    if (!data || data.length === 0) break;

    // Recursively list folders
    for (const item of data) {
      if (item.id === null) {
        // It's a folder — list its contents
        const sub = await listFolder(bucket, item.name);
        files.push(...sub);
      } else {
        files.push({ name: item.name, size: item.metadata?.size ?? 0 });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function listFolder(
  bucket: string,
  folder: string,
): Promise<Array<{ name: string; size: number }>> {
  const files: Array<{ name: string; size: number }> = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list ${bucket}/${folder}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const item of data) {
      const fullPath = `${folder}/${item.name}`;
      if (item.id === null) {
        const sub = await listFolder(bucket, fullPath);
        files.push(...sub);
      } else {
        files.push({ name: fullPath, size: item.metadata?.size ?? 0 });
      }
    }
    if (data.length < limit) break;
    offset += limit;
  }
  return files;
}

async function migrateBucket(supabaseBucket: string) {
  const minioBucket = minioBucketFor(supabaseBucket);
  await ensureBucket(minioBucket);

  console.log(`\n→ ${supabaseBucket} → ${minioBucket}`);
  const files = await listAllFiles(supabaseBucket);
  console.log(`  ${files.length} files`);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const file of files) {
    // Key in MinIO: if avatar bucket, prefix with "avatars/"
    const minioKey = supabaseBucket === 'avatars' ? `avatars/${file.name}` : file.name;

    // Skip if already exists in MinIO
    try {
      await minio.statObject(minioBucket, minioKey);
      skip++;
      continue;
    } catch {
      // Not found — proceed with upload
    }

    try {
      // Get a signed URL valid 60s for download
      const { data, error } = await supabase.storage
        .from(supabaseBucket)
        .createSignedUrl(file.name, 60);
      if (error || !data?.signedUrl) throw new Error(error?.message ?? 'no signed url');

      const stream = await streamFromUrl(data.signedUrl);
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const contentType = ext === 'pdf' ? 'application/pdf'
        : ext === 'png' ? 'image/png'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg';

      const meta: Record<string, string> = { 'Content-Type': contentType };
      if (file.size > 0) {
        await minio.putObject(minioBucket, minioKey, stream, file.size, meta);
      } else {
        await minio.putObject(minioBucket, minioKey, stream, meta as any);
      }
      ok++;

      if (ok % 50 === 0) process.stdout.write(`  ${ok} uploaded...\r`);
    } catch (err: any) {
      console.warn(`  ⚠ failed: ${file.name} — ${err.message}`);
      fail++;
    }
  }

  console.log(`  ✓ ${ok} uploaded, ${skip} skipped, ${fail} failed`);
}

async function listSupabaseBuckets(): Promise<string[]> {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) throw new Error(`listBuckets: ${error.message}`);
  return (data ?? []).map((b: any) => b.name);
}

async function main() {
  console.log('Supabase Storage → MinIO migration\n');
  console.log(`MinIO: ${MINIO_ENDPOINT}:${MINIO_PORT} (ssl=${MINIO_USE_SSL})`);

  const buckets = await listSupabaseBuckets();
  console.log(`Found Supabase buckets: ${buckets.join(', ')}`);

  // Ensure all MinIO target buckets exist
  const targets = [...new Set(buckets.map(minioBucketFor))];
  for (const b of targets) await ensureBucket(b);

  for (const bucket of buckets) {
    await migrateBucket(bucket);
  }

  console.log('\n✅ Storage migration complete!');
}

main().catch(err => {
  console.error('\n❌ Storage migration failed:', err);
  process.exit(1);
});
