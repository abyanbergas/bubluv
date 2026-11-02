import { wrapHandler } from '../_lib/auth';
import { query, queryOne } from '../_lib/db';
import { ok } from '../_lib/http';
import { attachOrderRelations } from '../_lib/orders';

export default wrapHandler(
  async (_req, res) => {
    const totalProducts = Number(
      (await queryOne<any>('SELECT COUNT(*) AS c FROM products WHERE is_active = 1'))?.c || 0
    );
    const totalCategories = Number(
      (await queryOne<any>('SELECT COUNT(*) AS c FROM categories WHERE is_active = 1'))?.c || 0
    );
    const newOrders = Number(
      (await queryOne<any>("SELECT COUNT(*) AS c FROM orders WHERE order_status = 'pending'"))?.c || 0
    );
    const processingOrders = Number(
      (await queryOne<any>("SELECT COUNT(*) AS c FROM orders WHERE order_status = 'processing'"))?.c || 0
    );
    const totalSales = Number(
      (
        await queryOne<any>(
          "SELECT SUM(total) AS s FROM orders WHERE payment_status = 'paid' AND order_status != 'cancelled'"
        )
      )?.s || 0
    );
    const totalCustomers = Number(
      (await queryOne<any>("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'"))?.c || 0
    );

    const lowStockProducts = (
      await query<any>(
        'SELECT id, name, stock, sku, price FROM products WHERE stock <= 20 AND is_active = 1 ORDER BY stock ASC LIMIT 10'
      )
    ).map((p) => ({
      id: p.id,
      name: p.name,
      stock: Number(p.stock),
      sku: p.sku,
      price: Number(p.price),
    }));

    const recentOrdersRaw = await query<any>(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT 8'
    );
    const recentOrders = [];
    for (const r of recentOrdersRaw) {
      recentOrders.push(await attachOrderRelations(r));
    }

    const monthlySalesRaw = await query<any>(
      `SELECT
          DATE_FORMAT(created_at, '%b %Y') as month,
          DATE_FORMAT(created_at, '%Y-%m') as sort_key,
          SUM(total) as revenue,
          COUNT(*) as total_orders
       FROM orders
       WHERE payment_status = 'paid' AND order_status != 'cancelled'
       GROUP BY month, sort_key
       ORDER BY sort_key ASC
       LIMIT 6`
    );
    const monthlySales = monthlySalesRaw.map((m) => ({
      month: m.month,
      sort_key: m.sort_key,
      revenue: Number(m.revenue),
      total_orders: Number(m.total_orders),
    }));

    ok(res, {
      total_products: totalProducts,
      total_categories: totalCategories,
      new_orders: newOrders,
      processing_orders: processingOrders,
      total_sales: totalSales,
      total_customers: totalCustomers,
      low_stock_products: lowStockProducts,
      recent_orders: recentOrders,
      monthly_sales: monthlySales,
    });
  },
  { roles: ['admin'] }
);
