import busboy from 'busboy';
import type { VercelRequest } from '@vercel/node';

export interface UploadedFile {
  fieldname: string;
  filename: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface ParsedMultipart {
  fields: Record<string, string>;
  files: Record<string, UploadedFile>;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const ALLOWED_IMAGE_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function parseMultipart(req: VercelRequest): Promise<ParsedMultipart> {
  return new Promise((resolve, reject) => {
    const fields: Record<string, string> = {};
    const files: Record<string, UploadedFile> = {};

    let bb: busboy.Busboy;
    try {
      bb = busboy({
        headers: req.headers as any,
        limits: { fileSize: MAX_FILE_SIZE, files: 20, fields: 200 },
      });
    } catch (err) {
      return reject(err);
    }

    bb.on('field', (name, val) => {
      fields[stripIndex(name)] = fields[stripIndex(name)]
        ? `${fields[stripIndex(name)]}`
        : val;
      fields[name] = val;
    });

    bb.on('file', (name, file, info) => {
      const chunks: Buffer[] = [];
      let truncated = false;
      file.on('data', (c: Buffer) => chunks.push(c));
      file.on('limit', () => {
        truncated = true;
      });
      file.on('end', () => {
        if (truncated) {
          const e: any = new Error('Ukuran file terlalu besar (maksimal 4MB).');
          e.status = 422;
          return reject(e);
        }
        if (!info.filename) return;
        if (!ALLOWED_IMAGE_TYPES.includes(info.mimeType)) {
          const e: any = new Error('Format file harus berupa gambar (jpg, png, webp).');
          e.status = 422;
          return reject(e);
        }
        files[name] = {
          fieldname: name,
          filename: info.filename,
          mimetype: info.mimeType,
          buffer: Buffer.concat(chunks),
          size: Buffer.concat(chunks).length,
        };
      });
    });

    bb.on('error', (err) => reject(err));
    bb.on('finish', () => resolve({ fields, files }));

    if ((req as any).body) {
      const body = (req as any).body;
      if (Buffer.isBuffer(body)) {
        bb.end(body);
      } else if (typeof body === 'string') {
        bb.end(Buffer.from(body));
      } else {
        bb.end(Buffer.from(JSON.stringify(body)));
      }
    } else {
      req.pipe(bb);
    }
  });
}

function stripIndex(name: string): string {
  return name.replace(/\[\d+\]/g, '');
}

export function toDataUri(file: UploadedFile): string {
  const ext = ALLOWED_IMAGE_EXT[file.mimetype] || 'png';
  const mime = file.mimetype === 'image/jpg' ? 'image/jpeg' : file.mimetype;
  return `data:${mime};base64,${file.buffer.toString('base64')}`;
}

export function parseVariantsFromFields(
  fields: Record<string, string>
): Array<{ id?: number; variant_name: string; price_adjustment: number; stock: number; sku?: string | null }> {
  const variants: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    const m = key.match(/^variants\[(\d+)\]\[(\w+)\]$/);
    if (!m) continue;
    const idx = m[1];
    const field = m[2];
    if (!variants[idx]) variants[idx] = {};
    variants[idx][field] = value;
  }
  return Object.keys(variants)
    .sort((a, b) => Number(a) - Number(b))
    .map((idx) => {
      const v = variants[idx];
      return {
        id: v.id ? Number(v.id) : undefined,
        variant_name: v.variant_name || '',
        price_adjustment: Number(v.price_adjustment || 0),
        stock: Number.parseInt(v.stock || '0', 10) || 0,
        sku: v.sku || null,
      };
    })
    .filter((v) => v.variant_name);
}
