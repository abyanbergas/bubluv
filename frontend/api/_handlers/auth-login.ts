import { wrapHandler, findUserByEmail, verifyPassword, signToken, type JwtUser } from '../_lib/auth.js';
import { fail, ok } from '../_lib/http.js';

export default wrapHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return fail(res, 'Method not allowed.', 405);
  }

  const body = (req.body || {}) as { email?: string; password?: string };
  const email = (body.email || '').trim();
  const password = body.password || '';

  const errors: Record<string, string[]> = {};
  if (!email) errors.email = ['Email wajib diisi.'];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = ['Format email tidak valid.'];
  if (!password) errors.password = ['Kata sandi wajib diisi.'];

  if (Object.keys(errors).length) {
    return res.status(422).json({
      success: false,
      message: errors.email?.[0] || errors.password?.[0],
      errors,
    });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(422).json({
      success: false,
      message: 'Email atau kata sandi yang Anda masukkan salah.',
      errors: { email: ['Email atau kata sandi yang Anda masukkan salah.'] },
    });
  }

  const payload: JwtUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
  };
  const token = signToken(payload);

  res.status(200).json({
    success: true,
    message: 'Login berhasil.',
    user: payload,
    token,
  });
});
