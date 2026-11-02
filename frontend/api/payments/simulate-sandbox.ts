import { wrapHandler } from '../_lib/auth';
import { withTransaction } from '../_lib/db';
import { fail } from '../_lib/http';

export default wrapHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return fail(res, 'Method not allowed.', 405);
  }

  const { order_number, status, transaction_reference } = req.body || {};
  if (!order_number) return fail(res, 'Nomor pesanan wajib diisi.', 422);
  if (!['settlement', 'pending', 'failed', 'expired'].includes(status)) {
    return fail(res, 'Status simulasi tidak valid.', 422);
  }

  const result = await withTransaction(async (conn) => {
    const [orders] = await conn.query<any[]>('SELECT * FROM orders WHERE order_number = ? LIMIT 1', [order_number]);
    const order = orders[0];
    if (!order) {
      const e: any = new Error('Pesanan tidak ditemukan.');
      e.status = 404;
      throw e;
    }

    const [payments] = await conn.query<any[]>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1',
      [order.id]
    );
    const payment = payments[0];
    const trxRef = transaction_reference || `GW-SIM-${Date.now()}`;

    if (status === 'settlement') {
      if (order.payment_status === 'paid') {
        return {
          idempotent: true,
          message: 'Pembayaran sudah terverifikasi sebelumnya.',
          data: order,
        };
      }

      const newOrderStatus = order.order_status === 'pending' ? 'confirmed' : order.order_status;
      await conn.query('UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?', [
        'paid',
        newOrderStatus,
        order.id,
      ]);

      if (payment) {
        await conn.query(
          'UPDATE payments SET payment_status = ?, paid_at = NOW(), transaction_reference = ? WHERE id = ?',
          ['paid', trxRef, payment.id]
        );
      }

      await conn.query(
        `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
         VALUES (?, 'system', 'pending', 'confirmed', 'Pembayaran gateway terkonfirmasi sukses via Sandbox.')`,
        [order.id]
      );

      return {
        message: `Status pembayaran berhasil diperbarui menjadi ${status}.`,
        data: {
          order_number: order.order_number,
          order_status: newOrderStatus,
          payment_status: 'paid',
        },
      };
    }

    if (status === 'failed' || status === 'expired') {
      await conn.query('UPDATE orders SET payment_status = ?, order_status = ? WHERE id = ?', [
        status,
        'cancelled',
        order.id,
      ]);

      if (payment) {
        await conn.query('UPDATE payments SET payment_status = ? WHERE id = ?', [status, payment.id]);
      }

      const [items] = await conn.query<any[]>('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      for (const item of items) {
        if (item.product_id) {
          await conn.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }

      await conn.query(
        `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
         VALUES (?, 'system', 'pending', 'cancelled', ?)`,
        [order.id, `Transaksi ${status} dari payment gateway.`]
      );

      return {
        message: `Status pembayaran berhasil diperbarui menjadi ${status}.`,
        data: {
          order_number: order.order_number,
          order_status: 'cancelled',
          payment_status: status,
        },
      };
    }

    return {
      message: `Status pembayaran berhasil diperbarui menjadi ${status}.`,
      data: {
        order_number: order.order_number,
        order_status: order.order_status,
        payment_status: status,
      },
    };
  });

  res.status(200).json({
    success: true,
    message: result.message,
    data: result.data,
  });
});
