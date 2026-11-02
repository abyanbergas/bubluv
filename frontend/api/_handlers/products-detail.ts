import { wrapHandler } from '../_lib/auth.js';
import { query, queryOne } from '../_lib/db.js';
import { fail, ok } from '../_lib/http.js';

async function variantsForProduct(productId: number, onlyActive = false) {
  const rows = await query(
    `SELECT * FROM product_variants
     WHERE product_id = ?${onlyActive ? ' AND is_active = 1' : ''}
     ORDER BY price_adjustment ASC, id ASC`,
    [productId]
  );
  return rows.map((v: any) => ({
    id: v.id,
    product_id: v.product_id,
    variant_name: v.variant_name,
    sku: v.sku,
    price_adjustment: Number(v.price_adjustment),
    stock: Number(v.stock),
    is_active: !!v.is_active,
  }));
}

function mapProduct(p: any, category: any, variants: any[], images: any[]) {
  const price = Number(p.price);
  const salePrice = p.sale_price !== null ? Number(p.sale_price) : null;
  const effectivePrice = salePrice !== null && salePrice > 0 && salePrice < price ? salePrice : price;
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
    category,
    active_variants: variants,
    variants,
    images,
  };
}

export default wrapHandler(async (req, res) => {
  const slug = req.query.slug as string;

  const row = await queryOne<any>(
    `SELECT p.*,
            c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug,
            c.description AS cat_desc, c.image AS cat_image, c.is_active AS cat_active
     FROM products p
     JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.is_active = 1
     LIMIT 1`,
    [slug]
  );

  if (!row) {
    return fail(res, 'Produk tidak ditemukan.', 404);
  }

  const category = {
    id: row.cat_id,
    name: row.cat_name,
    slug: row.cat_slug,
    description: row.cat_desc,
    image: row.cat_image,
    is_active: !!row.cat_active,
  };

  const variants = await variantsForProduct(row.id, true);

  const imageRows = await query<any>(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [row.id]
  );
  const images = imageRows.map((i) => ({
    id: i.id,
    product_id: i.product_id,
    image_path: i.image_path,
    sort_order: Number(i.sort_order),
  }));

  const product = mapProduct(row, category, variants, images);

  const relatedRows = await query<any>(
    `SELECT * FROM products
     WHERE category_id = ? AND id != ? AND is_active = 1
     ORDER BY created_at DESC
     LIMIT 4`,
    [row.category_id, row.id]
  );

  const related = [];
  for (const r of relatedRows) {
    const rv = await variantsForProduct(r.id, true);
    related.push({
      id: r.id,
      category_id: r.category_id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: Number(r.price),
      sale_price: r.sale_price !== null ? Number(r.sale_price) : null,
      stock: Number(r.stock),
      sku: r.sku,
      weight: Number(r.weight),
      image: r.image,
      is_active: !!r.is_active,
      is_featured: !!r.is_featured,
      is_best_seller: !!r.is_best_seller,
      is_new_arrival: !!r.is_new_arrival,
      category,
      active_variants: rv,
      variants: rv,
    });
  }

  ok(res, product, { related });
});
