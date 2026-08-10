import JSZip from 'jszip';

const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const DRAWING_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing';
const IMAGE_REL =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';

function normalizeZipPath(target) {
  return target.replace(/^\//, '').replace(/^\.\.\//, '');
}

function parseRelationships(xml) {
  const rels = new Map();
  const re = /<\s*Relationship[^>]*\/?>/gi;
  for (const tag of xml.match(re) || []) {
    const type = tag.match(/Type="([^"]+)"/)?.[1];
    const id = tag.match(/Id="([^"]+)"/)?.[1];
    const target = tag.match(/Target="([^"]+)"/)?.[1];
    if (id && target) rels.set(id, { type, target });
  }
  return rels;
}

function extensionFromPath(filePath) {
  const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
  return ext === 'jpeg' ? 'jpg' : ext;
}

/**
 * Parse drawing XML anchors and return Map "excelRow:excelCol" (1-based) → { buffer, extension }.
 */
async function anchorsFromDrawing(zip, drawingPath, imageMap) {
  const normalizedDrawing = normalizeZipPath(drawingPath);
  const drawingFile = zip.file(normalizedDrawing);
  if (!drawingFile) return;

  const name = normalizedDrawing.split('/').pop();
  const relsFile = zip.file(`xl/drawings/_rels/${name}.rels`);
  if (!relsFile) return;

  const rels = parseRelationships(await relsFile.async('string'));
  const xml = await drawingFile.async('string');

  const anchorRe = /<(?:oneCellAnchor|twoCellAnchor)>([\s\S]*?)<\/(?:oneCellAnchor|twoCellAnchor)>/g;
  for (const match of xml.matchAll(anchorRe)) {
    const block = match[1];
    const col = Number(block.match(/<col>(\d+)<\/col>/)?.[1] ?? NaN);
    const row = Number(block.match(/<row>(\d+)<\/row>/)?.[1] ?? NaN);
    const rId = block.match(/r:embed="([^"]+)"/)?.[1];
    if (!Number.isFinite(col) || !Number.isFinite(row) || !rId) continue;

    const rel = rels.get(rId);
    if (!rel || rel.type !== IMAGE_REL) continue;

    const mediaPath = normalizeZipPath(rel.target);
    const mediaFile = zip.file(mediaPath);
    if (!mediaFile) continue;

    const buffer = await mediaFile.async('nodebuffer');
    const key = `${row + 1}:${col + 1}`;
    imageMap.set(key, { buffer, extension: extensionFromPath(mediaPath) });
  }
}

/** Embedded cell images keyed by 1-based Excel row:col (for Image1–Image3 columns). */
export async function extractImagesFromXlsx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const imageMap = new Map();

  const sheetRelFiles = Object.keys(zip.files).filter(
    p => p.match(/^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/)
  );

  for (const relFilePath of sheetRelFiles) {
    const rels = parseRelationships(await zip.file(relFilePath).async('string'));
    for (const rel of rels.values()) {
      if (rel.type !== DRAWING_REL) continue;
      const drawingPath = normalizeZipPath(rel.target);
      await anchorsFromDrawing(zip, drawingPath, imageMap);
    }
  }

  return imageMap;
}

/** Remove drawing parts so ExcelJS can load sheets from exports with broken drawing metadata. */
export async function stripDrawingsFromXlsx(buffer) {
  const zip = await JSZip.loadAsync(buffer);

  for (const path of Object.keys(zip.files)) {
    if (path.startsWith('xl/drawings/')) zip.remove(path);
  }

  for (const path of Object.keys(zip.files)) {
    if (!path.match(/^xl\/worksheets\/sheet\d+\.xml$/)) continue;
    let sheet = await zip.file(path).async('string');
    sheet = sheet.replace(/<drawing[^>]*\/>/g, '').replace(/<drawing[^>]*>[\s\S]*?<\/drawing>/g, '');
    zip.file(path, sheet);
  }

  for (const path of Object.keys(zip.files)) {
    if (!path.match(/^xl\/worksheets\/_rels\/sheet\d+\.xml\.rels$/)) continue;
    const xml = await zip.file(path).async('string');
    const rels = parseRelationships(xml);
    const kept = [...rels.entries()].filter(([, rel]) => rel.type !== DRAWING_REL);
    if (kept.length === 0) {
      zip.file(
        path,
        `<Relationships xmlns="${REL_NS}"></Relationships>`
      );
      continue;
    }
    const body = kept
      .map(
        ([id, rel]) =>
          `<Relationship Type="${rel.type}" Target="${rel.target}" Id="${id}" />`
      )
      .join('');
    zip.file(path, `<Relationships xmlns="${REL_NS}">${body}</Relationships>`);
  }

  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export async function loadWorkbookBuffer(buffer, ExcelJS) {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
    return { workbook, zipImages: null };
  } catch {
    const zipImages = await extractImagesFromXlsx(buffer);
    const stripped = await stripDrawingsFromXlsx(buffer);
    await workbook.xlsx.load(stripped);
    return { workbook, zipImages };
  }
}
