import { wrapHandler } from '../_lib/auth';
import { query } from '../_lib/db';
import { ok } from '../_lib/http';

export default wrapHandler(async (_req, res) => {
  const rows = await query<{ setting_key: string; setting_value: string | null }>(
    'SELECT setting_key, setting_value FROM store_settings'
  );
  const data: Record<string, string | null> = {};
  for (const row of rows) data[row.setting_key] = row.setting_value;
  ok(res, data);
});
