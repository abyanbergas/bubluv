import { wrapHandler } from '../../_lib/auth';
import { query, queryOne, execute } from '../../_lib/db';
import { ok, fail, slugify, bool } from '../../_lib/http';

export default wrapHandler(
  async (req, res) => {
    if (req.method === 'GET') {
      const categories = await query<any>(
        `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS products_count
         FROM categories c
         ORDER BY c.created_at DESC, c.id DESC`
      );
      const data = categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        is_active: !!c.is_active,
        products_count: Number(c.products_count),
        created_at: c.created_at,
      }));
      return ok(res, data);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const name = (body.name || '').trim();
      const description = body.description ? String(body.description).trim() : null;
      const isActive = body.is_active !== undefined ? bool(body.is_active, true) : true;

      if (!name) return fail(res, 'Nama kategori wajib diisi.', 422);

      const baseSlug = slugify(name);
      let slug = baseSlug;
      let counter = 1;
      while (await queryOne('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug])) {
        slug = `${baseSlug}-${counter++}`;
      }

      const result = await execute(
        'INSERT INTO categories (name, slug, description, is_active) VALUES (?, ?, ?, ?)',
        [name, slug, description, isActive ? 1 : 0]
      );

      const created = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [result.insertId]);
      return res.status(201).json({
        success: true,
        message: 'Kategori berhasil ditambahkan.',
        data: {
          ...created,
          is_active: !!created.is_active,
          products_count: 0,
        },
      });
    }

    return fail(res, 'Method not allowed.', 405);
  },
  { roles: ['admin'] }
);
