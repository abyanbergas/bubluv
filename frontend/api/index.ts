import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RequestWithUser } from './_lib/auth.js';
import { setCors, handleOptions, fail } from './_lib/http.js';

/**
 * BubLuv API — Single Catch-All Serverless Function Router.
 *
 * Semua endpoint dilayani oleh 1 function ini agar sesuai batas
 * Vercel Hobby (maks. 12 functions). Handler implementasi ada di
 * ./_handlers/ (tidak dihitung sebagai function karena prefix "_").
 */

export const config = {
  api: {
    bodyParser: false, // Body diparse manual (JSON & multipart via busboy)
  },
};

type Handler = (req: RequestWithUser, res: VercelResponse) => any;

interface RouteDef {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
  isMultipart?: boolean;
}

import settings from './_handlers/settings.js';
import categories from './_handlers/categories.js';
import products from './_handlers/products.js';
import productsDetail from './_handlers/products-detail.js';
import authLogin from './_handlers/auth-login.js';
import authRegister from './_handlers/auth-register.js';
import authMe from './_handlers/auth-me.js';
import authProfile from './_handlers/auth-profile.js';
import authLogout from './_handlers/auth-logout.js';
import customerOrders from './_handlers/customer-orders.js';
import orders from './_handlers/orders.js';
import ordersDetail from './_handlers/orders-detail.js';
import ordersProof from './_handlers/orders-proof.js';
import paymentsSimulate from './_handlers/payments-simulate.js';
import adminDashboard from './_handlers/admin-dashboard.js';
import adminProducts from './_handlers/admin-products.js';
import adminProductsId from './_handlers/admin-products-id.js';
import adminCategories from './_handlers/admin-categories.js';
import adminCategoriesId from './_handlers/admin-categories-id.js';
import adminOrders from './_handlers/admin-orders.js';
import adminOrdersId from './_handlers/admin-orders-id.js';
import adminOrdersStatus from './_handlers/admin-orders-status.js';
import adminPayments from './_handlers/admin-payments.js';
import adminPaymentsVerify from './_handlers/admin-payments-verify.js';
import adminCustomers from './_handlers/admin-customers.js';
import adminSettings from './_handlers/admin-settings.js';

