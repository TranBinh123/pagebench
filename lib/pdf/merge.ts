import type { DocModel } from './types';
import { uid } from './utils';

export function mergeDocs(docs: DocModel[], name: string): DocModel {
  return { id: uid(), name, pages: docs.flatMap((d) => d.pages) };
}
