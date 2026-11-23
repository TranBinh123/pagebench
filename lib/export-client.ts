import { getSource } from '@/lib/pdf/sources';
import type { ExportJob } from '@/lib/pdf/types';

export class ExportError extends Error {
  constructor(public code: 'encrypted' | 'generic', message: string) {
    super(message);
  }
}

export function runExport(jobs: ExportJob[], zip: boolean, onProgress: (value: number) => void): Promise<Blob> {
  const ids = new Set(jobs.flatMap((job) => job.pages.map((p) => p.srcId)));
  const sources: Record<string, ArrayBuffer> = {};
  const transfer: ArrayBuffer[] = [];
  ids.forEach((id) => {
    const copy = getSource(id).slice().buffer as ArrayBuffer;
    sources[id] = copy;
    transfer.push(copy);
  });

  const worker = new Worker(new URL('./pdf/export.worker.ts', import.meta.url), { type: 'module' });
  return new Promise<Blob>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'progress') {
        onProgress(msg.value);
      } else if (msg.type === 'done') {
        worker.terminate();
        resolve(msg.blob as Blob);
      } else if (msg.type === 'error') {
        worker.terminate();
        reject(new ExportError(msg.code, msg.message));
      }
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new ExportError('generic', event.message));
    };
    worker.postMessage({ jobs, sources, zip }, transfer);
  });
}
