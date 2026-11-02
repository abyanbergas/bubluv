import { wrapHandler } from '../_lib/auth.js';
import { queryOne, query, withTransaction } from '../_lib/db.js';
import { ok, fail, bool, slugify } from '../_lib/http.js';
import { parseMultipart, parseVariantsFromFields, toDataUri } from '../_lib/multipart.js';
import { mapAdminProduct } from '../_lib/products.js';
import { attachOrderRelations } from '../_lib/orders.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default wrapHandler(
  async (req, res) => {
    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) {
      return fail(res, 'ID produk tidak valid.', 400);
    }

    const product = await queryOne<any>('SELECT * FROM products WHERE id = ? LIMIT 1', [id]);
    if (!product) {
      return fail(res, 'Produk tidak ditemukan.', 404);
    }

    if (req.method === 'GET') {
      const images = await query<any>(
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
        [id]
      );
      const mapped = await mapAdminProduct(product);
      return ok(res, {
        ...mapped,
        images: images.map((i) => ({
          id: i.id,
          product_id: i.product_id,
          image_path: i.image_path,
          sort_order: Number(i.sort_order),
        })),
      });
    }

    if (req.method === 'POST') {
      const parsed = await parseMultipart(req);
      const f = parsed.fields;
      const file = parsed.files['image'];

      const categoryId = Number(f.category_id);
      const name = (f.name || '').trim();
      const description = f.description ? f.description.trim() : null;
      const ingredients = f.ingredients ? f.ingredients.trim() : null;
      const servingSuggestion = f.serving_suggestion ? f.serving_suggestion.trim() : null;
      const price = Number(f.price);
      const salePrice = f.sale_price !== undefined && f.sale_price !== '' ? Number(f.sale_price) : null;
      const stock = Number.parseInt(f.stock || '0', 10);
      const sku = (f.sku || '').trim() || null;
      const weight = Number.parseInt(f.weight || '500', 10);
      const isActive = bool(f.is_active, true);
      const isFeatured = bool(f.is_featured, false);
      const isBestSeller = bool(f.is_best_seller, false);
      const isNewArrival = bool(f.is_new_arrival, false);

      if (!name) return fail(res, 'Nama produk wajib diisi.', 422);
      if (!categoryId) return fail(res, 'Kategori produk wajib dipilih.', 422);
      if (Number.isNaN(price) || price < 0) return fail(res, 'Harga produk tidak valid.', 422);

      const updated = await withTransaction(async (conn) => {
        let imageCol = product.image;
        if (file) {
          imageCol = toDataUri(file);
        }

        await conn.query(
          `UPDATE products SET
            category_id = ?, name = ?, description = ?, ingredients = ?, serving_suggestion = ?,
            price = ?, sale_price = ?, stock = ?, sku = ?, weight = ?, image = ?,
            is_active = ?, is_featured = ?, is_best_seller = ?, is_new_arrival = ?
           WHERE id = ?`,
          [
            categoryId,
            name,
            description,
            ingredients,
            servingSuggestion,
            price,
            salePrice,
            stock,
            sku,
            weight,
            imageCol,
            isActive ? 1 : 0,
            isFeatured ? 1 : 0,
            isBestSeller ? 1 : 0,
            isNewArrival ? 1 : 0,
            id,
          ]
        );

        if (f['variants[0][variant_name]'] !== undefined || Object.keys(f).some((k) => k.startsWith('variants['))) {
          const variants = parseVariantsFromFields(f);
          const existingIds: number[] = [];
          for (const v of variants) {
            if (v.id) {
              await conn.query(
                `UPDATE product_variants SET variant_name = ?, price_adjustment = ?, stock = ?, sku = ? WHERE id = ? AND product_id = ?`,
                [v.variant_name, v.price_adjustment, v.stock, v.sku, v.id, id]
              );
              existingIds.push(v.id);
            } else {
              const [insertRes] = await conn.query<any>(
                `INSERT INTO product_variants (product_id, variant_name, price_adjustment, stock, sku, is_active)
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [id, v.variant_name, v.price_adjustment, v.stock, v.sku]
              );
              existingIds.push(insertRes.insertId);
            }
          }

          if (existingIds.length) {
            const placeholders = existingIds.map(() => '?').join(',');
            await conn.query(
              `DELETE FROM product_variants WHERE product_id = ? AND id NOT IN (${placeholders})`,
              [id, ...existingIds]
            );
          } else {
            await conn.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
          }
        }

        const [pRows] = await conn.query<any[]>('SELECT * FROM products WHERE id = ?', [id]);
        return pRows[0];
      });

      const fullProduct = await mapAdminProduct(updated);
      return res.status(200).json({
        success: true,
        message: 'Produk berhasil diperbarui.',
        data: fullProduct,
      });
    }

    if (req.method === 'DELETE') {
      await withTransaction(async (conn) => {
        await conn.query('DELETE FROM products WHERE id = ?', [id]);
      });
      return res.status(200).json({
        success: true,
        message: 'Produk berhasil dihapus.',
      });
    }

    return fail(res, 'Method not allowed.', 405);
  },
  { roles: ['admin'] }
);