const routes: RouteDef[] = [
  // --- Publik ---
  { method: 'GET',    pattern: /^settings$/,                                          paramNames: [], handler: settings as Handler },
  { method: 'GET',    pattern: /^categories$/,                                        paramNames: [], handler: categories as Handler },
  { method: 'GET',    pattern: /^products$/,                                          paramNames: [], handler: products as Handler },
  { method: 'GET',    pattern: /^products\/([^\/]+)$/,                                paramNames: ['slug'], handler: productsDetail as Handler },
  { method: 'POST',   pattern: /^auth\/register$/,                                    paramNames: [], handler: authRegister as Handler },
  { method: 'POST',   pattern: /^auth\/login$/,                                       paramNames: [], handler: authLogin as Handler },
  { method: 'POST',   pattern: /^orders$/,                                            paramNames: [], handler: orders as Handler },
  { method: 'GET',    pattern: /^orders\/([^\/]+)$/,                                  paramNames: ['orderNumber'], handler: ordersDetail as Handler },
  { method: 'POST',   pattern: /^orders\/([^\/]+)\/proof$/,                           paramNames: ['orderNumber'], handler: ordersProof as Handler },
  { method: 'POST',   pattern: /^payments\/simulate-sandbox$/,                        paramNames: [], handler: paymentsSimulate as Handler },

  // --- Customer/Auth ---
  { method: 'GET',    pattern: /^auth\/me$/,                                          paramNames: [], handler: authMe as Handler },
  { method: 'PUT',    pattern: /^auth\/profile$/,                                     paramNames: [], handler: authProfile as Handler },
  { method: 'POST',   pattern: /^auth\/logout$/,                                      paramNames: [], handler: authLogout as Handler },
  { method: 'GET',    pattern: /^customer\/orders$/,                                  paramNames: [], handler: customerOrders as Handler },

  // --- Admin ---
  { method: 'GET',    pattern: /^admin\/dashboard$/,                                  paramNames: [], handler: adminDashboard as Handler },
  { method: 'GET',    pattern: /^admin\/products$/,                                   paramNames: [], handler: adminProducts as Handler },
  { method: 'POST',   pattern: /^admin\/products$/,                                   paramNames: [], handler: adminProducts as Handler },
  { method: 'GET',    pattern: /^admin\/products\/([^\/]+)$/,                         paramNames: ['id'], handler: adminProductsId as Handler },
  { method: 'POST',   pattern: /^admin\/products\/([^\/]+)$/,                         paramNames: ['id'], handler: adminProductsId as Handler },
  { method: 'DELETE', pattern: /^admin\/products\/([^\/]+)$/,                         paramNames: ['id'], handler: adminProductsId as Handler },
  { method: 'GET',    pattern: /^admin\/categories$/,                                 paramNames: [], handler: adminCategories as Handler },
  { method: 'POST',   pattern: /^admin\/categories$/,                                 paramNames: [], handler: adminCategories as Handler },
  { method: 'PUT',    pattern: /^admin\/categories\/([^\/]+)$/,                       paramNames: ['id'], handler: adminCategoriesId as Handler },
  { method: 'DELETE', pattern: /^admin\/categories\/([^\/]+)$/,                       paramNames: ['id'], handler: adminCategoriesId as Handler },
  { method: 'GET',    pattern: /^admin\/orders$/,                                     paramNames: [], handler: adminOrders as Handler },
  { method: 'GET',    pattern: /^admin\/orders\/([^\/]+)$/,                           paramNames: ['id'], handler: adminOrdersId as Handler },
  { method: 'PUT',    pattern: /^admin\/orders\/([^\/]+)\/status$/,                   paramNames: ['id'], handler: adminOrdersStatus as Handler },
  { method: 'GET',    pattern: /^admin\/payments$/,                                   paramNames: [], handler: adminPayments as Handler },
  { method: 'PUT',    pattern: /^admin\/payments\/([^\/]+)\/verify$/,                 paramNames: ['id'], handler: adminPaymentsVerify as Handler },
  { method: 'GET',    pattern: /^admin\/customers$/,                                  paramNames: [], handler: adminCustomers as Handler },
  { method: 'GET',    pattern: /^admin\/settings$/,                                   paramNames: [], handler: adminSettings as Handler },
  { method: 'POST',   pattern: /^admin\/settings$/,                                   paramNames: [], handler: adminSettings as Handler },
];

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function readBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCors(res);
  if (handleOptions(req, res)) return;

  const method = (req.method || 'GET').toUpperCase();

  // Prioritas 1: req.query.path (file-based routing Vercel)
  let rawPath = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path || '');

  // Prioritas 2: fallback parse dari req.url (mis. "/api/settings?x=1")
  if (!rawPath) {
    const urlStr = String(req.url || '');
    if (urlStr) {
      let pathname = urlStr;
      try {
        pathname = new URL(urlStr, 'http://localhost').pathname;
      } catch {
        const q = urlStr.indexOf('?');
        if (q >= 0) pathname = urlStr.slice(0, q);
      }
      pathname = decodeURIComponent(pathname).replace(/^\/+|\/+$/g, '');
      if (pathname === 'api') {
        rawPath = '';
      } else if (pathname.startsWith('api/')) {
        rawPath = pathname.slice(4);
      } else {
        rawPath = pathname;
      }
    }
  }

  const path = decodeURIComponent(rawPath).replace(/^\/+|\/+$/g, '');

  // Path traversal guard
  if (path.includes('..') || path.includes('\\') || path.includes('\0')) {
    return fail(res, 'Endpoint tidak valid.', 400);
  }

  const matched = routes.find(
    (r) => r.method === method && r.pattern.test(path)
  );

  if (!matched) {
    const pathExists = routes.some((r) => r.pattern.test(path));
    return fail(
      res,
      pathExists
        ? `Method ${method} tidak diizinkan untuk endpoint ini.`
        : `Endpoint /api/${path} tidak ditemukan.`,
      pathExists ? 405 : 404
    );
  }

  // Inject path params ke req.query (meniru perilaku file-based routing Vercel)
  const m = path.match(matched.pattern);
  if (m) {
    matched.paramNames.forEach((name, i) => {
      (req.query as Record<string, string>)[name] = m[i + 1];
    });
  }

  const contentType = String(req.headers['content-type'] || '');
  const needsJsonBody = METHODS_WITH_BODY.has(method) && contentType.includes('application/json');

  if (needsJsonBody && !req.body) {
    const raw = await readBody(req);
    try {
      (req as any).body = raw.length ? JSON.parse(raw.toString('utf8')) : {};
    } catch {
      (req as any).body = {};
    }
  }

  try {
    await matched.handler(req as RequestWithUser, res);
  } catch (err: any) {
    console.error('[API ROUTER ERROR]', err);
    if (!res.headersSent) {
      return fail(res, 'Terjadi kesalahan pada server.', 500);
    }
  }
}
