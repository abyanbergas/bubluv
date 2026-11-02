import { query } from './db.js';

export async function attachOrderRelations(order: any, opts: { itemsWithProduct?: boolean } = {}) {
  const items = await query<any>('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [order.id]);
  const payments = await query<any>('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC', [order.id]);

  let itemsOut: any[] = [];
  if (opts.itemsWithProduct) {
    for (const item of items) {
      const product = item.product_id
        ? (
            await query<any>('SELECT * FROM products WHERE id = ? LIMIT 1', [item.product_id])
          )[0]
        : null;
      itemsOut.push({
        ...mapOrderItem(item),
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
  } else {
    itemsOut = items.map(mapOrderItem);
  }

  return {
    ...mapOrderBase(order),
    items: itemsOut,
    payments: payments.map(mapPayment),
  };
}

export function mapOrderBase(order: any) {
  return {
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
  };
}

export function mapOrderItem(item: any) {
  return {
    id: item.id,
    order_id: item.order_id,
    product_id: item.product_id,
    product_name: item.product_name,
    variant_name: item.variant_name,
    sku: item.sku,
    unit_price: Number(item.unit_price),
    quantity: Number(item.quantity),
    subtotal: Number(item.subtotal),
  };
}

export function mapPayment(payment: any) {
  return {
    id: payment.id,
    order_id: payment.order_id,
    provider: payment.provider,
    payment_method: payment.payment_method,
    amount: Number(payment.amount),
    transaction_reference: payment.transaction_reference,
    payment_status: payment.payment_status,
    payment_proof: payment.payment_proof,
    paid_at: payment.paid_at,
    created_at: payment.created_at,
  };
}
