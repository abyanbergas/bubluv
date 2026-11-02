import { wrapHandler } from '../_lib/auth.js';
import { withTransaction, queryOne } from '../_lib/db.js';
import { fail } from '../_lib/http.js';
import { parseMultipart, toDataUri } from '../_lib/multipart.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default wrapHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return fail(res, 'Method not allowed.', 405);
  }

  const orderNumber = req.query.orderNumber as string;

  let parsed;
  try {
    parsed = await parseMultipart(req);
  } catch (err: any) {
    return res.status(err.status || 422).json({
      success: false,
      message: err.message || 'Gagal membaca file unggahan.',
    });
  }

  const file = parsed.files['payment_proof'];
  if (!file) {
    return res.status(422).json({
      success: false,
      message: 'File bukti transfer tidak ditemukan.',
    });
  }

  const order = await queryOne<any>('SELECT * FROM orders WHERE order_number = ? LIMIT 1', [orderNumber]);
  if (!order) {
    return fail(res, 'Pesanan tidak ditemukan.', 404);
  }

  const proofDataUri = toDataUri(file);

  await withTransaction(async (conn) => {
    const [paymentRows] = await conn.query<any[]>(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1',
      [order.id]
    );
    const payment = paymentRows[0];

    if (payment) {
      await conn.query(
        `UPDATE payments SET payment_proof = ?, payment_status = 'pending_verification' WHERE id = ?`,
        [proofDataUri, payment.id]
      );
    }

    await conn.query(`UPDATE orders SET payment_status = 'pending_verification' WHERE id = ?`, [order.id]);

    await conn.query(
      `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
       VALUES (?, 'customer', ?, ?, 'Bukti transfer diunggah oleh pelanggan, menunggu verifikasi admin.')`,
      [order.id, order.order_status, order.order_status]
    );
  });

  res.status(200).json({
    success: true,
    message: 'Bukti pembayaran berhasil diunggah. Tim admin BubLuv akan segera memverifikasinya.',
    proof_url: proofDataUri,
  });
});
