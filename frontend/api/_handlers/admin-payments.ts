import { wrapHandler } from '../_lib/auth.js';
import { query, queryOne } from '../_lib/db.js';
import { ok, parseIntSafe } from '../_lib/http.js';
import { mapOrderBase, mapPayment } from '../_lib/orders.js';

export default wrapHandler(
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed.' });
    }

    const q = req.query || {};
    const paymentStatus = typeof q.payment_status === 'string' ? q.payment_status : '';
    const paymentMethod = typeof q.payment_method === 'string' ? q.payment_method : '';
    const page = Math.max(1, parseIntSafe(q.page, 1));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (paymentStatus) {
      whereClauses.push('p.payment_status = ?');
      params.push(paymentStatus);
    }
    if (paymentMethod) {
      whereClauses.push('p.payment_method = ?');
      params.push(paymentMethod);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM payments p ${whereSql}`,
      params
    );
    const total = Number(countRow?.total || 0);

    const rows = await query<any>(
      `SELECT p.* FROM payments p ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = [];
    for (const p of rows) {
      const order = await queryOne<any>('SELECT * FROM orders WHERE id = ? LIMIT 1', [p.order_id]);
      data.push({
        ...mapPayment(p),
        order: order ? mapOrderBase(order) : null,
      });
    }

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
