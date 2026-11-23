import { PDFDocument, degrees } from 'pdf-lib';
import type { ExportJob } from './types';

type PageSpec = ExportJob['pages'][number];

// Copies pages in order from their sources into a new PDF, applying user rotation on top of the original.
export async function buildPdf(
  pages: PageSpec[],
  load: (srcId: string) => Promise<PDFDocument>,
  onPage?: () => void,
): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  let i = 0;
  while (i < pages.length) {
    let j = i;
    while (j < pages.length && pages[j].srcId === pages[i].srcId) j++;
    const run = pages.slice(i, j);
    const src = await load(run[0].srcId);
    const copied = await out.copyPages(src, run.map((p) => p.index));
    copied.forEach((page, k) => {
      const extra = run[k].rotation;
      if (extra) page.setRotation(degrees((page.getRotation().angle + extra) % 360));
      out.addPage(page);
      onPage?.();
    });
    i = j;
  }
  return out.save();
}
