import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool, queryOne } from './db.js';
import { fail, setCors, handleOptions, handleError } from './http.js';

export interface JwtUser {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
}

export function getTokenFromHeader(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 16) {
    throw new Error(
      'JWT_SECRET belum dikonfigurasi dengan benar. Set JWT_SECRET (minimal 16 karakter) di Environment Variables.'
    );
  }
  return secret;
}

export function signToken(user: JwtUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyToken(token: string): JwtUser {
  return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as JwtUser;
}

export interface RequestWithUser extends VercelRequest {
  user?: JwtUser;
}

export type Handler = (
  req: RequestWithUser,
  res: VercelResponse
) => Promise<void> | void;

export function authMiddleware(roles: string[] = []): (req: RequestWithUser) => JwtUser {
  return (req: RequestWithUser): JwtUser => {
    const token = getTokenFromHeader(req);
    if (!token) {
      const e: any = new Error('Token tidak ditemukan.');
      e.status = 401;
      throw e;
    }
    try {
      const user = verifyToken(token);
      if (roles.length && !roles.includes(user.role)) {
        const e: any = new Error('Akses ditolak. Halaman atau aksi ini hanya dapat diakses oleh Admin BubLuv.');
        e.status = 403;
        throw e;
      }
      req.user = user;
      return user;
    } catch (err: any) {
      if (err.status) throw err;
      const e: any = new Error('Token tidak valid atau telah kedaluwarsa.');
      e.status = 401;
      throw e;
    }
  };
}

export function wrapHandler(
  handler: (req: RequestWithUser, res: VercelResponse) => Promise<any> | any,
  options: { roles?: string[] } = {}
): (req: VercelRequest, res: VercelResponse) => Promise<void | VercelResponse> {
  const guard = options.roles?.length ? authMiddleware(options.roles) : null;
  return async (req: VercelRequest, res: VercelResponse) => {
    setCors(res);
    if (handleOptions(req, res)) return;
    try {
      if (guard) {
        try {
          guard(req as RequestWithUser);
        } catch (authErr: any) {
          return fail(res, authErr.message, authErr.status || 401);
        }
      }
      await handler(req as RequestWithUser, res);
    } catch (err: any) {
      if (err.status && err.message) {
        return fail(res, err.message, err.status);
      }
      // mysql2 errors (ECONNREFUSED, ER_ACCESS_DENIED_ERROR, dst.) & error tak terduga
      if (err?.code && typeof err.code === 'string') {
        console.error('[API ERROR]', err.code, err.message);
        return fail(res, 'Gagal terhubung ke database. Periksa konfigurasi environment variables.', 500);
      }
      console.error('[API ERROR]', err);
      return res.status(500).json({
        success: false,
        message: process.env.NODE_ENV !== 'production' && err instanceof Error
          ? err.message
          : 'Terjadi kesalahan pada server.',
      });
    }
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export interface DbUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string | null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>('SELECT id, name, email, password, role, phone FROM users WHERE email = :email LIMIT 1', { email });
}

export async function ensurePool(): Promise<void> {
  getPool();
}
