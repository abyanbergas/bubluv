import { query, queryOne } from './db.js';

export async function mapAdminProduct(p: any) {
  const category = await queryOne<any>('SELECT * FROM categories WHERE id = ? LIMIT 1', [p.category_id]);
  const variants = await query<any>(
    'SELECT * FROM product_variants WHERE product_id = ? ORDER BY price_adjustment ASC, id ASC',
    [p.id]
  );
  const price = Number(p.price);
  const salePrice = p.sale_price !== null ? Number(p.sale_price) : null;
  const effectivePrice = salePrice !== null && salePrice > 0 && salePrice < price ? salePrice : price;

  const mappedVariants = variants.map((v) => ({
    id: v.id,
    product_id: v.product_id,
    variant_name: v.variant_name,
    sku: v.sku,
    price_adjustment: Number(v.price_adjustment),
    stock: Number(v.stock),
    is_active: !!v.is_active,
  }));

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
    category: category
      ? {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          is_active: !!category.is_active,
        }
      : null,
    variants: mappedVariants,
    active_variants: mappedVariants.filter((v) => v.is_active),
  };
}
