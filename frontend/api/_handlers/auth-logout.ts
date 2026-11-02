import { wrapHandler } from '../_lib/auth.js';

export default wrapHandler(
  async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logout berhasil.',
    });
  },
  { roles: ['admin', 'customer'] }
);
