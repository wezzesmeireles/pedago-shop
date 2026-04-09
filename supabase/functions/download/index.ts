import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) return new Response('Token inválido', { status: 400 });

  // Validate token
  const { data: dt } = await supabase
    .from('download_tokens')
    .select('*, order_items(product_name, products(file_key, name))')
    .eq('token', token)
    .is('revoked_at', null)
    .single();

  if (!dt) return new Response('Token inválido ou expirado', { status: 404 });
  if (new Date(dt.expires_at) < new Date()) return new Response('Token expirado', { status: 410 });

  const fileKey = (dt.order_items as any)?.products?.file_key;
  const productName = (dt.order_items as any)?.products?.name ?? (dt.order_items as any)?.product_name ?? 'arquivo';

  if (!fileKey) return new Response('Arquivo não encontrado', { status: 404 });

  // Get signed URL from Supabase Storage
  const { data: signed } = await supabase.storage.from('product-files').createSignedUrl(fileKey, 60);
  if (!signed?.signedUrl) return new Response('Erro ao gerar link', { status: 500 });

  // Fetch the file from storage
  const fileRes = await fetch(signed.signedUrl);
  if (!fileRes.ok) return new Response('Erro ao baixar arquivo', { status: 502 });

  const fileBuffer = await fileRes.arrayBuffer();

  // Increment download count
  await supabase.from('download_tokens').update({
    download_count: (dt.download_count ?? 0) + 1,
    last_download_at: new Date().toISOString(),
  }).eq('token', token);

  const filename = productName.replace(/[^a-z0-9\s]/gi, '').trim().replace(/\s+/g, '_') + '.pdf';

  return new Response(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(fileBuffer.byteLength),
      'Cache-Control': 'no-store',
    },
  });
});
