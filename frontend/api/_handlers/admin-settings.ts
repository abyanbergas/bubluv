import { wrapHandler } from '../_lib/auth.js';
import { query, execute } from '../_lib/db.js';
import { ok, fail } from '../_lib/http.js';

async function getAllSettings(): Promise<Record<string, string | null>> {
  const rows = await query<{ setting_key: string; setting_value: string | null }>(
    'SELECT setting_key, setting_value FROM store_settings'
  );
  const data: Record<string, string | null> = {};
  for (const row of rows) data[row.setting_key] = row.setting_value;
  return data;
}

export default wrapHandler(
  async (req, res) => {
    if (req.method === 'GET') {
      const data = await getAllSettings();
      return ok(res, data);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (typeof body !== 'object' || Array.isArray(body)) {
        return fail(res, 'Data pengaturan tidak valid.', 422);
      }

      for (const [key, value] of Object.entries(body)) {
        const val = value === null || value === undefined ? '' : String(value);
        await execute(
          `INSERT INTO store_settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          [key, val]
        );
      }

      const data = await getAllSettings();
      return res.status(200).json({
        success: true,
        message: 'Pengaturan toko berhasil disimpan.',
        data,
      });
    }

    return fail(res, 'Method not allowed.', 405);
  },
  { roles: ['admin'] }
);
