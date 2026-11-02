/* Integration test: memanggil catch-all router api/[...path].ts langsung */
import 'dotenv/config';
import { Readable } from 'node:stream';
import routerHandler from '../api/index';

function makeRes() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string | number>,
    body: null as any,
    jsonBody: null as any,
    setHeader(k: string, v: any) { this.headers[k] = v; },
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.jsonBody = data; this.body = JSON.stringify(data); return this; },
    end(data?: any) {
      if (data && !this.body) this.body = data;
      return this;
    },
  };
}

function makeReq(
  method: string,
  path: string,
  opts: { query?: Record<string, any>; body?: any; headers?: any; raw?: Buffer } = {}
) {
  const req: any = Readable.from(opts.raw ? [opts.raw] : []);
  req.method = method;
  // path param Vercel catch-all: array of segments
  const pathSegments = path.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  req.query = { path: pathSegments, ...(opts.query || {}) };
  req.headers = { ...opts.headers };
  if (opts.body !== undefined) {
    req.body = opts.body;
    if (!req.headers['content-type']) {
      req.headers['content-type'] = 'application/json';
    }
  }
  return req;
}

function buildMultipart(fields: Record<string, string>, files: { name: string; filename: string; contentType: string; data: Buffer }[] = []) {
  const boundary = '----TestBoundary' + Date.now();
  const parts: Buffer[] = [];
  for (const [k, v] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`));
  }
  for (const f of files) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\nContent-Type: ${f.contentType}\r\n\r\n`));
    parts.push(f.data);
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { body: Buffer.concat(parts), contentType: `multipart/form-data; boundary=${boundary}` };
}

async function request(
  method: string,
  path: string,
  opts: { query?: Record<string, any>; body?: any; headers?: any; raw?: Buffer } = {}
) {
  const req = makeReq(method, path, opts);
  const res: any = makeRes();
  await routerHandler(req, res);
  return { status: res.statusCode, data: res.jsonBody, headers: res.headers };
}

