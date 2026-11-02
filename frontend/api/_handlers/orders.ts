import { wrapHandler, getTokenFromHeader, verifyToken } from '../_lib/auth.js';
import { withTransaction } from '../_lib/db.js';
import { fail, randomString } from '../_lib/http.js';

export default wrapHandler(async (req, res) => {
  if (req.method !== 'POST') {
    return fail(res, 'Method not allowed.', 405);
  }

  let user: { id: number } | null = null;
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      user = verifyToken(token);
    } catch {
      // Guest order is allowed
    }
  }

  const b = req.body || {};
  const recipientName = (b.recipient_name || '').trim();
  const phone = (b.phone || '').trim();
  const shippingAddress = (b.shipping_address || '').trim();
  const shippingMethod = (b.shipping_method || 'Reguler (2-3 Hari)').trim();
  const shippingCost = Number(b.shipping_cost ?? 0);
  const paymentMethod = (b.payment_method || '').trim();
  const notes = b.notes ? String(b.notes).trim() : null;
  const items = Array.isArray(b.items) ? b.items : [];

  const validPaymentMethods = ['manual_transfer', 'gateway_qris', 'gateway_ewallet', 'gateway_va', 'cod'];
  if (!recipientName || !phone || !shippingAddress) {
    return res.status(422).json({
      success: false,
      message: 'Mohon lengkapi nama penerima, nomor telepon, dan alamat pengiriman.',
    });
  }
  if (!validPaymentMethods.includes(paymentMethod)) {
    return res.status(422).json({
      success: false,
      message: 'Metode pembayaran tidak valid.',
    });
  }
  if (!items.length) {
    return res.status(422).json({
      success: false,
      message: 'Keranjang belanja tidak boleh kosong.',
    });
  }

  try {
    const result = await withTransaction(async (conn) => {
      let subtotal = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        const productId = Number(item.product_id);
        const variantId = item.variant_id ? Number(item.variant_id) : null;
        const qty = Math.max(1, Math.min(100, Number(item.quantity) || 1));

        const [productRows] = await conn.query<any[]>(
          'SELECT * FROM products WHERE id = ? FOR UPDATE',
          [productId]
        );
        const product = productRows[0];
        if (!product || !product.is_active) {
          const e: any = new Error(`Produk '${product?.name || productId}' sedang tidak aktif atau tidak tersedia.`);
          e.status = 422;
          throw e;
        }

        const basePrice = Number(product.price);
        const salePrice = product.sale_price !== null ? Number(product.sale_price) : null;
        let effectivePrice = salePrice !== null && salePrice > 0 && salePrice < basePrice ? salePrice : basePrice;
        let sku = product.sku;
        let variantName: string | null = null;

        if (variantId) {
          const [variantRows] = await conn.query<any[]>(
            'SELECT * FROM product_variants WHERE id = ? AND product_id = ? FOR UPDATE',
            [variantId, product.id]
          );
          const variant = variantRows[0];
          if (!variant || !variant.is_active) {
            const e: any = new Error(`Varian produk '${product.name}' tidak valid.`);
            e.status = 422;
            throw e;
          }

          effectivePrice += Number(variant.price_adjustment);
          sku = variant.sku || sku;
          variantName = variant.variant_name;

          if (Number(variant.stock) < qty) {
            const e: any = new Error(
              `Stok varian '${variant.variant_name}' untuk ${product.name} tidak mencukupi (sisa ${variant.stock}).`
            );
            e.status = 422;
            throw e;
          }

          await conn.query('UPDATE product_variants SET stock = stock - ? WHERE id = ?', [qty, variant.id]);
        } else {
          if (Number(product.stock) < qty) {
            const e: any = new Error(`Stok produk '${product.name}' tidak mencukupi (sisa ${product.stock}).`);
            e.status = 422;
            throw e;
          }
        }

        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product.id]);

        const lineSubtotal = effectivePrice * qty;
        subtotal += lineSubtotal;

        orderItemsData.push({
          product_id: product.id,
          product_name: product.name,
          variant_name: variantName,
          sku,
          unit_price: effectivePrice,
          quantity: qty,
          subtotal: lineSubtotal,
        });
      }

      const discountAmount = 0;
      const total = subtotal + shippingCost - discountAmount;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const orderNumber = `BLV-${dateStr}-${randomString(5)}`;

      const [orderRes] = await conn.query<any>(
        `INSERT INTO orders
          (user_id, order_number, recipient_name, phone, shipping_address, shipping_method, subtotal, shipping_cost, discount_amount, total, payment_method, payment_status, order_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', 'pending', ?)`,
        [
          user ? user.id : null,
          orderNumber,
          recipientName,
          phone,
          shippingAddress,
          shippingMethod,
          subtotal,
          shippingCost,
          discountAmount,
          total,
          paymentMethod,
          notes,
        ]
      );
      const orderId = orderRes.insertId;

      for (const item of orderItemsData) {
        await conn.query(
          `INSERT INTO order_items
            (order_id, product_id, product_name, variant_name, sku, unit_price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.product_name,
            item.variant_name,
            item.sku,
            item.unit_price,
            item.quantity,
            item.subtotal,
          ]
        );
      }

      let provider = 'manual';
      if (paymentMethod.startsWith('gateway_')) {
        provider = 'midtrans_sandbox';
      } else if (paymentMethod === 'cod') {
        provider = 'cod';
      }

      await conn.query(
        `INSERT INTO payments (order_id, provider, payment_method, amount, payment_status)
         VALUES (?, ?, ?, ?, 'unpaid')`,
        [orderId, provider, paymentMethod, total]
      );

      await conn.query(
        `INSERT INTO order_status_histories (order_id, changed_by, old_status, new_status, notes)
         VALUES (?, ?, NULL, 'pending', 'Pesanan berhasil dibuat.')`,
        [orderId, user ? 'customer' : 'guest']
      );

      return {
        order_number: orderNumber,
        total,
        payment_method: paymentMethod,
        payment_status: 'unpaid',
      };
    });

    res.status(201).json({
      success: true,
      message: 'Pesanan berhasil dibuat.',
      data: result,
    });
  } catch (err: any) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    throw err;
  }
});
