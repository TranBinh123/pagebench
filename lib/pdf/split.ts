import type { DocModel } from './types';
import { baseName, formatRange, uid } from './utils';

export function splitPages(doc: DocModel, indices: number[]): DocModel {
  return {
    id: uid(),
    name: `${baseName(doc.name)}-p${formatRange(indices)}.pdf`,
    pages: indices.map((i) => ({ ...doc.pages[i], id: uid() })),
  };
}

export function splitEachPage(doc: DocModel): DocModel[] {
  return doc.pages.map((page, i) => ({
    id: uid(),
    name: `${baseName(doc.name)}-p${i + 1}.pdf`,
    pages: [{ ...page, id: uid() }],
  }));
}
