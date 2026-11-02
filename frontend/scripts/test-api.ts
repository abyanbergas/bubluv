/* Integration test: memanggil handler API langsung dengan mock req/res Vercel */
import 'dotenv/config';
import { Readable } from 'node:stream';

function makeRes() {
  return {
    statusCode: 0,
    headers: {} as Record<string, string | number>,
    body: null as any,
    jsonBody: null as any,
    setHeader(k: string, v: any) { this.headers[k] = v; },
    status(code: number) { this.statusCode = code; return this; },
    json(data: any) { this.jsonBody = data; this.body = JSON.stringify(data); return this; },
    end() { return this; },
  };
}

function makeReq(method: string, opts: { query?: any; body?: any; headers?: any; raw?: Buffer } = {}) {
  const req: any = Readable.from(opts.raw ? [opts.raw] : []);
  req.method = method;
  req.query = opts.query || {};
  req.headers = { ...opts.headers };
  if (opts.body !== undefined) {
    req.body = opts.body;
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

async function call(mod: any, method: string, opts: { query?: any; body?: any; headers?: any; raw?: Buffer } = {}) {
  const req = makeReq(method, opts);
  const res: any = makeRes();
  await mod.default(req, res);
  return { status: res.statusCode, data: res.jsonBody };
}

let passed = 0, failed = 0;
function check(name: string, cond: boolean, extra?: any) {
  if (cond) { passed++; console.log(`  PASS: ${name}`); }
  else { failed++; console.log(`  FAIL: ${name}`, extra !== undefined ? JSON.stringify(extra).slice(0, 300) : ''); }
}

async function main() {
  console.log('== Public: GET /api/settings ==');
  const settings = await call(await import('../api/settings/index'), 'GET');
  check('status 200', settings.status === 200, settings);
  check('ada store_name', settings.data?.data?.store_name === 'BubLuv Official Store', settings.data);

  console.log('== Public: GET /api/categories ==');
  const cats = await call(await import('../api/categories/index'), 'GET');
  check('status 200', cats.status === 200);
  check('5 kategori', Array.isArray(cats.data?.data) && cats.data.data.length === 5, cats.data);
  check('products_count ada', typeof cats.data?.data?.[0]?.products_count === 'number');

  console.log('== Public: GET /api/products ==');
  const products = await call(await import('../api/products/index'), 'GET', { query: { per_page: 12 } });
  check('status 200', products.status === 200);
  check('30 produk total', products.data?.meta?.total === 30, products.data?.meta);
  check('12 per halaman', products.data?.data?.length === 12);
  const first = products.data?.data?.[0];
  check('ada category', !!first?.category?.slug);
  check('ada active_variants', Array.isArray(first?.active_variants) && first.active_variants.length === 2);
  check('effective_price', typeof first?.effective_price === 'number');

  console.log('== Public: GET /api/products?search=matcha ==');
  const searchRes = await call(await import('../api/products/index'), 'GET', { query: { search: 'matcha' } });
  check('status 200', searchRes.status === 200);
  check('hasil >= 2', (searchRes.data?.meta?.total || 0) >= 2, searchRes.data?.meta);

  console.log('== Public: GET /api/products?category=tea-series ==');
  const catFilter = await call(await import('../api/products/index'), 'GET', { query: { category: 'tea-series' } });
  check('5 produk tea-series', catFilter.data?.meta?.total === 5, catFilter.data?.meta);

  console.log('== Public: GET /api/products?best_seller=true ==');
  const best = await call(await import('../api/products/index'), 'GET', { query: { best_seller: 'true' } });
  check('best seller > 5', (best.data?.meta?.total || 0) > 5, best.data?.meta);

  console.log('== Public: GET /api/products/{slug} ==');
  const detail = await call(await import('../api/products/[slug]'), 'GET', { query: { slug: 'bubluv-matcha-latte' } });
  check('status 200', detail.status === 200, detail);
  check('ada related', Array.isArray(detail.data?.related));
  check('sale_price 60000', detail.data?.data?.sale_price === 60000, detail.data?.data?.sale_price);

  console.log('== Public: GET /api/products/{slug} (invalid) ==');
  const notFound = await call(await import('../api/products/[slug]'), 'GET', { query: { slug: 'nonexistent-product' } });
  check('status 404', notFound.status === 404);

  console.log('== Auth: POST /api/auth/login (admin) ==');
  const login = await call(await import('../api/auth/login'), 'POST', { body: { email: 'admin@bubluv.com', password: 'password' } });
  check('status 200', login.status === 200, login);
  check('ada token', typeof login.data?.token === 'string');
  check('role admin', login.data?.user?.role === 'admin');
  const adminToken = login.data?.token;

  console.log('== Auth: POST /api/auth/login (wrong password) ==');
  const badLogin = await call(await import('../api/auth/login'), 'POST', { body: { email: 'admin@bubluv.com', password: 'wrongpass' } });
  check('status 422', badLogin.status === 422, badLogin);

  console.log('== Auth: POST /api/auth/register ==');
  const uniqueEmail = `test-${Date.now()}@example.com`;
  const reg = await call(await import('../api/auth/register'), 'POST', { body: { name: 'Test User', email: uniqueEmail, password: 'secret123', password_confirmation: 'secret123', phone: '081200000000' } });
  check('status 201', reg.status === 201, reg);
  check('role customer', reg.data?.user?.role === 'customer');
  const customerToken = reg.data?.token;

  console.log('== Auth: POST /api/auth/register (duplicate email) ==');
  const regDup = await call(await import('../api/auth/register'), 'POST', { body: { name: 'Test User', email: uniqueEmail, password: 'secret123', password_confirmation: 'secret123' } });
  check('status 422', regDup.status === 422);

  console.log('== Auth: GET /api/auth/me ==');
  const me = await call(await import('../api/auth/me'), 'GET', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', me.status === 200, me);
  check('email cocok', me.data?.user?.email === uniqueEmail);

  console.log('== Auth: GET /api/auth/me (tanpa token -> 401) ==');
  const meNoAuth = await call(await import('../api/auth/me'), 'GET');
  check('status 401', meNoAuth.status === 401);

  console.log('== Auth: PUT /api/auth/profile ==');
  const prof = await call(await import('../api/auth/profile'), 'PUT', { body: { name: 'Test User Updated', phone: '081299999999' }, headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', prof.status === 200, prof);
  check('nama berubah', prof.data?.user?.name === 'Test User Updated');

  console.log('== Auth: POST /api/auth/logout ==');
  const logout = await call(await import('../api/auth/logout'), 'POST', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', logout.status === 200);

  console.log('== Customer: GET /api/customer/orders ==');
  const custOrders = await call(await import('../api/customer/orders'), 'GET', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 200', custOrders.status === 200);
  check('array data', Array.isArray(custOrders.data?.data));

  console.log('== Admin guard: GET /api/admin/dashboard (tanpa token) ==');
  const dashNoAuth = await call(await import('../api/admin/dashboard'), 'GET');
  check('status 401', dashNoAuth.status === 401);

  console.log('== Admin guard: GET /api/admin/dashboard (customer token) ==');
  const dashCust = await call(await import('../api/admin/dashboard'), 'GET', { headers: { authorization: `Bearer ${customerToken}` } });
  check('status 403', dashCust.status === 403, dashCust);

  console.log('== Admin: GET /api/admin/dashboard ==');
  const dash = await call(await import('../api/admin/dashboard'), 'GET', { headers: { authorization: `Bearer ${adminToken}` } });
  check('status 200', dash.status === 200, dash);
  check('total_products 30', dash.data?.data?.total_products === 30, dash.data?.data);
  check('total_customers >= 2', dash.data?.data?.total_customers >= 2);
  check('ada monthly_sales', Array.isArray(dash.data?.data?.monthly_sales));

  const adminAuth = { authorization: `Bearer ${adminToken}` };

  console.log('== Admin: GET /api/admin/products ==');
  const adminProducts = await call(await import('../api/admin/products/index'), 'GET', { query: { page: 1 }, headers: adminAuth });
  check('status 200', adminProducts.status === 200);
  check('meta.total 30', adminProducts.data?.meta?.total === 30, adminProducts.data?.meta);
  check('ada variants di product', (adminProducts.data?.data?.[0]?.variants?.length || 0) === 2);

  console.log('== Order: POST /api/orders (guest, 2 item) ==');
  const productRows = adminProducts.data?.data || [];
  const p1 = productRows[0];
  const p2 = productRows[1];
  const v1 = p1?.variants?.[0];
  const orderRes = await call(await import('../api/orders/index'), 'POST', {
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
  const detailAfter = await call(await import('../api/products/[slug]'), 'GET', { query: { slug: p2.slug } });
  check('stok berkurang 1', detailAfter.data?.data?.stock === p2.stock - 1, detailAfter.data?.data?.stock);

  console.log('== Order: POST /api/orders (stok tidak cukup -> 422) ==');
  const overOrder = await call(await import('../api/orders/index'), 'POST', {
    body: {
      recipient_name: 'Budi', phone: '0812', shipping_address: 'x', shipping_method: 'Reguler',
      shipping_cost: 0, payment_method: 'cod',
      items: [{ product_id: p2.id, variant_id: null, quantity: 999 }],
    },
  });
  check('status 422', overOrder.status === 422, overOrder);

  console.log('== Order: GET /api/orders/{orderNumber} ==');
  const orderGet = await call(await import('../api/orders/[orderNumber]'), 'GET', { query: { orderNumber } });
  check('status 200', orderGet.status === 200);
  check('2 item', orderGet.data?.data?.items?.length === 2);
  check('ada payments', orderGet.data?.data?.payments?.length === 1);
  check('payment_status unpaid', orderGet.data?.data?.payment_status === 'unpaid');

  console.log('== Payments: POST /api/payments/simulate-sandbox (settlement) ==');
  const sim = await call(await import('../api/payments/simulate-sandbox'), 'POST', { body: { order_number: orderNumber, status: 'settlement' } });
  check('status 200', sim.status === 200, sim);
  check('payment_status paid', sim.data?.data?.payment_status === 'paid');

  console.log('== Payments: simulate-sandbox idempotent ==');
  const sim2 = await call(await import('../api/payments/simulate-sandbox'), 'POST', { body: { order_number: orderNumber, status: 'settlement' } });
  check('status 200', sim2.status === 200);

  console.log('== Admin: GET /api/admin/orders ==');
  const adminOrders = await call(await import('../api/admin/orders/index'), 'GET', { headers: adminAuth });
  check('status 200', adminOrders.status === 200);
  check('ada order (>= 1)', (adminOrders.data?.meta?.total || 0) >= 1, adminOrders.data?.meta);
  const orderId = adminOrders.data?.data?.[0]?.id;

  console.log('== Admin: GET /api/admin/orders/{id} ==');
  const adminOrderDetail = await call(await import('../api/admin/orders/[id]/index'), 'GET', { query: { id: orderId }, headers: adminAuth });
  check('status 200', adminOrderDetail.status === 200);
  check('ada status_histories', Array.isArray(adminOrderDetail.data?.data?.status_histories) && adminOrderDetail.data.data.status_histories.length >= 2);
  check('ada user', adminOrderDetail.data?.data?.user === null); // guest order

  console.log('== Admin: PUT /api/admin/orders/{id}/status ==');
  const statusUpdate = await call(await import('../api/admin/orders/[id]/status'), 'PUT', { query: { id: orderId }, body: { order_status: 'processing', notes: 'Sedang diproses' }, headers: adminAuth });
  check('status 200', statusUpdate.status === 200, statusUpdate);
  check('order_status processing', statusUpdate.data?.data?.order_status === 'processing');

  console.log('== Admin: PUT /api/admin/orders/{id}/status (cancel lalu re-activate) ==');
  const cancelAfter = await call(await import('../api/admin/orders/[id]/status'), 'PUT', { query: { id: orderId }, body: { order_status: 'cancelled' } , headers: adminAuth });
  check('status 200 (cancelled valid dari processing)', cancelAfter.status === 200, cancelAfter);
  const reActivate = await call(await import('../api/admin/orders/[id]/status'), 'PUT', { query: { id: orderId }, body: { order_status: 'processing' }, headers: adminAuth });
  check('status 422 (cancelled tidak bisa aktif lagi)', reActivate.status === 422, reActivate);

  console.log('== Order cancel merestore stok ==');
  const detailAfterCancel = await call(await import('../api/products/[slug]'), 'GET', { query: { slug: p2.slug } });
  check('stok kembali', detailAfterCancel.data?.data?.stock === p2.stock, detailAfterCancel.data?.data?.stock);

  console.log('== Admin: GET /api/admin/payments ==');
  const adminPayments = await call(await import('../api/admin/payments/index'), 'GET', { headers: adminAuth });
  check('status 200', adminPayments.status === 200);
  check('ada payment record', (adminPayments.data?.meta?.total || 0) >= 1, adminPayments.data?.meta);
  const paymentId = adminPayments.data?.data?.[0]?.id;

  console.log('== Admin: PUT /api/admin/payments/{id}/verify (reject) ==');
  const verify = await call(await import('../api/admin/payments/[id]/verify'), 'PUT', { query: { id: paymentId }, body: { action: 'reject', notes: 'Bukti tidak jelas' }, headers: adminAuth });
  check('status 200', verify.status === 200, verify);
  check('payment failed', verify.data?.data?.payment_status === 'failed');

  console.log('== Admin: GET /api/admin/customers ==');
  const customers = await call(await import('../api/admin/customers/index'), 'GET', { headers: adminAuth });
  check('status 200', customers.status === 200);
  check('customers >= 2', (customers.data?.meta?.total || 0) >= 2);
  check('ada orders_count', typeof customers.data?.data?.[0]?.orders_count === 'number');

  console.log('== Admin: GET /api/admin/settings ==');
  const adminSettings = await call(await import('../api/admin/settings/index'), 'GET', { headers: adminAuth });
  check('status 200', adminSettings.status === 200);

  console.log('== Admin: POST /api/admin/settings ==');
  const setSettings = await call(await import('../api/admin/settings/index'), 'POST', { body: { store_tagline: 'New Tagline Test' }, headers: adminAuth });
  check('status 200', setSettings.status === 200, setSettings);
  check('tagline terubah', setSettings.data?.data?.store_tagline === 'New Tagline Test');

  console.log('== Admin: POST /api/admin/categories ==');
  const newCat = await call(await import('../api/admin/categories/index'), 'POST', { body: { name: 'Test Series', description: 'Kategori uji' }, headers: adminAuth });
  check('status 201', newCat.status === 201, newCat);
  check('slug test-series', newCat.data?.data?.slug === 'test-series');
  const newCatId = newCat.data?.data?.id;

  console.log('== Admin: PUT /api/admin/categories/{id} ==');
  const updCat = await call(await import('../api/admin/categories/[id]'), 'PUT', { query: { id: newCatId }, body: { name: 'Test Series Updated', is_active: false }, headers: adminAuth });
  check('status 200', updCat.status === 200, updCat);
  check('is_active false', updCat.data?.data?.is_active === false);

  console.log('== Admin: DELETE /api/admin/categories/{id} ==');
  const delCat = await call(await import('../api/admin/categories/[id]'), 'DELETE', { query: { id: newCatId }, headers: adminAuth });
  check('status 200', delCat.status === 200, delCat);

  console.log('== Admin: DELETE kategori dengan produk -> 422 ==');
  const delCatFail = await call(await import('../api/admin/categories/[id]'), 'DELETE', { query: { id: p1.category_id }, headers: adminAuth });
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
  const createdProd = await call(await import('../api/admin/products/index'), 'POST', {
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
  const updatedProd = await call(await import('../api/admin/products/[id]'), 'POST', {
    query: { id: createdProdId },
    headers: { ...adminAuth, 'content-type': multiUpd.contentType },
    raw: multiUpd.body,
  });
  check('status 200', updatedProd.status === 200, updatedProd);
  check('harga terupdate 58000', updatedProd.data?.data?.price === 58000);

  console.log('== Admin: DELETE /api/admin/products/{id} ==');
  const delProd = await call(await import('../api/admin/products/[id]'), 'DELETE', {
    query: { id: createdProdId },
    headers: adminAuth,
  });
  check('status 200', delProd.status === 200, delProd);

  console.log('== Order: POST /api/orders/{orderNumber}/proof (upload bukti transfer) ==');
  const proofMulti = buildMultipart({}, [{ name: 'payment_proof', filename: 'proof.jpg', contentType: 'image/jpeg', data: tinyPng }]);
  const proofRes = await call(await import('../api/orders/[orderNumber]/proof'), 'POST', {
    query: { orderNumber },
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
