import 'dotenv/config';
// Uji apakah dependency yang di-import handler bisa gagal di-resolve saat bundling/runtime
const deps = ['/@vercel/node', 'bcryptjs', 'busboy', 'jsonwebtoken', 'mysql2/promise'];
for (const d of deps) {
  try { await import(d.startsWith('/') ? d.slice(1) : d); console.log(`resolve OK: ${d}`); }
  catch (e) { console.log(`resolve GAGAL: ${d} -> ${e.code || e.message}`); }
}
