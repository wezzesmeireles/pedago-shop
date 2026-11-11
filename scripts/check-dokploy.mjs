import assert from 'node:assert/strict';
const base = process.argv[2];
if (!base) throw new Error('Informe a URL HTTPS da implantação.');
for (const path of ['/', '/auth/login', '/auth/google-callback', '/healthz', '/sitemap.xml', '/v1/health/version']) {
  const res = await fetch(new URL(path, base));
  assert.equal(res.status, 200, path);
  if (path === '/') {
    const html = await res.text();
    assert.match(html, /<html/);
    const asset = html.match(/src="(\/assets\/[^\"]+\.js)"/);
    assert.ok(asset, 'Frontend JS entry');
    const js = await fetch(new URL(asset[1], base));
    assert.equal(js.status, 200);
    assert.match(js.headers.get('cache-control'), /immutable/);
  }
  console.log('OK', path);
}
const config = await (await fetch(new URL('/api/config', base))).json();
for (const secret of ['mercadoPagoAccessToken', 'mercadoPagoWebhookSecret', 'telegramBotToken', 'googleClientSecret', 'discordBotToken', 'discordWebhookUrl']) {
  assert.equal(Object.hasOwn(config, secret), false, secret);
}
const catalog = await (await fetch(new URL('/api/catalog', base))).json();
assert.ok(catalog.products.length > 0, 'Catálogo com produtos');
assert.ok(catalog.categories.length > 0, 'Catálogo com categorias');
assert.ok(catalog.products.every(p => !Object.hasOwn(p, 'fileKey') && !Object.hasOwn(p, 'deliveryLink')));
console.log('OK catálogo e configuração sem segredos');
for (const [path, status, options] of [
  ['/api/unknown', 404],
  ['/api/download?token=invalid-deployment-check', 404],
  ['/api/send-product', 403, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }],
  ['/api/reset-password', 400, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }],
]) {
  const res = await fetch(new URL(path, base), options);
  assert.equal(res.status, status, path);
  console.log('OK', path, status);
}
