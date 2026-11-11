import express from 'express';
import httpProxy from 'http-proxy';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import catalog from '../api/catalog';
import config from '../api/config';
import download from '../api/download';
import og from '../api/og';
import sitemap from '../api/sitemap';
import sendRecovery from '../api/send-recovery';
import resetPassword from '../api/reset-password';
import sendProduct from '../api/send-product';
import clientError from '../api/client-error';

const app = express();
app.disable('x-powered-by');
const upstream = new URL(process.env.APPWRITE_ENDPOINT || 'https://appwrite.wsgestao.digital/v1');
const proxy = httpProxy.createProxyServer({
  target: upstream.origin,
  changeOrigin: true,
  ws: true,
  cookieDomainRewrite: '',
  proxyTimeout: 300000,
});
proxy.on('error', (_error, _req, res: any) => {
  if (typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Serviço temporariamente indisponível.' }));
  } else res.destroy();
});
// Run before the JSON parser: preserve uploads, function requests and cookies.
app.use((req, res, next) => {
  if (req.path === '/v1' || req.path.startsWith('/v1/')) return proxy.web(req, res);
  next();
});
app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', express.json({ limit: '1mb' }));
const handlers = { catalog, config, download, og, sitemap,
  'send-recovery': sendRecovery, 'reset-password': resetPassword,
  'send-product': sendProduct, 'client-error': clientError };
for (const [name, handler] of Object.entries(handlers)) {
  app.all(`/api/${name}`, (req, res, next) => Promise.resolve(handler(req, res)).catch(next));
}
app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.get('/sitemap.xml', (req, res, next) => Promise.resolve(sitemap(req, res)).catch(next));
const dist = resolve(process.env.STATIC_DIR || 'apps/web/dist');
app.use(express.static(dist, {
  index: false,
  setHeaders(res, file) {
    if (/[\\/]assets[\\/]/.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'no-cache');
    if (file.endsWith('/sw.js') || file.endsWith('\\sw.js')) res.setHeader('Service-Worker-Allowed', '/');
  },
}));
app.get(['/', '/produto/:slug', '/atividades/:category'], (req, res, next) => {
  Object.assign(req.query, req.params);
  Promise.resolve(og(req, res)).catch(next);
});
app.get('*', (_req, res) => res.sendFile(resolve(dist, 'index.html'), { headers: { 'Cache-Control': 'no-cache' } }));
app.use((error: any, _req: any, res: any, _next: any) => {
  console.error('[http]', error.message);
  if (!res.headersSent) res.status(error.status === 400 ? 400 : 500).json({ error: 'Não foi possível processar a solicitação.' });
});
const server = createServer(app);
server.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/v1/realtime')) proxy.ws(req, socket, head);
  else socket.destroy();
});
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('PedagoShop HTTP server ready'));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000).unref();
});