let passed = 0, failed = 0;
function check(name: string, cond: boolean, extra?: any) {
  if (cond) { passed++; console.log(`  PASS: ${name}`); }
  else { failed++; console.log(`  FAIL: ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); }
}

async function main() {
  console.log('== Catch-all: OPTIONS preflight check ==');
  const opt = await request('OPTIONS', 'products');
  check('status 204', opt.status === 204);
  check('CORS header ada', !!opt.headers['Access-Control-Allow-Origin']);

  console.log('== Catch-all: 404 route not found ==');
  const nf = await request('GET', 'nonexistent/route/test');
  check('status 404', nf.status === 404);

  console.log('== Catch-all: 405 method not allowed ==');
  const nallowed = await request('DELETE', 'settings');
  check('status 405', nallowed.status === 405);

  console.log('== Catch-all: Path traversal blocked ==');
  const trav = await request('GET', '../package.json');
  check('status 400', trav.status === 400);

  console.log('== Public: GET /api/settings ==');
  const settings = await request('GET', 'settings');
  check('status 200', settings.status === 200, settings);
  check('ada store_name', settings.data?.data?.store_name === 'BubLuv Official Store', settings.data);

  console.log('== Public: GET /api/categories ==');
  const cats = await request('GET', 'categories');
  check('status 200', cats.status === 200);
  check('5 kategori', Array.isArray(cats.data?.data) && cats.data.data.length === 5, cats.data);
  check('products_count ada', typeof cats.data?.data?.[0]?.products_count === 'number');

  console.log('== Public: GET /api/products ==');
  const products = await request('GET', 'products', { query: { per_page: 12 } });
  check('status 200', products.status === 200);
  check('30 produk total', products.data?.meta?.total === 30, products.data?.meta);
  check('12 per halaman', products.data?.data?.length === 12);
  const first = products.data?.data?.[0];
  check('ada category', !!first?.category?.slug);
  check('ada active_variants', Array.isArray(first?.active_variants) && first.active_variants.length === 2);
  check('effective_price', typeof first?.effective_price === 'number');

  console.log('== Public: GET /api/products?search=matcha ==');
  const searchRes = await request('GET', 'products', { query: { search: 'matcha' } });
  check('status 200', searchRes.status === 200);
  check('hasil >= 2', (searchRes.data?.meta?.total || 0) >= 2, searchRes.data?.meta);

  console.log('== Public: GET /api/products?category=tea-series ==');
  const catFilter = await request('GET', 'products', { query: { category: 'tea-series' } });
  check('5 produk tea-series', catFilter.data?.meta?.total === 5, catFilter.data?.meta);

  console.log('== Public: GET /api/products?best_seller=true ==');
  const best = await request('GET', 'products', { query: { best_seller: 'true' } });
  check('best seller > 5', (best.data?.meta?.total || 0) > 5, best.data?.meta);

  console.log('== Public: GET /api/products/{slug} ==');
  const detail = await request('GET', 'products/bubluv-matcha-latte');
  check('status 200', detail.status === 200, detail);
  check('ada related', Array.isArray(detail.data?.related));
  check('sale_price 60000', detail.data?.data?.sale_price === 60000, detail.data?.data?.sale_price);

  console.log('== Public: GET /api/products/{slug} (invalid) ==');
  const notFound = await request('GET', 'products/nonexistent-product');
  check('status 404', notFound.status === 404);

  console.log('== Auth: POST /api/auth/login (admin) ==');
  const login = await request('POST', 'auth/login', { body: { email: 'admin@bubluv.com', password: 'password' } });
  check('status 200', login.status === 200, login);
  check('ada token', typeof login.data?.token === 'string');
  check('role admin', login.data?.user?.role === 'admin');
  const adminToken = login.data?.token;

  console.log('== Auth: POST /api/auth/login (wrong password) ==');
  const badLogin = await request('POST', 'auth/login', { body: { email: 'admin@bubluv.com', password: 'wrongpass' } });
  check('status 422', badLogin.status === 422, badLogin);

  console.log('== Auth: POST /api/auth/register ==');
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const reg = await request('POST', 'auth/register', { body: { name: 'Test User', email: uniqueEmail, password: 'secret123', password_confirmation: 'secret123', phone: '081200000000' } });
  check('status 201', reg.status === 201, reg);
  check('role customer', reg.data?.user?.role === 'customer');
  const customerToken = reg.data?.token;

  console.log('== Auth: POST /api/auth/register (duplicate email) ==');
  const regDup = await request('POST', 'auth/register', { body: { name: 'Test User', email: uniqueEmail, password: 'secret123', password_confirmation: 'secret123' } });
  check('status 422', regDup.status === 422);

  console.log('== Auth: GET /api/auth/me ==');
  const me = await request('GET', 'auth/me', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', me.status === 200, me);
  check('email cocok', me.data?.user?.email === uniqueEmail);

  console.log('== Auth: GET /api/auth/me (tanpa token -> 401) ==');
  const meNoAuth = await request('GET', 'auth/me');
  check('status 401', meNoAuth.status === 401);

  console.log('== Auth: PUT /api/auth/profile ==');
  const prof = await request('PUT', 'auth/profile', { body: { name: 'Test User Updated', phone: '081299999999' }, headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', prof.status === 200, prof);
  check('nama berubah', prof.data?.user?.name === 'Test User Updated');

  console.log('== Auth: POST /api/auth/logout ==');
  const logout = await request('POST', 'auth/logout', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', logout.status === 200);

  console.log('== Customer: GET /api/customer/orders ==');
  const custOrders = await request('GET', 'customer/orders', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', custOrders.status === 200);
  check('array data', Array.isArray(custOrders.data?.data));

  console.log('== Admin guard: GET /api/admin/dashboard (tanpa token) ==');
  const dashNoAuth = await request('GET', 'admin/dashboard');
  check('status 401', dashNoAuth.status === 401);

  console.log('== Admin guard: GET /api/admin/dashboard (customer token) ==');
  const dashCust = await request('GET', 'admin/dashboard', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 403', dashCust.status === 403, dashCust);

  console.log('== Admin: GET /api/admin/dashboard ==');
  const dash = await request('GET', 'admin/dashboard', { headers: { authorization: `Bearer ${adminToken}` } });
  check('status 200', dash.status === 200, dash);
  check('total_products 30', dash.data?.data?.total_products === 30, dash.data?.data);
  check('total_customers >= 2', dash.data?.data?.total_customers >= 2);
  check('ada monthly_sales', Array.isArray(dash.data?.data?.monthly_sales));

  const adminAuth = { authorization: `Bearer ${adminToken}` };

  console.log('== Admin: GET /api/admin/products ==');
  const adminProducts = await request('GET', 'admin/products', { query: { page: 1 }, headers: adminAuth });
  check('status 200', adminProducts.status === 200);
  check('meta.total 30', adminProducts.data?.meta?.total === 30, adminProducts.data?.meta);
  check('ada variants di product', (adminProducts.data?.data?.[0]?.variants?.length || 0) === 2);

  console.log('== Order: POST /api/orders (guest, 2 item) ==');
  const productRows = adminProducts.data?.data || [];
  const p1 = productRows[0];
  const p2 = productRows[1];
  const v1 = p1?.variants?.[0];
  const orderRes = await request('POST', 'orders', {
    body: {
      recipient_name: 'Budi Santoso',
      phone: '081234567899',
      shipping_address: 'Jl. Test No. 1, Jakarta',
      shipping_method: 'Reguler (2-3 Hari)',
      shipping_cost: 15000,
      payment_method: 'manual_transfer',
      notes: 'Tes order',
      items: [
        { product_id: p1.id, variant_id: v1?.id || null, quantity: 2 },
        { product_id: p2.id, variant_id: null, quantity: 1 },
      ],
    },
  });
  check('status 201', orderRes.status === 201, orderRes);
  check('order_number BLV-', String(orderRes.data?.data?.order_number || '').startsWith('BLV-'));
  const p1Price = (p1.sale_price && p1.sale_price < p1.price ? p1.sale_price : p1.price) + (v1?.price_adjustment || 0);
  const p2Price = p2.sale_price && p2.sale_price < p2.price ? p2.sale_price : p2.price;
  const expectedTotal = p1Price * 2 + p2Price + 15000;
  check(`total = ${expectedTotal}`, orderRes.data?.data?.total === expectedTotal, orderRes.data?.data);
  const orderNumber = orderRes.data?.data?.order_number;

  console.log('== Order: stok berkurang setelah order ==');
  const detailAfter = await request('GET', `products/${p2.slug}`);
  check('stok berkurang 1', detailAfter.data?.data?.stock === p2.stock - 1, detailAfter.data?.data?.stock);

  console.log('== Order: POST /api/orders (stok tidak cukup -> 422) ==');
  const overOrder = await request('POST', 'orders', {
    body: {
      recipient_name: 'Budi', phone: '0812', shipping_address: 'x', shipping_method: 'Reguler',
      shipping_cost: 0, payment_method: 'cod',
      items: [{ product_id: p2.id, variant_id: null, quantity: 999 }],
    },
  });
  check('status 422', overOrder.status === 422, overOrder);

  console.log('== Order: GET /api/orders/{orderNumber} ==');
  const orderGet = await request('GET', `orders/${orderNumber}`);
  check('status 200', orderGet.status === 200);
  check('2 item', orderGet.data?.data?.items?.length === 2);
  check('ada payments', orderGet.data?.data?.payments?.length === 1);
  check('payment_status unpaid', orderGet.data?.data?.payment_status === 'unpaid');

  console.log('== Payments: POST /api/payments/simulate-sandbox (settlement) ==');
  const sim = await request('POST', 'payments/simulate-sandbox', { body: { order_number: orderNumber, status: 'settlement' } });
  check('status 200', sim.status === 200, sim);
  check('payment_status paid', sim.data?.data?.payment_status === 'paid');

  console.log('== Payments: simulate-sandbox idempotent ==');
  const sim2 = await request('POST', 'payments/simulate-sandbox', { body: { order_number: orderNumber, status: 'settlement' } });
  check('status 200', sim2.status === 200);

  console.log('== Admin: GET /api/admin/orders ==');
  const adminOrders = await request('GET', 'admin/orders', { headers: adminAuth });
  check('status 200', adminOrders.status === 200);
  check('ada order (>= 1)', (adminOrders.data?.meta?.total || 0) >= 1, adminOrders.data?.meta);
  const orderId = adminOrders.data?.data?.[0]?.id;

  console.log('== Admin: GET /api/admin/orders/{id} ==');
  const adminOrderDetail = await request('GET', `admin/orders/${orderId}`, { headers: adminAuth });
  check('status 200', adminOrderDetail.status === 200);
  check('ada status_histories', Array.isArray(adminOrderDetail.data?.data?.status_histories) && adminOrderDetail.data.data.status_histories.length >= 2);
  check('ada user', adminOrderDetail.data?.data?.user === null);

  console.log('== Admin: PUT /api/admin/orders/{id}/status ==');
  const statusUpdate = await request('PUT', `admin/orders/${orderId}/status`, { body: { order_status: 'processing', notes: 'Sedang diproses' }, headers: adminAuth });
  check('status 200', statusUpdate.status === 200, statusUpdate);
  check('order_status processing', statusUpdate.data?.data?.order_status === 'processing');

  console.log('== Admin: PUT /api/admin/orders/{id}/status (cancel lalu re-activate) ==');
  const cancelAfter = await request('PUT', `admin/orders/${orderId}/status`, { body: { order_status: 'cancelled' }, headers: adminAuth });
  check('status 200 (cancelled valid dari processing)', cancelAfter.status === 200, cancelAfter);
  const reActivate = await request('PUT', `admin/orders/${orderId}/status`, { body: { order_status: 'processing' }, headers: adminAuth });
  check('status 422 (cancelled tidak bisa aktif lagi)', reActivate.status === 422, reActivate);

  console.log('== Order cancel merestore stok ==');
  const detailAfterCancel = await request('GET', `products/${p2.slug}`);
  check('stok kembali', detailAfterCancel.data?.data?.stock === p2.stock, detailAfterCancel.data?.data?.stock);

  console.log('== Admin: GET /api/admin/payments ==');
  const adminPayments = await request('GET', 'admin/payments', { headers: adminAuth });
  check('status 200', adminPayments.status === 200);
  check('ada payment record', (adminPayments.data?.meta?.total || 0) >= 1, adminPayments.data?.meta);
  const paymentId = adminPayments.data?.data?.[0]?.id;

  console.log('== Admin: PUT /api/admin/payments/{id}/verify (reject) ==');
  const verify = await request('PUT', `admin/payments/${paymentId}/verify`, { body: { action: 'reject', notes: 'Bukti tidak jelas' }, headers: adminAuth });
  check('status 200', verify.status === 200, verify);
  check('payment failed', verify.data?.data?.payment_status === 'failed');

  console.log('== Admin: GET /api/admin/customers ==');
  const customers = await request('GET', 'admin/customers', { headers: adminAuth });
  check('status 200', customers.status === 200);
  check('customers >= 2', (customers.data?.meta?.total || 0) >= 2);
  check('ada orders_count', typeof customers.data?.data?.[0]?.orders_count === 'number');

  console.log('== Admin: GET /api/admin/settings ==');
  const adminSettings = await request('GET', 'admin/settings', { headers: adminAuth });
  check('status 200', adminSettings.status === 200);

  console.log('== Admin: POST /api/admin/settings ==');
  const setSettings = await request('POST', 'admin/settings', { body: { store_tagline: 'New Tagline Test' }, headers: adminAuth });
  check('status 200', setSettings.status === 200, setSettings);
  check('tagline terubah', setSettings.data?.data?.store_tagline === 'New Tagline Test');

  console.log('== Admin: POST /api/admin/categories ==');
  const newCat = await request('POST', 'admin/categories', { body: { name: 'Test Series', description: 'Kategori uji' }, headers: adminAuth });
  check('status 201', newCat.status === 201, newCat);
  check('slug test-series', newCat.data?.data?.slug === 'test-series');
  const newCatId = newCat.data?.data?.id;

  console.log('== Admin: PUT /api/admin/categories/{id} ==');
  const updCat = await request('PUT', `admin/categories/${newCatId}`, { body: { name: 'Test Series Updated', is_active: false }, headers: adminAuth });
  check('status 200', updCat.status === 200, updCat);
  check('is_active false', updCat.data?.data?.is_active === false);

  console.log('== Admin: DELETE /api/admin/categories/{id} ==');
  const delCat = await request('DELETE', `admin/categories/${newCatId}`, { headers: adminAuth });
  check('status 200', delCat.status === 200, delCat);

  console.log('== Admin: DELETE kategori dengan produk -> 422 ==');
  const delCatFail = await request('DELETE', `admin/categories/${p1.category_id}`, { headers: adminAuth });
  check('status 422', delCatFail.status === 422, delCatFail);

  console.log('== Admin: POST /api/admin/products (create with multipart) ==');
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const multi = buildMultipart(
    {
      category_id: String(p1.category_id),
      name: 'BubLuv Uji Variant',
      description: 'Deskripsi uji',
      price: '55000',
      stock: '50',
      sku: 'BLV-UJI-500',
      weight: '500',
      is_active: '1',
      'variants[0][variant_name]': 'Ukuran S',
      'variants[0][price_adjustment]': '0',
      'variants[0][stock]': '30',
      'variants[0][sku]': 'BLV-UJI-S',
    },
    [{ name: 'image', filename: 'uji.png', contentType: 'image/png', data: tinyPng }]
  );
  const createdProd = await request('POST', 'admin/products', {
    headers: { ...adminAuth, 'content-type': multi.contentType },
    raw: multi.body,
  });
  check('status 201', createdProd.status === 201, createdProd);
  check('slug bubluv-uji-variant', createdProd.data?.data?.slug === 'bubluv-uji-variant', createdProd.data?.data?.slug);
  check('image data:image/png;base64', String(createdProd.data?.data?.image || '').startsWith('data:image/png;base64'));
  check('ada 1 varian', createdProd.data?.data?.variants?.length === 1);
  const createdProdId = createdProd.data?.data?.id;

  console.log('== Admin: POST /api/admin/products/{id} (update) ==');
  const multiUpd = buildMultipart(
    {
      category_id: String(p1.category_id),
      name: 'BubLuv Uji Variant (Updated)',
      price: '58000',
      stock: '45',
      weight: '500',
      is_active: '1',
      'variants[0][variant_name]': 'Ukuran L',
      'variants[0][price_adjustment]': '5000',
      'variants[0][stock]': '45',
    }
  );
  const updatedProd = await request('POST', `admin/products/${createdProdId}`, {
    headers: { ...adminAuth, 'content-type': multiUpd.contentType },
    raw: multiUpd.body,
  });
  check('status 200', updatedProd.status === 200, updatedProd);
  check('harga terupdate 58000', updatedProd.data?.data?.price === 58000);

  console.log('== Admin: DELETE /api/admin/products/{id} ==');
  const delProd = await request('DELETE', `admin/products/${createdProdId}`, {
    headers: adminAuth,
  });
  check('status 200', delProd.status === 200, delProd);

  console.log('== Order: POST /api/orders/{orderNumber}/proof (upload bukti transfer) ==');
  const tinyJpg = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  const proofMulti = buildMultipart({}, [{ name: 'payment_proof', filename: 'proof.jpg', contentType: 'image/jpeg', data: tinyJpg }]);
  const proofRes = await request('POST', `orders/${orderNumber}/proof`, {
    headers: { 'content-type': proofMulti.contentType },
    raw: proofMulti.body,
  });
  check('status 200', proofRes.status === 200, proofRes);
  check('proof_url data:image/jpeg;base64', String(proofRes.data?.proof_url || '').startsWith('data:image/jpeg;base64'));

  console.log('\n=========================================');
  console.log(`HASIL: ${passed} PASS, ${failed} FAIL`);
  console.log('=========================================');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
