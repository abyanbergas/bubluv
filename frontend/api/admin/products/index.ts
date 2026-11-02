import { wrapHandler } from '../../_lib/auth';
import { query, queryOne, withTransaction } from '../../_lib/db';
import { ok, paginationMeta, parseIntSafe, bool, slugify, fail } from '../../_lib/http';
import { parseMultipart, parseVariantsFromFields, toDataUri } from '../../_lib/multipart';
import { mapAdminProduct } from '../../_lib/products';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default wrapHandler(
  async (req, res) => {
    if (req.method === 'GET') {
      const q = req.query || {};
      const search = typeof q.search === 'string' ? q.search.trim() : '';
      const categoryId = q.category_id ? Number(q.category_id) : null;
      const status = typeof q.status === 'string' ? q.status : '';
      const page = Math.max(1, parseIntSafe(q.page, 1));
      const perPage = 15;
      const offset = (page - 1) * perPage;

      const whereClauses: string[] = [];
      const params: any[] = [];

      if (search) {
        whereClauses.push('(p.name LIKE ? OR p.sku LIKE ?)');
        const s = `%${search}%`;
        params.push(s, s);
      }

      if (categoryId) {
        whereClauses.push('p.category_id = ?');
        params.push(categoryId);
      }

      if (status === 'active') {
        whereClauses.push('p.is_active = 1');
      } else if (status === 'inactive') {
        whereClauses.push('p.is_active = 0');
      }

      const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const countRow = await queryOne<{ total: number }>(
        `SELECT COUNT(*) AS total FROM products p ${whereSql}`,
        params
      );
      const total = Number(countRow?.total || 0);

      const rows = await query<any>(
        `SELECT * FROM products p ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [...params, perPage, offset]
      );

      const data = [];
      for (const p of rows) {
        data.push(await mapAdminProduct(p));
      }

      return ok(res, data, {
        meta: {
          current_page: page,
          last_page: Math.max(1, Math.ceil(total / perPage)),
          per_page: perPage,
          total,
        },
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

      let imageUri: string | null = null;
      if (file) {
        imageUri = toDataUri(file);
      }

      const product = await withTransaction(async (conn) => {
        let baseSlug = slugify(name);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
          const [exists] = await conn.query<any[]>('SELECT id FROM products WHERE slug = ? LIMIT 1', [slug]);
          if (!exists.length) break;
          slug = `${baseSlug}-${counter++}`;
        }

        const [insertRes] = await conn.query<any>(
          `INSERT INTO products
            (category_id, name, slug, description, ingredients, serving_suggestion, price, sale_price, stock, sku, weight, image, is_active, is_featured, is_best_seller, is_new_arrival)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            categoryId,
            name,
            slug,
            description,
            ingredients,
            servingSuggestion,
            price,
            salePrice,
            stock,
            sku,
            weight,
            imageUri,
            isActive ? 1 : 0,
            isFeatured ? 1 : 0,
            isBestSeller ? 1 : 0,
            isNewArrival ? 1 : 0,
          ]
        );

        const newId = insertRes.insertId;
        const variants = parseVariantsFromFields(f);
        for (const v of variants) {
          await conn.query(
            `INSERT INTO product_variants (product_id, variant_name, price_adjustment, stock, sku, is_active)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [newId, v.variant_name, v.price_adjustment, v.stock, v.sku]
          );
        }

        const [pRows] = await conn.query<any[]>('SELECT * FROM products WHERE id = ?', [newId]);
        return pRows[0];
      });

      const fullProduct = await mapAdminProduct(product);
      return res.status(201).json({
        success: true,
        message: 'Produk berhasil ditambahkan.',
        data: fullProduct,
      });
    }

    return fail(res, 'Method not allowed.', 405);
  },
  { roles: ['admin'] }
);
