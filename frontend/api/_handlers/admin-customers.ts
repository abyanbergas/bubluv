import { wrapHandler } from '../_lib/auth';
import { query, queryOne } from '../_lib/db';
import { ok, parseIntSafe } from '../_lib/http';

export default wrapHandler(
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed.' });
    }

    const q = req.query || {};
    const search = typeof q.search === 'string' ? q.search.trim() : '';
    const page = Math.max(1, parseIntSafe(q.page, 1));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    const whereClauses: string[] = ["role = 'customer'"];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM users ${whereSql}`,
      params
    );
    const total = Number(countRow?.total || 0);

    const rows = await query<any>(
      `SELECT id, name, email, role, phone, created_at,
              (SELECT COUNT(*) FROM orders WHERE orders.user_id = users.id) AS orders_count,
              (SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.user_id = users.id AND payment_status = 'paid') AS orders_sum_total
       FROM users
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      created_at: u.created_at,
      orders_count: Number(u.orders_count),
      orders_sum_total: Number(u.orders_sum_total),
    }));

    return ok(res, data, {
      meta: {
        current_page: page,
        last_page: Math.max(1, Math.ceil(total / perPage)),
        total,
      },
    });
  },
  { roles: ['admin'] }
);
