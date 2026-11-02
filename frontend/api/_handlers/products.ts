import { wrapHandler } from '../_lib/auth';
import { query, queryOne } from '../_lib/db';
import { ok, bool, parseIntSafe, paginationMeta } from '../_lib/http';

export default wrapHandler(async (req, res) => {
  const q = req.query || {};
  const search = typeof q.search === 'string' ? q.search.trim() : '';
  const categorySlug = typeof q.category === 'string' ? q.category.trim() : '';
  const minPrice = q.min_price !== undefined ? Number(q.min_price) : null;
  const maxPrice = q.max_price !== undefined ? Number(q.max_price) : null;
  const inStock = bool(q.in_stock);
  const featured = bool(q.featured);
  const bestSeller = bool(q.best_seller);
  const newArrival = bool(q.new_arrival);
  const sort = typeof q.sort === 'string' ? q.sort : 'latest';
  const page = Math.max(1, parseIntSafe(q.page, 1));
  const perPage = Math.min(50, Math.max(1, parseIntSafe(q.per_page, 12)));
  const offset = (page - 1) * perPage;

  const whereClauses: string[] = ['p.is_active = 1'];
  const params: any[] = [];

  if (search) {
    whereClauses.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  if (categorySlug) {
    whereClauses.push('c.slug = ?');
    params.push(categorySlug);
  }

  if (minPrice !== null && !Number.isNaN(minPrice)) {
    whereClauses.push('p.price >= ?');
    params.push(minPrice);
  }

  if (maxPrice !== null && !Number.isNaN(maxPrice)) {
    whereClauses.push('p.price <= ?');
    params.push(maxPrice);
  }

  if (inStock) {
    whereClauses.push('p.stock > 0');
  }

  if (featured) {
    whereClauses.push('p.is_featured = 1');
  }
  if (bestSeller) {
    whereClauses.push('p.is_best_seller = 1');
  }
  if (newArrival) {
    whereClauses.push('p.is_new_arrival = 1');
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let orderSql = 'ORDER BY p.created_at DESC';
  switch (sort) {
    case 'price_asc':
      orderSql = 'ORDER BY p.price ASC';
      break;
    case 'price_desc':
      orderSql = 'ORDER BY p.price DESC';
      break;
    case 'name_asc':
      orderSql = 'ORDER BY p.name ASC';
      break;
    case 'popular':
      orderSql = 'ORDER BY p.is_best_seller DESC, p.id DESC';
      break;
    case 'latest':
    default:
      orderSql = 'ORDER BY p.created_at DESC';
      break;
  }

  const countRow = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}`,
    params
  );
  const total = Number(countRow?.total || 0);

  const productRows = await query(
    `SELECT p.*,
            c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug,
            c.description AS cat_desc, c.image AS cat_image, c.is_active AS cat_active
     FROM products p
     JOIN categories c ON c.id = p.category_id
     ${whereSql}
     ${orderSql}
     LIMIT ? OFFSET ?`,
    [...params, perPage, offset]
  );

  const productIds = productRows.map((r: any) => r.id);
  const variantsByProduct: Record<number, any[]> = {};

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const variantRows = await query(
      `SELECT * FROM product_variants
       WHERE product_id IN (${placeholders}) AND is_active = 1
       ORDER BY price_adjustment ASC, id ASC`,
      productIds
    );
    for (const v of variantRows) {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
      variantsByProduct[v.product_id].push({
        id: v.id,
        product_id: v.product_id,
        variant_name: v.variant_name,
        sku: v.sku,
        price_adjustment: Number(v.price_adjustment),
        stock: Number(v.stock),
        is_active: !!v.is_active,
      });
    }
  }

  const items = productRows.map((p: any) => {
    const price = Number(p.price);
    const salePrice = p.sale_price !== null ? Number(p.sale_price) : null;
    const effectivePrice = salePrice !== null && salePrice > 0 && salePrice < price ? salePrice : price;
    const activeVariants = variantsByProduct[p.id] || [];

    return {
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      ingredients: p.ingredients,
      serving_suggestion: p.serving_suggestion,
      price,
      sale_price: salePrice,
      effective_price: effectivePrice,
      stock: Number(p.stock),
      sku: p.sku,
      weight: Number(p.weight),
      image: p.image,
      is_active: !!p.is_active,
      is_featured: !!p.is_featured,
      is_best_seller: !!p.is_best_seller,
      is_new_arrival: !!p.is_new_arrival,
      created_at: p.created_at,
      category: {
        id: p.cat_id,
        name: p.cat_name,
        slug: p.cat_slug,
        description: p.cat_desc,
        image: p.cat_image,
        is_active: !!p.cat_active,
      },
      active_variants: activeVariants,
      variants: activeVariants,
    };
  });

  ok(res, items, { meta: paginationMeta(page, perPage, total) });
});
