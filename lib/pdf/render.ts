import type { PDFDocumentProxy } from 'pdfjs-dist';
import { getSource } from './sources';

export interface Thumb {
  url: string;
  w: number;
  h: number;
}

const MAX_SIDE = 360;
const MAX_CONCURRENT = 3;

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
const docCache = new Map<string, Promise<PDFDocumentProxy>>();
const thumbPromises = new Map<string, Promise<Thumb>>();
const thumbDone = new Map<string, Thumb>();
const waiting: Array<() => void> = [];
let running = 0;

function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
      return lib;
    });
  }
  return pdfjsPromise;
}

export function openPdfjsDoc(srcId: string): Promise<PDFDocumentProxy> {
  let promise = docCache.get(srcId);
  if (!promise) {
    promise = getPdfjs().then((lib) => lib.getDocument({ data: getSource(srcId).slice(), isEvalSupported: false }).promise);
    promise.catch(() => docCache.delete(srcId));
    docCache.set(srcId, promise);
  }
  return promise;
}

async function acquire() {
  while (running >= MAX_CONCURRENT) await new Promise<void>((resolve) => waiting.push(resolve));
  running++;
}

function release() {
  running--;
  waiting.shift()?.();
}

async function renderThumb(srcId: string, index: number): Promise<Thumb> {
  await acquire();
  try {
    const pdf = await openPdfjsDoc(srcId);
    const page = await pdf.getPage(index + 1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: MAX_SIDE / Math.max(base.width, base.height) });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    await page.render({ canvasContext: ctx, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Thumbnail failed'))), 'image/jpeg', 0.85),
    );
    page.cleanup();
    return { url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height };
  } finally {
    release();
  }
}

export function peekThumb(srcId: string, index: number): Thumb | null {
  return thumbDone.get(`${srcId}:${index}`) ?? null;
}

export function getThumb(srcId: string, index: number): Promise<Thumb> {
  const key = `${srcId}:${index}`;
  let promise = thumbPromises.get(key);
  if (!promise) {
    promise = renderThumb(srcId, index).then(
      (thumb) => {
        thumbDone.set(key, thumb);
        return thumb;
      },
      (error) => {
        thumbPromises.delete(key);
        throw error;
      },
    );
    thumbPromises.set(key, promise);
  }
  return promise;
}
