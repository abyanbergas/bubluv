import { wrapHandler } from '../../../_lib/auth';
import { queryOne, withTransaction } from '../../../_lib/db';
import { fail } from '../../../_lib/http';
import { attachOrderRelations } from '../../../_lib/orders';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];

export default wrapHandler(
  async (req, res) => {
    if (req.method !== 'PUT') {
      return fail(res, 'Method not allowed.', 405);
    }

    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) return fail(res, 'ID pesanan tidak valid.', 400);

    const body = req.body || {};
    const newStatus = body.order_status;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!VALID_STATUSES.includes(newStatus)) {
      return fail(res, 'Status pesanan tidak valid.', 422);
    }

    const order = await queryOne<any>('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    if (!order) return fail(res, 'Pesanan tidak ditemukan.', 404);

    const oldStatus = order.order_status;
    if (oldStatus === newStatus) {
      const full = await attachOrderRelations(order);
      return res.status(200).json({
        success: true,
        message: 'Status pesanan tidak berubah.',
        data: full,
      });
    }

    if (oldStatus === 'cancelled') {
      return res.status(422).json({
        success: false,
        message: 'Pesanan yang telah dibatalkan tidak dapat diaktifkan kembali.',
      });
    }

    if (oldStatus === 'completed' && newStatus !== 'completed') {
      return res.status(422).json({
        success: false,
        message: 'Pesanan yang telah selesai tidak dapat diubah kembali.',
      });
    }

    await withTransaction(async (conn) => {
      if (newStatus === 'cancelled') {
        const [items] = await conn.query<any[]>('SELECT * FROM order_items WHERE order_id = ?', [id]);
        for (const item of items) {
          if (item.product_id) {
            await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
          }
        }
      }

      await conn.query('UPDATE orders SET order_status = ? WHERE id = ?', [newStatus, id]);

      await conn.query(
        `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
         VALUES (?, 'admin', ?, ?, ?)`,
        [id, oldStatus, newStatus, notes || `Status diperbarui menjadi ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} oleh admin.`]
      );
    });

    const refreshed = await queryOne<any>('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
    const full = await attachOrderRelations(refreshed);

    return res.status(200).json({
      success: true,
      message: `Status pesanan berhasil diperbarui menjadi ${newStatus}.`,
      data: full,
    });
  },
  { roles: ['admin'] }
);
