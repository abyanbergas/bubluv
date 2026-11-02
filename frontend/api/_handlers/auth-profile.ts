import { wrapHandler, hashPassword } from '../_lib/auth.js';
import { execute, queryOne } from '../_lib/db.js';
import { fail } from '../_lib/http.js';

export default wrapHandler(
  async (req, res) => {
    if (req.method !== 'PUT' && req.method !== 'POST') {
      return fail(res, 'Method not allowed.', 405);
    }

    const id = req.user!.id;
    const body = (req.body || {}) as {
      name?: string;
      phone?: string;
      password?: string;
      password_confirmation?: string;
    };

    const name = (body.name || '').trim();
    const phone = body.phone !== undefined ? (body.phone || '').trim() || null : undefined;
    const password = body.password || '';
    const confirmation = body.password_confirmation || '';

    const errors: Record<string, string[]> = {};
    if (!name) errors.name = ['Nama lengkap wajib diisi.'];
    if (password) {
      if (password.length < 6) errors.password = ['Kata sandi minimal 6 karakter.'];
      else if (password !== confirmation) errors.password = ['Konfirmasi kata sandi tidak cocok.'];
    }

    if (Object.keys(errors).length) {
      return res.status(422).json({
        success: false,
        message: Object.values(errors)[0][0],
        errors,
      });
    }

    if (password) {
      const passwordHash = await hashPassword(password);
      await execute('UPDATE users SET name = ?, phone = ?, password = ? WHERE id = ?', [
        name,
        phone,
        passwordHash,
        id,
      ]);
    } else {
      await execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone, id]);
    }

    const updated = await queryOne<{ id: number; name: string; email: string; role: string; phone: string | null }>(
      'SELECT id, name, email, role, phone FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: updated,
    });
  },
  { roles: ['admin', 'customer'] }
);
