/**
 * Diagnostik READ-ONLY koneksi & data database (aman: tidak menampilkan kredensial).
 * Pemakaian:  npx tsx scripts/check-db.ts
 * Membaca konfigurasi dari frontend/.env — arahkan DB_* ke Aiven untuk mengecek production DB.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

function parseCa(cert?: string): string | undefined {
  if (!cert) return undefined;
  const normalized = cert.trim().replace(/\\n/g, '\n');
  return normalized.length > 0 ? normalized : undefined;
}

function mask(v?: string): string {
  if (!v) return '(kosong)';
  return `${v.slice(0, 6)}${v.length > 6 ? '***' : ''}`;
}

async function main() {
  const sslCa = parseCa(process.env.DB_SSL_CA);
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || !!sslCa;

  console.log('=== BubLuv DB Diagnostics (read-only) ===\n');
  console.log(`Host           : ${process.env.DB_HOST || '(tidak diset!)'}`);
  console.log(`Port           : ${process.env.DB_PORT || '3306'}`);
  console.log(`Database       : ${process.env.DB_DATABASE || '(tidak diset!)'}`);
  console.log(`Username       : ${mask(process.env.DB_USERNAME)}`);
  console.log(`Password       : ${process.env.DB_PASSWORD ? '****** (diset)' : '(KOSONG!)'}`);
  console.log(`SSL            : ${useSsl ? 'AKTIF' : 'nonaktif'}`);
  console.log(`SSL CA         : ${sslCa ? 'disediakan' : 'tidak ada (pakai CA sistem bila rejectUnauthorized=true)'}`);
  console.log(`rejectUnauth   : ${process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' ? 'true (default)' : 'false'}`);
  console.log(`JWT_SECRET     : ${process.env.JWT_SECRET ? 'diset (panjang ' + process.env.JWT_SECRET.length + ')' : '(KOSONG!)'}\n`);

  if (!process.env.DB_HOST || !process.env.DB_DATABASE) {
    console.error('KONFIGURASI TIDAK LENGKAP — isi DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD di .env');
    process.exit(1);
  }

  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      ssl: useSsl
        ? {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
            ca: sslCa,
            minVersion: 'TLSv1.2',
          }
        : undefined,
      connectTimeout: 10_000,
    });
    console.log('[OK] Koneksi database berhasil!\n');

    const expectedTables = [
      'users', 'categories', 'products', 'product_variants', 'product_images',
      'orders', 'order_items', 'payments', 'order_status_histories', 'store_settings',
    ];

    const [tables] = await conn.query('SHOW TABLES');
    const tableNames = (tables as any[]).map((t) => Object.values(t)[0] as string);
    console.log(`Tabel ditemukan: ${tableNames.length} (${tableNames.join(', ')})\n`);

    const missing = expectedTables.filter((t) => !tableNames.includes(t));
    if (missing.length > 0) {
      console.error(`[MASALAH] Tabel belum dibuat: ${missing.join(', ')}`);
      console.error('  -> Jalankan: npm run db:migrate (setelah isi .env dengan kredensial Aiven)');
    }

    for (const t of expectedTables) {
      if (!tableNames.includes(t)) continue;
      const [countRows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
      const c = (countRows as any[])[0].c;
      const mark = c === 0 && ['categories', 'products', 'users', 'store_settings'].includes(t) ? '  <-- KOSONG (perlu seed?)' : '';
      console.log(`  ${t.padEnd(24)} ${String(c).padStart(6)} baris${mark}`);
    }

    // Sanity check produk: ada gambar?
    const [prodRows] = await conn.query(
      'SELECT COUNT(*) AS total, SUM(image IS NOT NULL AND image != "") AS with_image FROM products'
    );
    const pr = (prodRows as any[])[0];
    console.log(`\n  Produk dengan gambar: ${pr.with_image}/${pr.total}`);

    await conn.end();
    console.log('\n[SELESAI] Diagnostik selesai tanpa mengubah data apa pun.');
  } catch (err: any) {
    console.error(`\n[GAGAL] Tidak dapat terhubung: ${err.code || ''} ${err.message}`);
    if (err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
      console.error('  -> Periksa DB_HOST/DB_PORT, dan pastikan IP Vercel/komputer diizinkan Aiven.');
    }
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  -> Username/password salah.');
    }
    if (/ssl|certificate|self-signed/i.test(err.message)) {
      console.error('  -> Masalah SSL: set DB_SSL=true, dan bila perlu DB_SSL_CA=<CA cert Aiven> atau DB_SSL_REJECT_UNAUTHORIZED=false.');
    }
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('  -> Database tidak ditemukan. Periksa DB_DATABASE.');
    }
    process.exit(1);
  }
}

main();
