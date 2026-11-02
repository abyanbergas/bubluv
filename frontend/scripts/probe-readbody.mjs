// PROBE 5: GET tanpa body + Content-Type aneh, plus OPTIONS, plus metode HEAD
import 'dotenv/config';
const mod = await import('../api/[...path].ts');
const { Readable } = await import('node:stream');

function makeRes() {
  return {
    statusCode: 0, headersSent: false, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.jsonBody = d; return this; },
    end(d) { this.headersSent = true; return this; },
  };
}

async function probe(name, { method = 'GET', query = { path: ['settings'] }, headers = {} } = {}) {
  const req = Readable.from([]);
  req.method = method;
  req.headers = headers;
  req.query = query;
  const res = makeRes();
  try {
    await mod.default(req, res);
    console.log(`[${name}] -> status=${res.statusCode} success=${res.jsonBody?.success ?? '-'}`);
  } catch (e) {
    console.log(`[${name}] -> UNCAUGHT CRASH: ${e.constructor.name}: ${e.message}`);
  }
}

process.on('unhandledRejection', (e) => console.log(`!! UNHANDLED REJECTION: ${e?.message}`));

await probe('GET + content-type json (tanpa body)');
await probe('GET + content-type multipart (tanpa body)', { headers: { 'content-type': 'multipart/form-data; boundary=x' } });
await probe('OPTIONS', { method: 'OPTIONS' });
await probe('HEAD', { method: 'HEAD' });
await probe('POST tanpa content-type', { method: 'POST' });
setTimeout(() => process.exit(0), 1500);
