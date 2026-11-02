import { wrapHandler } from '../_lib/auth.js';
import { query } from '../_lib/db.js';
import { ok } from '../_lib/http.js';

export default wrapHandler(async (_req, res) => {
  const rows = await query<{ setting_key: string; setting_value: string | null }>(
    'SELECT setting_key, setting_value FROM store_settings'
  );
  const data: Record<string, string | null> = {};
  for (const row of rows) data[row.setting_key] = row.setting_value;
  ok(res, data);
});
