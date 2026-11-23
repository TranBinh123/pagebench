import type { DocModel } from './types';
import { normalizeRotation } from './utils';

// pageIds === null rotates the whole document.
export function rotatePages(doc: DocModel, pageIds: Set<string> | null, delta: number): DocModel {
  return {
    ...doc,
    pages: doc.pages.map((p) =>
      !pageIds || pageIds.has(p.id) ? { ...p, rotation: normalizeRotation(p.rotation + delta) } : p,
    ),
  };
}
