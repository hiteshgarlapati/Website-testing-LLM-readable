import { importCategoryFromWorkbook } from '../../../../lib/excelImport.js';
import { writeItems, IMAGES_DIR } from '../../../../lib/itemsStore.js';
import { CATEGORIES } from '../../../../lib/catalogue.js';
import { assertAdminAuthorized } from '../../../../lib/adminAuth.js';

export const prerender = false;

const ALLOWED = new Set(CATEGORIES.map(c => c.id));
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export async function POST({ params, request }) {
  const categoryId = params.categoryId;
  if (!ALLOWED.has(categoryId)) {
    return Response.json({ error: 'Unknown catalogue category.' }, { status: 400 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return Response.json({ error: 'Upload exceeds 25 MB limit.' }, { status: 413 });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form upload.' }, { status: 400 });
  }

  const authError = assertAdminAuthorized(request, form.get('secret'));
  if (authError) {
    return Response.json({ error: authError }, { status: 401 });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return Response.json({ error: 'Choose an .xlsx file to upload.' }, { status: 400 });
  }

  const name = file.name || '';
  if (!name.toLowerCase().endsWith('.xlsx')) {
    return Response.json({ error: 'Upload must be an .xlsx workbook.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    return Response.json({ error: 'Upload exceeds 25 MB limit.' }, { status: 413 });
  }

  try {
    const result = await importCategoryFromWorkbook(buffer, categoryId, { imagesDir: IMAGES_DIR });

    if (result.imported === 0 && result.skipped.length > 0) {
      return Response.json(
        {
          ok: false,
          error: `No products could be imported. Your ${result.category} catalogue was not changed.`,
          category: result.category,
          imported: 0,
          skipped: result.skipped,
          message: `No products were imported. ${result.skipped.length} row(s) had errors (see list below).`
        },
        { status: 400 }
      );
    }

    await writeItems(result.items);

    const skipped = result.skipped ?? [];
    let message;
    if (result.imported === 0) {
      message = `No product rows found — ${result.category} catalogue is now empty.`;
    } else {
      message = `Imported ${result.imported} product(s) into ${result.category}.`;
      if (skipped.length > 0) {
        message += ` Skipped ${skipped.length} row(s) that could not be read.`;
      }
    }

    return Response.json({
      ok: true,
      category: result.category,
      imported: result.imported,
      skipped,
      totalProducts: result.items.length,
      message
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Import failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
