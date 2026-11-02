import { wrapHandler } from '../_lib/auth';

export default wrapHandler(
  async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logout berhasil.',
    });
  },
  { roles: ['admin', 'customer'] }
);
