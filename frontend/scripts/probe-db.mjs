// Simulasi kondisi SSL Aiven yang salah: DB_SSL=true + host palsu
process.env.DB_HOST = 'invalid-host-does-not-exist.aivencloud.com';
process.env.DB_PORT = '12345';
process.env.DB_DATABASE = 'defaultdb';
process.env.DB_USERNAME = 'avnadmin';
process.env.DB_PASSWORD = 'x';
process.env.DB_SSL = 'true';
process.env.DB_SSL_REJECT_UNAUTHORIZED = 'true';

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

const req = Readable.from([]);
req.method = 'GET';
req.headers = {};
req.query = { path: ['settings'] };
const res = makeRes();

try {
  await mod.default(req, res);
  console.log(`RESULT -> status=${res.statusCode} success=${res.jsonBody?.success ?? '-'} msg=${(res.jsonBody?.message ?? '').slice(0,120)}`);
} catch (e) {
  console.log(`UNCAUGHT CRASH (penyebab FUNCTION_INVOCATION_FAILED): ${e.constructor.name}: ${e.message}`);
}
process.exit(0);
