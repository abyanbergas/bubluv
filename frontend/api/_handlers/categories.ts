import { wrapHandler } from '../_lib/auth';
import { query } from '../_lib/db';
import { ok } from '../_lib/http';

export default wrapHandler(async (_req, res) => {
  const categories = await query(
    `SELECT c.*, (
        SELECT COUNT(*) FROM products p
        WHERE p.category_id = c.id AND p.is_active = 1
      ) AS products_count
     FROM categories c
     WHERE c.is_active = 1
     ORDER BY c.id ASC`
  );

  const data = categories.map((c: any) => ({
    ...c,
    is_active: !!c.is_active,
    products_count: Number(c.products_count),
  }));

  ok(res, data);
});
