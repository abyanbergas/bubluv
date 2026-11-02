import { wrapHandler } from '../../../_lib/auth';
import { queryOne, query } from '../../../_lib/db';
import { fail, ok } from '../../../_lib/http';
import { attachOrderRelations } from '../../../_lib/orders';

export default wrapHandler(
  async (req, res) => {
    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) return fail(res, 'ID pesanan tidak valid.', 400);

    const order = await queryOne<any>('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    if (!order) return fail(res, 'Pesanan tidak ditemukan.', 404);

    if (req.method === 'GET') {
      const data = await attachOrderRelations(order, { itemsWithProduct: true });
      const histories = await query<any>(
        'SELECT * FROM order_status_histories WHERE order_id = ? ORDER BY id ASC',
        [id]
      );
      const user = order.user_id
        ? await queryOne<any>('SELECT id, name, email, role, phone FROM users WHERE id = ?', [order.user_id])
        : null;
      return ok(res, { ...data, status_histories: histories, user });
    }

    return fail(res, 'Method not allowed.', 405);
  },
  { roles: ['admin'] }
);
