import type { VercelRequest, VercelResponse } from '@vercel/node';

export function setCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export function handleOptions(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export function ok(res: VercelResponse, data: unknown, extra: Record<string, unknown> = {}, status = 200) {
  res.status(status).json({ success: true, data, ...extra });
}

export function okMessage(res: VercelResponse, message: string, data: unknown = undefined, status = 200) {
  const body: Record<string, unknown> = { success: true, message };
  if (data !== undefined) body.data = data;
  res.status(status).json(body);
}

export function fail(res: VercelResponse, message: string, status = 400, extra: Record<string, unknown> = {}) {
  res.status(status).json({ success: false, message, ...extra });
}

export function validationError(res: VercelResponse, errors: Record<string, string[]>) {
  res.status(422).json({
    success: false,
    message: Object.values(errors)[0]?.[0] || 'Data yang dikirim tidak valid.',
    errors,
  });
}

export function serverError(res: VercelResponse, err: unknown) {
  console.error('[API ERROR]', err);
  const message =
    process.env.NODE_ENV !== 'production' && err instanceof Error
      ? err.message
      : 'Terjadi kesalahan pada server.';
  res.status(500).json({ success: false, message });
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function httpError(status: number, message: string): never {
  throw new HttpError(status, message);
}

export function handleError(res: VercelResponse, err: unknown) {
  if (err instanceof HttpError) {
    if (err.status === 422) {
      return validationError(res, { _: [err.message] });
    }
    return fail(res, err.message, err.status);
  }
  return serverError(res, err);
}

export function parseIntSafe(value: unknown, fallback: number): number {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

export function paginationMeta(page: number, perPage: number, total: number) {
  return {
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    per_page: perPage,
    total,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function randomString(length = 5): string {
  const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

export function nowMysql(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

export type { VercelRequest, VercelResponse, HttpError };
