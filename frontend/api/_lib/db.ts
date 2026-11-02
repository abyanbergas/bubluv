import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;

/**
 * Normalisasi CA certificate dari environment variable.
 * Mendukung format satu baris (dengan escape \n) maupun multi-baris.
 */
function parseCa(cert?: string): string | undefined {
  if (!cert) return undefined;
  const normalized = cert.trim().replace(/\\n/g, '\n');
  return normalized.length > 0 ? normalized : undefined;
}

function getPoolOptions(): PoolOptions {
  const sslCa = parseCa(process.env.DB_SSL_CA);
  // SSL aktif bila DB_SSL='true' atau bila CA disediakan. Aiven wajib SSL.
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1' || !!sslCa;

  const options: PoolOptions = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 0, // Tutup koneksi idle agar aman untuk serverless (lambda hang)
    idleTimeout: 60,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    namedPlaceholders: true,
    timezone: 'Z',
    dateStrings: false,
    decimalNumbers: true,
    multipleStatements: false, // Cegah SQL injection multi-statement
    connectTimeout: 10_000,
  };

  // SSL/TLS wajib untuk Aiven; rejectUnauthorized default true (aman).
  if (useSsl) {
    options.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ca: sslCa,
      // Aiven memakai TLS 1.2+
      minVersion: 'TLSv1.2',
    };
  }

  return options;
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(getPoolOptions());
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function query<T = any>(
  sql: string,
  params: Record<string, unknown> | unknown[] = {}
): Promise<T[]> {
  const p = getPool();
  const [rows] = await p.query(sql, params as any);
  return rows as T[];
}

export async function queryOne<T = any>(
  sql: string,
  params: Record<string, unknown> | unknown[] = {}
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute<T = any>(
  sql: string,
  params: Record<string, unknown> | unknown[] = {}
): Promise<{ affectedRows: number; insertId: number }> {
  const p = getPool();
  const [result] = await p.execute(sql, params as any);
  const r = result as any;
  return { affectedRows: r.affectedRows, insertId: r.insertId };
}

export async function withTransaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const p = getPool();
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
