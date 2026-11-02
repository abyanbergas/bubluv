import { wrapHandler } from '../_lib/auth.js';
import { query, queryOne } from '../_lib/db.js';
import { ok, parseIntSafe } from '../_lib/http.js';
import { attachOrderRelations } from '../_lib/orders.js';

export default wrapHandler(
  async (req, res) => {
    if (req.method !== 'GET') {
      return res.status(405).json({ success: false, message: 'Method not allowed.' });
    }

    const q = req.query || {};
    const search = typeof q.search === 'string' ? q.search.trim() : '';
    const orderStatus = typeof q.order_status === 'string' ? q.order_status : '';
    const paymentStatus = typeof q.payment_status === 'string' ? q.payment_status : '';
    const dateFrom = typeof q.date_from === 'string' ? q.date_from : '';
    const dateTo = typeof q.date_to === 'string' ? q.date_to : '';
    const page = Math.max(1, parseIntSafe(q.page, 1));
    const perPage = 15;
    const offset = (page - 1) * perPage;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (search) {
      whereClauses.push('(order_number LIKE ? OR recipient_name LIKE ? OR phone LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (orderStatus) {
      whereClauses.push('order_status = ?');
      params.push(orderStatus);
    }
    if (paymentStatus) {
      whereClauses.push('payment_status = ?');
      params.push(paymentStatus);
    }
    if (dateFrom) {
      whereClauses.push('created_at >= ?');
      params.push(`${dateFrom} 00:00:00`);
    }
    if (dateTo) {
      whereClauses.push('created_at <= ?');
      params.push(`${dateTo} 23:59:59`);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await queryOne<{ total: number }>(
      `SELECT COUNT(*) AS total FROM orders ${whereSql}`,
      params
    );
    const total = Number(countRow?.total || 0);

    const orders = await query<any>(
      `SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );

    const data = [];
    for (const order of orders) {
      data.push(await attachOrderRelations(order));
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
