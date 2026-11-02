import { wrapHandler } from '../../../_lib/auth';
import { queryOne, withTransaction } from '../../../_lib/db';
import { fail } from '../../../_lib/http';
import { mapOrderBase, mapPayment } from '../../../_lib/orders';

export default wrapHandler(
  async (req, res) => {
    if (req.method !== 'PUT') {
      return fail(res, 'Method not allowed.', 405);
    }

    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) return fail(res, 'ID pembayaran tidak valid.', 400);

    const body = req.body || {};
    const action = body.action;
    const notes = body.notes ? String(body.notes).trim() : null;

    if (!['approve', 'reject', 'collect_cod'].includes(action)) {
      return fail(res, 'Aksi verifikasi tidak valid.', 422);
    }

    const payment = await queryOne<any>('SELECT * FROM payments WHERE id = ? LIMIT 1', [id]);
    if (!payment) return fail(res, 'Data pembayaran tidak ditemukan.', 404);

    const order = await queryOne<any>('SELECT * FROM orders WHERE id = ? LIMIT 1', [payment.order_id]);
    if (!order) return fail(res, 'Pesanan terkait tidak ditemukan.', 404);

    let message = '';

    await withTransaction(async (conn) => {
      if (action === 'approve') {
        await conn.query("UPDATE payments SET payment_status = 'paid', paid_at = NOW() WHERE id = ?", [id]);

        const newOrderStatus = order.order_status === 'pending' ? 'confirmed' : order.order_status;
        await conn.query('UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?', [
          'paid',
          newOrderStatus,
          order.id,
        ]);

        await conn.query(
          `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
           VALUES (?, 'admin', ?, ?, ?)`,
          [order.id, order.order_status, newOrderStatus, notes || 'Bukti transfer berhasil diverifikasi oleh Admin. Pembayaran dinyatakan SAH.']
        );

        message = 'Pembayaran transfer bank berhasil diverifikasi dan disetujui.';
      } else if (action === 'collect_cod') {
        await conn.query("UPDATE payments SET payment_status = 'paid', paid_at = NOW() WHERE id = ?", [id]);
        await conn.query("UPDATE orders SET payment_status = 'paid' WHERE id = ?", [order.id]);

        await conn.query(
          `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
           VALUES (?, 'admin', ?, ?, ?)`,
          [order.id, order.order_status, order.order_status, notes || 'Pembayaran tunai di tempat (COD) telah berhasil diterima/dikumpulkan.']
        );

        message = 'Pembayaran COD berhasil ditandai sebagai telah diterima.';
      } else {
        await conn.query("UPDATE payments SET payment_status = 'failed' WHERE id = ?", [id]);
        await conn.query("UPDATE orders SET payment_status = 'failed' WHERE id = ?", [order.id]);

        await conn.query(
          `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
           VALUES (?, 'admin', ?, ?, ?)`,
          [order.id, order.order_status, order.order_status, notes || 'Bukti pembayaran ditolak oleh Admin karena data tidak sesuai.']
        );

        message = 'Bukti pembayaran ditolak.';
      }
    });

    const freshPayment = await queryOne<any>('SELECT * FROM payments WHERE id = ?', [id]);
    const freshOrder = await queryOne<any>('SELECT * FROM orders WHERE id = ?', [order.id]);

    return res.status(200).json({
      success: true,
      message,
      data: {
        ...mapPayment(freshPayment),
        order: freshOrder ? mapOrderBase(freshOrder) : null,
      },
    });
  },
  { roles: ['admin'] }
);
