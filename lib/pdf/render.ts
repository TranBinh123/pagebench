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

export interface Preview {
  url: string;
  w: number;
  h: number;
}

const PREVIEW_CACHE_SIZE = 10;
const PREVIEW_MAX_SIDE = 4096;
const PREVIEW_MAX_PIXELS = 12_000_000;
const previewCache = new Map<string, Preview>();

const abortError = () => new DOMException('Aborted', 'AbortError');

export const previewKey = (srcId: string, index: number, swap: boolean, width: number) =>
  `${srcId}:${index}:${swap ? 1 : 0}:${width}`;

export function peekPreview(key: string): Preview | null {
  const hit = previewCache.get(key);
  if (!hit) return null;
  previewCache.delete(key);
  previewCache.set(key, hit);
  return hit;
}

// Keeps the 10 most recent previews and frees the blob URL of the evicted ones.
function rememberPreview(key: string, value: Preview) {
  previewCache.set(key, value);
  while (previewCache.size > PREVIEW_CACHE_SIZE) {
    const oldest = previewCache.keys().next().value as string;
    const evicted = previewCache.get(oldest);
    previewCache.delete(oldest);
    if (evicted) URL.revokeObjectURL(evicted.url);
  }
}

// Renders one page so that its displayed width (after the user's 90/270 rotation) is targetWidth px; skips the thumbnail queue.
export async function renderPreview(
  srcId: string,
  index: number,
  swap: boolean,
  targetWidth: number,
  signal: AbortSignal,
): Promise<Preview> {
  const key = previewKey(srcId, index, swap, targetWidth);
  const cached = peekPreview(key);
  if (cached) return cached;

  const pdf = await openPdfjsDoc(srcId);
  if (signal.aborted) throw abortError();
  const page = await pdf.getPage(index + 1);
  if (signal.aborted) throw abortError();

  const base = page.getViewport({ scale: 1 });
  const wanted = targetWidth / (swap ? base.height : base.width);
  const scale = Math.min(
    wanted,
    PREVIEW_MAX_SIDE / Math.max(base.width, base.height),
    Math.sqrt(PREVIEW_MAX_PIXELS / (base.width * base.height)),
  );
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const task = page.render({ canvasContext: ctx, viewport });
  const onAbort = () => task.cancel();
  signal.addEventListener('abort', onAbort);
  try {
    await task.promise;
  } catch (error) {
    if (signal.aborted) throw abortError();
    throw error;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
  if (signal.aborted) throw abortError();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Preview failed'))), 'image/jpeg', 0.92),
  );
  page.cleanup();
  const preview = { url: URL.createObjectURL(blob), w: canvas.width, h: canvas.height };
  rememberPreview(key, preview);
  return preview;
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
