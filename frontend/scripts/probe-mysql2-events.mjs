// ============================================================
// VERIFIKASI EMPIRIS event 'error' pada mysql2 3.24.6:
// 1. Apakah Pool (core & promise) memancarkan 'error'?
// 2. Apakah error berasal dari PoolConnection?
// 3. Apakah emit('error') tanpa listener crash?
// 4. Apakah pool.on('connection') memberi akses ke koneksi?
// ============================================================
import mysql from 'mysql2/promise';
import net from 'node:net';

const results = [];

// --- Test A: apakah PromisePool.corePool memancarkan 'error'? ---
const pool = mysql.createPool({
  host: '127.0.0.1', port: 3306, user: 'root', database: 'bubluv',
  connectionLimit: 2, maxIdle: 0, idleTimeout: 5,
});

let poolErrorFired = 0;
let promisePoolErrorFired = 0;
let connEventFired = 0;
let connErrorFired = 0;
let uncaught = null;
process.on('uncaughtException', (e) => { uncaught = e; });

// Listener pada promise pool (yang direkomendasikan diagnosis awal)
pool.on('error', () => { promisePoolErrorFired++; });

// Listener pada core pool (via pool.pool)
pool.pool.on('error', () => { poolErrorFired++; });

// Pool 'connection' event
pool.pool.on('connection', (c) => {
  connEventFired++;
  c.on('error', () => { connErrorFired++; });
});

// Dapatkan koneksi, lalu simulasikan TCP reset pada socket-nya (ECONNRESET)
const conn = await pool.getConnection();
console.log('Test A: koneksi diperoleh, socket writable =', !!conn.stream);

// Paksa stream error: destroy socket dengan abort
conn.stream.destroy(new Error('PROTOCOL_CONNECTION_LOST simulasi: simulasi ECONNRESET'));

// Beri waktu event propagate
await new Promise((r) => setTimeout(r, 1000));

results.push(['A. PromisePool.on(error) terpanggil?', promisePoolErrorFired > 0, `${promisePoolErrorFired}x`]);
results.push(['B. CorePool.on(error) terpanggil?', poolErrorFired > 0, `${poolErrorFired}x`]);
results.push(['C. pool.on(connection) terpanggil?', connEventFired > 0, `${connEventFired}x`]);
results.push(['D. PoolConnection.on(error) terpanggil?', connErrorFired > 0, `${connErrorFired}x`]);
results.push(['E. uncaughtException terjadi?', uncaught !== null, uncaught ? String(uncaught.message).slice(0,60) : '-']);

// --- Test B: apakah koneksi rusak otomatis dihapus & pool masih sehat? ---
let poolHealthyAfterCrash = false;
try {
  await pool.query('SELECT 1 AS ok');
  poolHealthyAfterCrash = true;
} catch (e) {
  poolHealthyAfterCrash = false;
}
results.push(['F. Pool masih bisa query setelah koneksi rusak?', poolHealthyAfterCrash, '']);

// --- Test C: uncaughtException karena 'error' tanpa listener pada koneksi BARU? ---
// Buat pool tanpa listener apapun, rusak koneksinya
const pool2 = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'bubluv', maxIdle: 0, idleTimeout: 5 });
let uncaught2 = null;
const handler2 = (e) => { uncaught2 = e; };
process.on('uncaughtException', handler2);
const conn2 = await pool2.getConnection();
conn2.stream.destroy(new Error('simulasi reset koneksi kedua'));
await new Promise((r) => setTimeout(r, 800));
results.push(['G. Tanpa listener apapun -> crash?', uncaught2 !== null, uncaught2 ? String(uncaught2.message).slice(0,60) : '']);
process.off('uncaughtException', handler2);

// --- Test D: koneksi idle ter-destroy oleh maxIdle/idleTimeout -> emit 'error'? ---
let idleDestroyError = 0;
const pool3 = mysql.createPool({ host: '127.0.0.1', user: 'root', database: 'bubluv', maxIdle: 0, idleTimeout: 2 });
pool3.pool.on('connection', (c) => c.on('error', () => idleDestroyError++));
await pool3.query('SELECT 1'); // buat & release koneksi
await new Promise((r) => setTimeout(r, 3500)); // tunggu idleTimeout destroy
results.push(['H. Idle-timeout destroy memicu conn error event?', idleDestroyError > 0, `${idleDestroyError}x`]);

console.log('\n===== HASIL VERIFIKASI =====');
for (const [name, val, extra] of results) {
  console.log(`${val ? 'YA ' : 'TIDAK'} | ${name} ${extra}`);
}
process.exit(0);
