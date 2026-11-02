/**
 * Local dev API server — meniru routing Vercel Serverless Functions.
 * Dipakai bersama `vite` (lihat script `npm run dev`).
 *
 * Routing yang ditiru dari Vercel:
 *   /api/products            -> api/products/index.ts
 *   /api/products/:slug      -> api/products/[slug].ts        (query.slug)
 *   /api/orders/:num/proof   -> api/orders/[orderNumber]/proof.ts (query.orderNumber)
 *   /api/admin/orders/:id    -> api/admin/orders/[id]/index.ts (query.id)
 */
import 'dotenv/config';
import http from 'node:http';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const API_ROOT = join(__dirname, '..', 'api');
const PORT = Number(process.env.API_PORT || 3001);

type HandlerModule = { default: (req: any, res: any) => Promise<void> | void };

function findHandler(segments: string[]): { file: string; params: Record<string, string> } | null {
  let dir = API_ROOT;
  const params: Record<string, string> = {};

  const remaining = [...segments];
  while (remaining.length > 0) {
    const seg = remaining.shift()!;

    // 1. Cocokkan literal file .ts (mis. login -> login.ts) bila ini segmen terakhir
    if (remaining.length === 0) {
      const literalFile = join(dir, `${seg}.ts`);
      if (existsSync(literalFile)) {
        return { file: literalFile, params };
      }
    }

    // 2. Cocokkan literal folder
    const literal = join(dir, seg);
    if (existsSync(literal) && statSync(literal).isDirectory()) {
      if (remaining.length === 0) {
        const idx = join(literal, 'index.ts');
        if (existsSync(idx)) return { file: idx, params };
        return null;
      }
      dir = literal;
      continue;
    }

    // 3. Cocokkan file dinamis [param].ts pada level ini
    try {
      const entries = readdirSync(dir);
      const dynFile = entries.find((e) => /^\[.+\]\.ts$/.test(e) && remaining.length === 0);
      if (dynFile) {
        params[dynFile.slice(1, -4)] = decodeURIComponent(seg);
        return { file: join(dir, dynFile), params };
      }
      const dynDir = entries.find((e) => /^\[.+\]$/.test(e) && statSync(join(dir, e)).isDirectory());
      if (dynDir && remaining.length > 0) {
        params[dynDir.slice(1, -1)] = decodeURIComponent(seg);
        dir = join(dir, dynDir);
        continue;
      }
    } catch {
      return null;
    }
    return null;
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname.replace(/^\/+|\/+$/g, ''); // trim slashes

  // Health check
  if (pathname === 'api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'BubLuv dev API berjalan.' }));
  }

  if (!pathname.startsWith('api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: `Rute ${url.pathname} bukan API. Gunakan /api/*` }));
  }

  const segments = pathname.slice(4).split('/').filter(Boolean);
  const found = findHandler(segments);
  if (!found) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: `Endpoint /${pathname} tidak ditemukan.` }));
  }

  // Query params (+ params dinamis dari routing)
  const query: Record<string, string> = Object.fromEntries(url.searchParams.entries());
  Object.assign(query, found.params);
  (req as any).query = query;

  // Adapt Node http.ServerResponse ke interface VercelResponse (.status, .json)
  const vRes = res as any;
  if (!vRes.status) {
    vRes.status = function (code: number) {
      this.statusCode = code;
      return this;
    };
  }
  if (!vRes.json) {
    vRes.json = function (data: any) {
      if (!this.headersSent) {
        this.setHeader('Content-Type', 'application/json');
      }
      this.end(JSON.stringify(data));
      return this;
    };
  }

  try {
    const mod = (await import(
      `${pathToFileURL(found.file).href}?t=${Date.now()}`
    )) as HandlerModule;
    if (typeof mod.default !== 'function') {
      throw new Error(`Handler ${found.file} tidak mengekspor default function.`);
    }

    const contentType = req.headers['content-type'] || '';

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (contentType.includes('application/json')) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) chunks.push(chunk as Buffer);
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          (req as any).body = raw ? JSON.parse(raw) : {};
        } catch {
          (req as any).body = {};
        }
        await mod.default(req as any, res as any);
        return;
      }
    }

    // multipart / lainnya: biarkan handler membaca stream (busboy via req.pipe)
    await mod.default(req as any, res as any);
  } catch (err: any) {
    console.error(`[dev-api] ERROR pada ${url.pathname}:`, err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(
      JSON.stringify({
        success: false,
        message: err?.message || 'Terjadi kesalahan pada server API lokal.',
      })
    );
  }
});

// Validasi env penting sebelum start
const missing: string[] = [];
for (const key of ['DB_HOST', 'DB_DATABASE', 'DB_USERNAME']) {
  if (!process.env[key]) missing.push(key);
}
if (missing.length > 0) {
  console.error('\n[dev-api] ENV belum lengkap! Buat file frontend/.env dari .env.example');
  console.error(`[dev-api] Variable hilang: ${missing.join(', ')}\n`);
}

server.listen(PORT, () => {
  console.log(`\n[dev-api] BubLuv API lokal berjalan di http://localhost:${PORT}`);
  console.log('[dev-api] Vite akan mem-proxy request /api/* ke server ini.\n');
});
