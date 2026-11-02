/**
 * Local dev API server — langsung mendelegasikan ke router catch-all `api/[...path].ts`.
 * Identik dengan perilaku Vercel Serverless Function di production.
 */
import 'dotenv/config';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROUTER_PATH = join(__dirname, '..', 'api', 'index.ts');
const PORT = Number(process.env.API_PORT || 3001);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const pathname = url.pathname.replace(/^\/+|\/+$/g, '');

  if (pathname === 'api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, message: 'BubLuv dev API berjalan (1 function router).' }));
  }

  if (!pathname.startsWith('api/')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: false, message: `Rute ${url.pathname} bukan API. Gunakan /api/*` }));
  }

  // Siapkan query params (termasuk path array untuk [...path].ts)
  const pathSegments = pathname.slice(4).split('/').filter(Boolean);
  const query: Record<string, any> = Object.fromEntries(url.searchParams.entries());
  query.path = pathSegments;
  (req as any).query = query;

  // Shim VercelResponse untuk Node HTTP response
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
    const mod = await import(`${pathToFileURL(ROUTER_PATH).href}?t=${Date.now()}`);
    await mod.default(req as any, res as any);
  } catch (err: any) {
    console.error(`[dev-api] ERROR pada ${url.pathname}:`, err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ success: false, message: err?.message || 'Terjadi kesalahan pada server API lokal.' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n[dev-api] BubLuv API lokal (1 function router) berjalan di http://localhost:${PORT}`);
  console.log('[dev-api] Vite akan mem-proxy request /api/* ke server ini.\n');
});
