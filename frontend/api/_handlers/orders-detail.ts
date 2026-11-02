import { wrapHandler, getTokenFromHeader, verifyToken } from '../_lib/auth.js';
import { queryOne, query } from '../_lib/db.js';
import { fail, ok } from '../_lib/http.js';

export default wrapHandler(async (req, res) => {
  if (req.method !== 'GET') {
    return fail(res, 'Method not allowed.', 405);
  }

  const orderNumber = req.query.orderNumber as string;

  const order = await queryOne<any>(
    'SELECT * FROM orders WHERE order_number = ? LIMIT 1',
    [orderNumber]
  );

  if (!order) {
    return fail(res, 'Pesanan tidak ditemukan.', 404);
  }

  let tokenUser: any = null;
  const token = getTokenFromHeader(req);
  if (token) {
    try {
      tokenUser = verifyToken(token);
    } catch {
      tokenUser = null;
    }
  }

  if (tokenUser && order.user_id && tokenUser.role !== 'admin' && order.user_id !== tokenUser.id) {
    return fail(res, 'Anda tidak memiliki akses ke pesanan ini.', 403);
  }

  const items = await query<any>('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [order.id]);
  const payments = await query<any>('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC', [order.id]);
  const histories = await query<any>(
    'SELECT * FROM order_status_histories WHERE order_id = ? ORDER BY id ASC',
    [order.id]
  );

  const itemsWithProduct = [];
  for (const item of items) {
    const product = item.product_id
      ? await queryOne<any>('SELECT * FROM products WHERE id = ? LIMIT 1', [item.product_id])
      : null;
    itemsWithProduct.push({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sku: item.sku,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      subtotal: Number(item.subtotal),
      product: product
        ? {
            id: product.id,
            category_id: product.category_id,
            name: product.name,
            slug: product.slug,
            description: product.description,
            price: Number(product.price),
            sale_price: product.sale_price !== null ? Number(product.sale_price) : null,
            stock: Number(product.stock),
            sku: product.sku,
            weight: Number(product.weight),
            image: product.image,
            is_active: !!product.is_active,
          }
        : null,
    });
  }

  const data = {
    id: order.id,
    user_id: order.user_id,
    order_number: order.order_number,
    recipient_name: order.recipient_name,
    phone: order.phone,
    shipping_address: order.shipping_address,
    shipping_method: order.shipping_method,
    subtotal: Number(order.subtotal),
    shipping_cost: Number(order.shipping_cost),
    discount_amount: Number(order.discount_amount),
    total: Number(order.total),
    payment_method: order.payment_method,
    payment_status: order.payment_status,
    order_status: order.order_status,
    notes: order.notes,
    created_at: order.created_at,
    items: itemsWithProduct,
    payments: payments.map((p) => ({ ...p, amount: Number(p.amount) })),
    status_histories: histories,
  };

  ok(res, data);
});
