import type { DocModel } from './types';

// Returns null when the deletion would leave the document with no pages.
export function deletePages(doc: DocModel, pageIds: Set<string>): DocModel | null {
  const pages = doc.pages.filter((p) => !pageIds.has(p.id));
  return pages.length === 0 ? null : { ...doc, pages };
}
