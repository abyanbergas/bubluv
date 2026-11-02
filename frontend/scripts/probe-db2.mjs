// Kondisi 2: host valid tapi SSL gagal karena CA self-signed tanpa DB_SSL_CA
// Kita arahkan ke server TLS self-signed lokal untuk memicu error sertifikat.
// Gunakan target: port TLS lokal dari openssl? Terlalu rumit — cukup uji error path mysql dengan promise rejection asinkron.
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3306';
process.env.DB_DATABASE = 'bubluv';
process.env.DB_USERNAME = 'root';
process.env.DB_PASSWORD = 'wrong-password-xyz';
process.env.DB_SSL = 'true';
process.env.DB_SSL_REJECT_UNAUTHORIZED = 'true';
process.env.JWT_SECRET = 'dummy-secret-for-probe-0123456789abcdef';

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

process.on('unhandledRejection', (e) => {
  console.log(`!! UNHANDLED PROMISE REJECTION: ${e?.constructor?.name}: ${e?.message}`);
});

try {
  await mod.default(req, res);
  console.log(`RESULT -> status=${res.statusCode} msg=${(res.jsonBody?.message ?? '').slice(0,120)}`);
} catch (e) {
  console.log(`UNCAUGHT CRASH: ${e.constructor.name}: ${e.message}`);
}
// beri waktu 2s untuk menangkap unhandledRejection yang mungkin muncul belakangan
setTimeout(() => process.exit(0), 2000);
