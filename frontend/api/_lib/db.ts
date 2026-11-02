import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

let pool: Pool | null = null;

function getPoolOptions(): PoolOptions {
  const sslCa = process.env.DB_SSL_CA;
  const useSsl = process.env.DB_SSL === 'true' || !!sslCa;

  const options: PoolOptions = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    namedPlaceholders: true,
    timezone: 'Z',
    dateStrings: false,
    decimalNumbers: true,
    multipleStatements: false,
  };

  if (useSsl) {
    options.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ca: sslCa || undefined,
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
