// Simulasi bentuk query yang mungkin dikirim Vercel
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

async function probe(name, query) {
  const req = Readable.from([]);
  req.method = 'GET'; req.headers = {}; req.query = query;
  const res = makeRes();
  await mod.default(req, res);
  console.log(`[${name}] -> ${res.statusCode} ${(res.jsonBody?.message||'OK').slice(0,50)}`);
}

await probe('path=["settings"]', { path: ['settings'] });
await probe('path="settings"', { path: 'settings' });
await probe('settings saja', { settings: '' }); // query param biasa
await probe('kosong {}', {});
process.exit(0);
