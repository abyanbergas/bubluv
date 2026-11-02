import 'dotenv/config';
const mod = await import('../api/[...path].ts');
const { Readable } = await import('node:stream');

function makeRes() {
  return {
    statusCode: 0, headersSent: false,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(d) { this.jsonBody = d; return this; },
    end() { this.headersSent = true; return this; },
  };
}

async function probe(name, queryPathValue) {
  const req = Readable.from([]);
  req.method = 'GET';
  req.headers = {};
  req.query = { path: queryPathValue };
  const res = makeRes();
  try {
    await mod.default(req, res);
    console.log(`[${name}] -> status=${res.statusCode} success=${res.jsonBody?.success ?? '-'} msg=${(res.jsonBody?.message ?? '').slice(0,60)}`);
  } catch (e) {
    console.log(`[${name}] -> UNCAUGHT CRASH: ${e.constructor.name}: ${e.message}`);
  }
}

await probe('array ["settings"]', ['settings']);
await probe('string "settings"', 'settings');
await probe('undefined', undefined);
await probe('string kosong ""', '');
process.exit(0);
