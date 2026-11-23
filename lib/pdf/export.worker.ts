import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { buildPdf } from './build';
import type { ExportJob } from './types';

interface Request {
  jobs: ExportJob[];
  sources: Record<string, ArrayBuffer>;
  zip: boolean;
}

const ctx = self as unknown as {
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent<Request>) => void) | null;
};

function uniqueName(name: string, used: Set<string>) {
  let result = name;
  let n = 2;
  while (used.has(result.toLowerCase())) result = name.replace(/\.pdf$/i, ` (${n++}).pdf`);
  used.add(result.toLowerCase());
  return result;
}

ctx.onmessage = async (event) => {
  const { jobs, sources, zip } = event.data;
  try {
    const total = jobs.reduce((n, job) => n + job.pages.length, 0) || 1;
    const buildShare = zip ? 0.85 : 0.97;
    let done = 0;
    const cache = new Map<string, Promise<PDFDocument>>();
    const load = (id: string) => {
      let promise = cache.get(id);
      if (!promise) {
        promise = PDFDocument.load(sources[id], { updateMetadata: false });
        cache.set(id, promise);
      }
      return promise;
    };

    const outputs: { name: string; bytes: Uint8Array }[] = [];
    for (const job of jobs) {
      const bytes = await buildPdf(job.pages, load, () => {
        done++;
        ctx.postMessage({ type: 'progress', value: (done / total) * buildShare });
      });
      outputs.push({ name: job.name, bytes });
    }

    if (!zip) {
      ctx.postMessage({ type: 'done', blob: new Blob([outputs[0].bytes as BlobPart], { type: 'application/pdf' }) });
      return;
    }

    const archive = new JSZip();
    const used = new Set<string>();
    for (const out of outputs) archive.file(uniqueName(out.name, used), out.bytes);
    const blob = await archive.generateAsync({ type: 'blob', compression: 'STORE' }, (meta) =>
      ctx.postMessage({ type: 'progress', value: 0.85 + (meta.percent / 100) * 0.15 }),
    );
    ctx.postMessage({ type: 'done', blob });
  } catch (error) {
    const err = error as { name?: string; message?: string };
    ctx.postMessage({
      type: 'error',
      code: err?.name === 'EncryptedPDFError' ? 'encrypted' : 'generic',
      message: err?.message ?? 'Unknown error',
    });
  }
};
