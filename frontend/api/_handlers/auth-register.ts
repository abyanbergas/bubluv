import { wrapHandler, findUserByEmail, hashPassword, signToken, type JwtUser } from '../_lib/auth.js';
import { execute } from '../_lib/db.js';
import { fail } from '../_lib/http.js';

export default wrapHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return fail(res, 'Method not allowed.', 405);
  }

  const body = (req.body || {}) as {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    phone?: string;
  };

  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const confirmation = body.password_confirmation || '';
  const phone = (body.phone || '').trim() || null;

  const errors: Record<string, string[]> = {};
  if (!name) errors.name = ['Nama lengkap wajib diisi.'];
  if (!email) errors.email = ['Email wajib diisi.'];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Format email tidak valid.'];
  if (!password) errors.password = ['Kata sandi wajib diisi.'];
  else if (password.length < 6) errors.password = ['Kata sandi minimal 6 karakter.'];
  else if (password !== confirmation) errors.password = ['Konfirmasi kata sandi tidak cocok.'];

  if (Object.keys(errors).length) {
    return res.status(422).json({
      success: false,
      message: Object.values(errors)[0][0],
      errors,
    });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(422).json({
      success: false,
      message: 'Email sudah terdaftar.',
      errors: { email: ['Email sudah terdaftar.'] },
    });
  }

  const passwordHash = await hashPassword(password);
  const result = await execute(
    `INSERT INTO users (name, email, password, role, phone)
     VALUES (?, ?, ?, 'customer', ?)`,
    [name, email, passwordHash, phone]
  );

  const payload: JwtUser = {
    id: result.insertId,
    name,
    email,
    role: 'customer',
    phone,
  };
  const token = signToken(payload);

  res.status(201).json({
    success: true,
    message: 'Registrasi berhasil. Selamat datang di BubLuv!',
    user: payload,
    token,
  });
});
