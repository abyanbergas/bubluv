import { wrapHandler } from '../_lib/auth.js';
import { queryOne, execute } from '../_lib/db.js';
import { fail, ok, bool } from '../_lib/http.js';

export default wrapHandler(
  async (req, res) => {
    const id = Number(req.query.id);
    if (!id || Number.isNaN(id)) return fail(res, 'ID kategori tidak valid.', 400);

    const category = await queryOne<any>('SELECT * FROM categories WHERE id = ? LIMIT 1', [id]);
    if (!category) return fail(res, 'Kategori tidak ditemukan.', 404);

    if (req.method === 'PUT') {
      const body = req.body || {};
      const name = (body.name || '').trim();
      const description = body.description ? String(body.description).trim() : null;
      const image = body.image !== undefined ? (body.image ? String(body.image).trim() : null) : category.image;
      const isActive = body.is_active !== undefined ? bool(body.is_active, true) : true;

      if (!name) return fail(res, 'Nama kategori wajib diisi.', 422);

      await execute(
        'UPDATE categories SET name = ?, description = ?, image = ?, is_active = ? WHERE id = ?',
        [name, description, image, isActive ? 1 : 0, id]
      );

      const updated = await queryOne<any>('SELECT * FROM categories WHERE id = ?', [id]);
      const prodCount = await queryOne<any>(
        'SELECT COUNT(*) AS c FROM products WHERE category_id = ?',
        [id]
      );

      return ok(
        res,
        {
          ...updated,
          is_active: !!updated.is_active,
          products_count: Number(prodCount?.c || 0),
        },
        { message: 'Kategori berhasil diperbarui.' }
      );
    }

    if (req.method === 'DELETE') {
      const prodCount = await queryOne<any>(
        'SELECT COUNT(*) AS c FROM products WHERE category_id = ?',
        [id]
      );
      if (Number(prodCount?.c || 0) > 0) {
        return res.status(422).json({
          success: false,
          message:
            'Kategori tidak dapat dihapus karena masih memiliki produk terkait. Nonaktifkan kategori atau pindahkan produk terlebih dahulu.',
        });
      }

      await execute('DELETE FROM categories WHERE id = ?', [id]);
      return res.status(200).json({
        success: true,
        message: 'Kategori berhasil dihapus.',
      });
    }

    return fail(res, 'Method not allowed.', 405);
  },
  { roles: ['admin'] }
);
