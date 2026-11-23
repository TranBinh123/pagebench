import type { DocModel } from './types';
import { openPdfjsDoc } from './render';
import { putSource } from './sources';
import { isPdfHeader, looksEncrypted, readFileBytes, uid } from './utils';

export class PdfLoadError extends Error {
  constructor(public code: 'notPdf' | 'corrupt' | 'encrypted') {
    super(code);
  }
}

export async function loadDocument(file: File): Promise<DocModel> {
  const bytes = await readFileBytes(file);
  if (!isPdfHeader(bytes)) throw new PdfLoadError('notPdf');
  if (looksEncrypted(bytes)) throw new PdfLoadError('encrypted');

  const srcId = uid();
  putSource(srcId, bytes);

  let pageCount: number;
  try {
    pageCount = (await openPdfjsDoc(srcId)).numPages;
  } catch (error) {
    throw new PdfLoadError((error as { name?: string })?.name === 'PasswordException' ? 'encrypted' : 'corrupt');
  }
  if (pageCount < 1) throw new PdfLoadError('corrupt');

  return {
    id: uid(),
    name: file.name,
    pages: Array.from({ length: pageCount }, (_, index) => ({ id: uid(), srcId, index, rotation: 0 as const })),
  };
}
