import type { Rotation } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const normalizeRotation = (deg: number): Rotation => ((((deg % 360) + 360) % 360) as Rotation);

export const baseName = (name: string) => name.replace(/\.pdf$/i, '');

export const ensurePdfName = (name: string) => (/\.pdf$/i.test(name) ? name : `${name}.pdf`);

export async function readFileBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

export function isPdfHeader(bytes: Uint8Array): boolean {
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(1024, bytes.length)));
  return head.includes('%PDF-');
}

// Heuristic: encrypted PDFs declare /Encrypt in the trailer near the end of the file.
export function looksEncrypted(bytes: Uint8Array): boolean {
  const tail = new TextDecoder('latin1').decode(bytes.subarray(Math.max(0, bytes.length - 8192)));
  return tail.includes('/Encrypt');
}

export interface RangeResult {
  indices: number[];
  error: null | 'invalid' | 'outOfRange';
}

// Parses "1-3,5,7-10" (1-based) into sorted unique 0-based indices.
export function parseRange(input: string, max: number): RangeResult {
  const text = input.replace(/\s+/g, '');
  const indices = new Set<number>();
  for (const token of text.split(',')) {
    if (!token) continue;
    const m = /^(\d+)(?:-(\d+))?$/.exec(token);
    if (!m) return { indices: [], error: 'invalid' };
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b < a) return { indices: [], error: 'invalid' };
    if (b > max) return { indices: [], error: 'outOfRange' };
    for (let i = a; i <= b; i++) indices.add(i - 1);
  }
  return { indices: [...indices].sort((x, y) => x - y), error: null };
}

// Formats sorted 0-based indices as a compact 1-based range string.
export function formatRange(indices: number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < indices.length) {
    let j = i;
    while (j + 1 < indices.length && indices[j + 1] === indices[j] + 1) j++;
    parts.push(j > i ? `${indices[i] + 1}-${indices[j] + 1}` : `${indices[i] + 1}`);
    i = j + 1;
  }
  return parts.join(',');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
