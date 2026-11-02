import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { CATEGORIES, PRODUCTS, SETTINGS, PRODUCT_IMAGES } from './seed-data';

const __dirname = dirname(fileURLToPath(import.meta.url));

function connectionOptions(): mysql.ConnectionOptions {
  const sslCa = process.env.DB_SSL_CA;
  const useSsl = process.env.DB_SSL === 'true' || !!sslCa;
  const options: mysql.ConnectionOptions = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  };
  if (useSsl) {
    options.ssl = {
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
      ca: sslCa || undefined,
    };
  }
  return options;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  const runMigrate = process.argv.includes('--migrate');
  const conn = await mysql.createConnection(connectionOptions());
  console.log(`Terhubung ke database: ${process.env.DB_HOST}/${process.env.DB_DATABASE}`);

  if (runMigrate) {
    console.log('Menjalankan skema (migrate.sql)...');
    const sql = readFileSync(join(__dirname, 'migrate.sql'), 'utf8');
    await conn.query(sql);
    console.log('Skema berhasil dibuat.');
  }

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'password';
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || 'password';
  const adminHash = await bcrypt.hash(adminPassword, 10);
  const customerHash = await bcrypt.hash(customerPassword, 10);

  const [users] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', ['admin@bubluv.com']);
  if ((users as any[]).length === 0) {
    await conn.query(
      `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'admin', ?)`,
      ['Admin BubLuv', 'admin@bubluv.com', adminHash, '081234567890']
    );
    console.log(`Admin dibuat: admin@bubluv.com (password: ${adminPassword})`);
  } else {
    await conn.query('UPDATE users SET password = ? WHERE email = ?', [adminHash, 'admin@bubluv.com']);
    console.log('Admin sudah ada, password disinkronkan.');
  }

  const [cust] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', ['customer@bubluv.com']);
  if ((cust as any[]).length === 0) {
    await conn.query(
      `INSERT INTO users (name, email, password, role, phone) VALUES (?, ?, ?, 'customer', ?)`,
      ['Siti Nurhaliza', 'customer@bubluv.com', customerHash, '089876543210']
    );
    console.log('Customer demo dibuat: customer@bubluv.com');
  }

  for (const [key, val] of Object.entries(SETTINGS)) {
    await conn.query(
      `INSERT INTO store_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, val]
    );
  }
  console.log(`Store settings: ${Object.keys(SETTINGS).length} entri.`);

  const categoryIds: Record<string, number> = {};
  for (const cat of CATEGORIES) {
    const slug = cat.slug || slugify(cat.name);
    await conn.query(
      `INSERT INTO categories (name, slug, description, image, is_active) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), image = VALUES(image), is_active = VALUES(is_active)`,
      [cat.name, slug, cat.description, cat.image, cat.is_active ? 1 : 0]
    );
    const [rows] = await conn.query('SELECT id FROM categories WHERE slug = ? LIMIT 1', [slug]);
    categoryIds[slug] = (rows as any[])[0].id;
  }
  console.log(`Kategori: ${CATEGORIES.length} entri.`);

  const insertedSlugs: string[] = [];
  for (const p of PRODUCTS) {
    const slug = p.slug || slugify(p.name);
    insertedSlugs.push(slug);
    const image = PRODUCT_IMAGES[slug] ?? null;
    const categoryId = categoryIds[p.category_slug];
    await conn.query(
      `INSERT INTO products
        (category_id, name, slug, description, ingredients, serving_suggestion, price, sale_price, stock, sku, weight, image, is_active, is_featured, is_best_seller, is_new_arrival)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        category_id = VALUES(category_id), name = VALUES(name), description = VALUES(description),
        ingredients = VALUES(ingredients), serving_suggestion = VALUES(serving_suggestion),
        price = VALUES(price), sale_price = VALUES(sale_price), stock = VALUES(stock), sku = VALUES(sku),
        weight = VALUES(weight), image = VALUES(image), is_active = VALUES(is_active),
        is_featured = VALUES(is_featured), is_best_seller = VALUES(is_best_seller), is_new_arrival = VALUES(is_new_arrival)`,
      [
        categoryId, p.name, slug, p.description, p.ingredients, p.serving_suggestion,
        p.price, p.sale_price, p.stock, p.sku, p.weight, image,
        p.is_active ? 1 : 0, p.is_featured ? 1 : 0, p.is_best_seller ? 1 : 0, p.is_new_arrival ? 1 : 0,
      ]
    );
  }
  console.log(`Produk: ${PRODUCTS.length} entri.`);

  const [allProducts] = await conn.query('SELECT id, sku, stock, slug FROM products');
  for (const prod of allProducts as any[]) {
    const [existing] = await conn.query('SELECT COUNT(*) AS c FROM product_variants WHERE product_id = ?', [prod.id]);
    if ((existing as any[])[0].c > 0) continue;
    await conn.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price_adjustment, stock, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
      [prod.id, 'Kemasan 500 Gram (Regular)', prod.sku, 0, Math.floor(prod.stock * 0.6)]
    );
    await conn.query(
      `INSERT INTO product_variants (product_id, variant_name, sku, price_adjustment, stock, is_active) VALUES (?, ?, ?, ?, ?, 1)`,
      [prod.id, 'Kemasan 1 Kilogram (Hemat)', (prod.sku || '').replace('-500', '-1KG'), 45000, Math.ceil(prod.stock * 0.4)]
    );
  }
  console.log('Varian produk berhasil dibuat.');

  await conn.end();
  console.log('Seed selesai.');
}

main().catch((err) => {
  console.error('Seed gagal:', err);
  process.exit(1);
});
