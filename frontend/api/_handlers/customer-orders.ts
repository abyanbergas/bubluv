import { wrapHandler } from '../_lib/auth.js';
import { query } from '../_lib/db.js';
import { ok } from '../_lib/http.js';

export default wrapHandler(
  async (req, res) => {
    const userId = req.user!.id;

    const orders = await query<any>(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    const data = [];
    for (const order of orders) {
      const items = await query<any>('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [order.id]);
      const payments = await query<any>('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC', [order.id]);
      data.push({
        ...order,
        subtotal: Number(order.subtotal),
        shipping_cost: Number(order.shipping_cost),
        discount_amount: Number(order.discount_amount),
        total: Number(order.total),
        items: items.map((i) => ({
          ...i,
          unit_price: Number(i.unit_price),
          subtotal: Number(i.subtotal),
          quantity: Number(i.quantity),
        })),
        payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
      });
    }

    ok(res, data);
  },
  { roles: ['admin', 'customer'] }
);
