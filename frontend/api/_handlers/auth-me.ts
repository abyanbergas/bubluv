import { wrapHandler } from '../_lib/auth.js';
import { queryOne } from '../_lib/db.js';

export default wrapHandler(
  async (req, res) => {
    const id = req.user!.id;
    const user = await queryOne<{ id: number; name: string; email: string; role: string; phone: string | null }>(
      'SELECT id, name, email, role, phone FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    if (!user) {
      return res.status(401).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    res.status(200).json({ success: true, user });
  },
  { roles: ['admin', 'customer'] }
);
