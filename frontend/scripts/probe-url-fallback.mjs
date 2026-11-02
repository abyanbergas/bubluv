import 'dotenv/config';
const mod = await import('../api/[...path].ts');
const { Readable } = await import('node:stream');

function makeRes() {
  return {
    statusCode: 0, headersSent: false, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.jsonBody = d; return this; },
    end() { this.headersSent = true; return this; },
  };
}

async function probe(name, { query = {}, url = '/' } = {}) {
  const req = Readable.from([]);
  req.method = 'GET'; req.headers = {}; req.url = url; req.query = query;
  const res = makeRes();
  await mod.default(req, res);
  const ok = res.statusCode === 200;
  console.log(`[${name}] -> ${res.statusCode} ${ok ? 'OK' : (res.jsonBody?.message||'').slice(0,50)}`);
}

// Skenario production: query.path TIDAK diisi, req.url berisi path asli
await probe('req.url=/api/settings', { url: '/api/settings' });
await probe('req.url=/api/products?best_seller=true', { url: '/api/products?best_seller=true&per_page=4' });
await probe('req.url=/api/products/bubluv-black-tea', { url: '/api/products/bubluv-black-tea' });
await probe('req.url=/api/auth/me', { url: '/api/auth/me' });
await probe('req.url=/api (root)', { url: '/api' });
// Skenario lama tetap jalan
await probe('query.path=["settings"]', { query: { path: ['settings'] }, url: '/api/settings' });
process.exit(0);
